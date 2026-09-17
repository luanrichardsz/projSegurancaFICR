import { supabaseAdmin } from '../config/supabase.ts';

export class StudentService {
  async createStudent(schoolId: string, studentData: any, createdBy: string) {
    // 1. Inserir Aluno
    const studentRecord = {
      school_id: schoolId,
      name: studentData.name,
      cpf: (studentData.cpf && studentData.cpf.trim()) ? studentData.cpf.replace(/\D/g, '') : '00000000000',
      dob: studentData.dob,
      category: studentData.category,
      position: studentData.position,
      dominant_foot: studentData.dominantFoot,
      shirt_number: studentData.shirtNumber,
      status: studentData.status || 'ATIVO',
      enrolled_at: new Date().toISOString()
    };

    const { data: newStudent, error } = await supabaseAdmin
      .from('students')
      .insert([studentRecord])
      .select()
      .single();

    if (error || !newStudent) {
      console.error('Erro ao cadastrar aluno no Supabase:', error);
      throw new Error(`Falha ao cadastrar aluno: ${error?.message}`);
    }

    // 2. Inserir Responsável (se fornecido)
    if (studentData.guardian && studentData.guardian.name) {
      const { data: newGuardian } = await supabaseAdmin
        .from('guardians')
        .insert([{
          school_id: schoolId,
          name: studentData.guardian.name,
          cpf: studentData.guardian.cpf || null,
          phone: studentData.guardian.phone,
        }])
        .select()
        .single();

      if (newGuardian) {
        await supabaseAdmin.from('guardian_students').insert([{
          guardian_id: newGuardian.id,
          student_id: newStudent.id
        }]);
      }
    }

    // 3. Inserir Contato de Emergência (se fornecido)
    if (studentData.emergencyContact && studentData.emergencyContact.name) {
      await supabaseAdmin.from('emergency_contacts').insert([{
        student_id: newStudent.id,
        name: studentData.emergencyContact.name,
        relationship: studentData.emergencyContact.relationship || 'Responsável',
        phone: studentData.emergencyContact.phone,
        is_main: true,
        authorized_pickup: studentData.emergencyContact.authorizedPickup ?? true,
        notes: studentData.emergencyContact.notes || null
      }]);
    }

    // 4. Matricular em Turma (se fornecido)
    if (studentData.classId) {
      // Verificar capacidade máxima da turma
      const { data: targetClass } = await supabaseAdmin
        .from('classes')
        .select('capacity')
        .eq('id', studentData.classId)
        .single();

      const { count } = await supabaseAdmin
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', studentData.classId);

      if (targetClass && count !== null && count >= targetClass.capacity) {
        throw new Error(`Turma cheia: limite de ${targetClass.capacity} atletas atingido.`);
      }

      await supabaseAdmin.from('class_students').insert([{
        class_id: studentData.classId,
        student_id: newStudent.id
      }]);
    }

    // 5. Registrar na Trilha de Auditoria (Integridade - CID)
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: createdBy,
      action: 'CADASTRAR_ALUNO',
      resource: `Aluno: ${newStudent.name}`,
      details: { 
        studentId: newStudent.id, 
        name: newStudent.name, 
        category: newStudent.category,
        shirtNumber: newStudent.shirt_number 
      }
    }]);

    return {
      ...newStudent,
      schoolId: newStudent.school_id,
      dominantFoot: newStudent.dominant_foot,
      shirtNumber: newStudent.shirt_number,
      enrolledAt: newStudent.enrolled_at
    };
  }

  async getStudentsBySchool(schoolId: string, filters?: { search?: string; category?: string; status?: string }) {
    let query = supabaseAdmin
      .from('students')
      .select(`
        *,
        class_students (
          class_id,
          classes (
            id,
            name,
            category
          )
        )
      `)
      .eq('school_id', schoolId)
      .order('name', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar alunos no Supabase:', error);
      throw new Error('Falha ao listar alunos');
    }

    return (data || []).map(s => {
      const enrolledClasses = (s.class_students || []).map((cs: any) => cs.classes).filter(Boolean);
      return {
        ...s,
        schoolId: s.school_id,
        dominantFoot: s.dominant_foot,
        shirtNumber: s.shirt_number,
        enrolledAt: s.enrolled_at,
        classes: enrolledClasses,
        className: enrolledClasses.length > 0 ? enrolledClasses[0].name : 'Sem Turma'
      };
    });
  }

  async getStudentById(studentId: string) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error || !data) {
      throw new Error('Aluno não encontrado');
    }

    return {
      ...data,
      schoolId: data.school_id,
      dominantFoot: data.dominant_foot,
      shirtNumber: data.shirt_number,
      enrolledAt: data.enrolled_at
    };
  }

  async getStudentProfile(studentId: string) {
    // 1. Dados básicos
    const student = await this.getStudentById(studentId);

    // 2. Responsáveis
    const { data: guardianLinks } = await supabaseAdmin
      .from('guardian_students')
      .select('guardians (*)')
      .eq('student_id', studentId);

    const guardians = (guardianLinks || []).map((gl: any) => gl.guardians).filter(Boolean);

    // 3. Contatos de Emergência
    const { data: emergencyContacts } = await supabaseAdmin
      .from('emergency_contacts')
      .select('*')
      .eq('student_id', studentId);

    // 4. Turmas
    const { data: classLinks } = await supabaseAdmin
      .from('class_students')
      .select('classes (*)')
      .eq('student_id', studentId);

    const classes = (classLinks || []).map((cl: any) => cl.classes).filter(Boolean);

    // 5. Mensalidades
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .order('due_date', { ascending: false });

    // 6. Frequência
    const { data: attendanceRecords } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    const totalTrainings = attendanceRecords?.length || 0;
    const presences = attendanceRecords?.filter(a => a.status === 'PRESENTE').length || 0;
    const absences = attendanceRecords?.filter(a => a.status === 'AUSENTE').length || 0;
    const justified = attendanceRecords?.filter(a => a.status === 'JUSTIFICADO').length || 0;
    const attendanceRate = totalTrainings > 0 ? Math.round((presences / totalTrainings) * 100) : 100;

    return {
      student,
      guardians,
      emergencyContacts: emergencyContacts || [],
      classes,
      payments: payments || [],
      attendance: {
        totalTrainings,
        presences,
        absences,
        justified,
        attendanceRate,
        history: attendanceRecords || []
      }
    };
  }

  async updateStudent(studentId: string, schoolId: string, updateData: any, userId: string) {
    const dataToUpdate: any = {};
    if (updateData.name) dataToUpdate.name = updateData.name;
    if (updateData.cpf !== undefined) dataToUpdate.cpf = updateData.cpf || null;
    if (updateData.dob) dataToUpdate.dob = updateData.dob;
    if (updateData.category) dataToUpdate.category = updateData.category;
    if (updateData.position) dataToUpdate.position = updateData.position;
    if (updateData.dominantFoot) dataToUpdate.dominant_foot = updateData.dominantFoot;
    if (updateData.shirtNumber) dataToUpdate.shirt_number = updateData.shirtNumber;
    if (updateData.status) dataToUpdate.status = updateData.status;

    const { data: updated, error } = await supabaseAdmin
      .from('students')
      .update(dataToUpdate)
      .eq('id', studentId)
      .eq('school_id', schoolId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar aluno:', error);
      throw new Error(`Falha ao atualizar aluno: ${error.message}`);
    }

    // Auditoria
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: userId,
      action: 'ATUALIZAR_ALUNO',
      resource: `Aluno: ${updated.name}`,
      details: { studentId, changes: dataToUpdate }
    }]);

    return updated;
  }

  async deleteStudent(studentId: string, schoolId: string, userId: string) {
    // Para segurança e integridade, inativamos o aluno
    const { data: inativado, error } = await supabaseAdmin
      .from('students')
      .update({ status: 'INATIVO' })
      .eq('id', studentId)
      .eq('school_id', schoolId)
      .select()
      .single();

    if (error) {
      throw new Error('Falha ao inativar aluno');
    }

    // Auditoria
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: userId,
      action: 'INATIVAR_ALUNO',
      resource: `Aluno: ${inativado.name}`,
      details: { studentId }
    }]);

    return { message: 'Aluno inativado com sucesso.' };
  }
}

export const studentService = new StudentService();
