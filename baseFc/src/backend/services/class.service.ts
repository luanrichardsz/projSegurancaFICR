import { supabaseAdmin } from '../config/supabase.ts';

export class ClassService {
  async listClasses(schoolId: string) {
    const { data: classes, error } = await supabaseAdmin
      .from('classes')
      .select(`
        *,
        teachers (
          id,
          name
        ),
        class_students (
          student_id
        )
      `)
      .eq('school_id', schoolId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao listar turmas:', error);
      throw new Error('Falha ao listar turmas');
    }

    return (classes || []).map((c: any) => {
      const enrolledCount = (c.class_students || []).length;
      return {
        ...c,
        schoolId: c.school_id,
        teacherId: c.teacher_id,
        daysOfWeek: c.days_of_week,
        startTime: c.start_time,
        endTime: c.end_time,
        teacherName: c.teachers?.name || 'Sem Professor',
        enrolledCount,
        availableSlots: Math.max(0, c.capacity - enrolledCount),
        isFull: enrolledCount >= c.capacity
      };
    });
  }

  async getClassById(classId: string) {
    const { data: classData, error } = await supabaseAdmin
      .from('classes')
      .select(`
        *,
        teachers (
          id,
          name,
          email,
          phone,
          cref,
          specialties,
          status
        ),
        class_students (
          students (
            id,
            name,
            cpf,
            category,
            shirt_number,
            status,
            dob,
            phone,
            address,
            position,
            dominant_foot,
            medical_restrictions,
            allergies,
            medications,
            enrolled_at
          )
        )
      `)
      .eq('id', classId)
      .single();

    if (error || !classData) {
      throw new Error('Turma não encontrada');
    }

    const rawStudents = (classData.class_students || [])
      .map((cs: any) => cs.students)
      .filter(Boolean);

    const studentIds = rawStudents.map((s: any) => s.id);

    // Buscar responsáveis e contatos de emergência em paralelo
    const guardiansMap: Record<string, any[]> = {};
    const emergencyMap: Record<string, any[]> = {};

    if (studentIds.length > 0) {
      const [guardiansRes, emergencyRes] = await Promise.all([
        supabaseAdmin
          .from('guardian_students')
          .select('student_id, guardians (id, name, phone, cpf)')
          .in('student_id', studentIds),
        supabaseAdmin
          .from('emergency_contacts')
          .select('*')
          .in('student_id', studentIds)
      ]);

      if (guardiansRes.data) {
        guardiansRes.data.forEach((item: any) => {
          if (!guardiansMap[item.student_id]) guardiansMap[item.student_id] = [];
          if (item.guardians) guardiansMap[item.student_id].push(item.guardians);
        });
      }

      if (emergencyRes.data) {
        emergencyRes.data.forEach((contact: any) => {
          if (!emergencyMap[contact.student_id]) emergencyMap[contact.student_id] = [];
          emergencyMap[contact.student_id].push(contact);
        });
      }
    }

    const students = rawStudents.map((s: any) => {
      const studentGuardians = guardiansMap[s.id] || [];
      const studentEmergency = emergencyMap[s.id] || [];
      const primaryGuardian = studentGuardians[0] || null;
      const primaryEmergency = studentEmergency.find((c: any) => c.is_main) || studentEmergency[0] || null;
      const hasMedicalAlert = !!(s.medical_restrictions || s.allergies || s.medications);
      const authorizedPickupCount = studentEmergency.filter((c: any) => c.authorized_pickup).length;

      return {
        ...s,
        shirtNumber: s.shirt_number,
        dominantFoot: s.dominant_foot,
        medicalRestrictions: s.medical_restrictions,
        enrolledAt: s.enrolled_at,
        guardians: studentGuardians,
        primaryGuardian,
        emergencyContacts: studentEmergency,
        primaryEmergencyContact: primaryEmergency,
        hasMedicalAlert,
        authorizedPickupCount
      };
    });

    return {
      ...classData,
      schoolId: classData.school_id,
      teacherId: classData.teacher_id,
      daysOfWeek: classData.days_of_week,
      startTime: classData.start_time,
      endTime: classData.end_time,
      teacher: classData.teachers || null,
      teacherName: classData.teachers?.name || 'Sem Professor',
      teacherEmail: classData.teachers?.email || null,
      teacherPhone: classData.teachers?.phone || null,
      teacherCref: classData.teachers?.cref || null,
      enrolledCount: students.length,
      availableSlots: Math.max(0, classData.capacity - students.length),
      isFull: students.length >= classData.capacity,
      students
    };
  }

  async checkTeacherScheduleConflict(
    schoolId: string,
    teacherId: string,
    daysOfWeek: string[],
    startTime: string,
    endTime: string,
    excludeClassId?: string
  ) {
    if (!teacherId || !daysOfWeek || daysOfWeek.length === 0 || !startTime || !endTime) {
      return null;
    }

    const newStart = startTime.slice(0, 5);
    const newEnd = endTime.slice(0, 5);

    if (newStart >= newEnd) {
      const err: any = new Error('O horário de término deve ser posterior ao horário de início.');
      err.statusCode = 400;
      throw err;
    }

    let query = supabaseAdmin
      .from('classes')
      .select('id, name, days_of_week, start_time, end_time, status')
      .eq('school_id', schoolId)
      .eq('teacher_id', teacherId)
      .neq('status', 'INATIVO');

    if (excludeClassId) {
      query = query.neq('id', excludeClassId);
    }

    const { data: teacherClasses, error } = await query;

    if (error) {
      console.error('Erro ao verificar agenda do professor:', error);
      throw new Error('Falha ao verificar horários do professor');
    }

    if (!teacherClasses || teacherClasses.length === 0) {
      return null;
    }

    for (const existing of teacherClasses) {
      const existingDays: string[] = existing.days_of_week || [];
      const commonDays = daysOfWeek.filter(day => existingDays.includes(day));

      if (commonDays.length > 0) {
        const existStart = (existing.start_time || '').slice(0, 5);
        const existEnd = (existing.end_time || '').slice(0, 5);

        // Sobreposição de intervalos: newStart < existEnd && existStart < newEnd
        const isOverlapping = (newStart < existEnd) && (existStart < newEnd);

        if (isOverlapping) {
          const { data: teacherData } = await supabaseAdmin
            .from('teachers')
            .select('name')
            .eq('id', teacherId)
            .single();
          const teacherName = teacherData?.name ? `O professor ${teacherData.name}` : 'O professor';

          const err: any = new Error(
            `Conflito de agenda: ${teacherName} já possui aula na turma "${existing.name}" ` +
            `nos dias [${commonDays.join(', ')}] das ${existStart} às ${existEnd}.`
          );
          err.statusCode = 400;
          throw err;
        }
      }
    }

    return null;
  }

  async updateClass(classId: string, schoolId: string, data: any, updatedBy: string) {
    // 1. Verificar se a turma pertence à escola
    const { data: existingClass, error: findError } = await supabaseAdmin
      .from('classes')
      .select('id, name, school_id, teacher_id, days_of_week, start_time, end_time')
      .eq('id', classId)
      .single();

    if (findError || !existingClass) {
      throw new Error('Turma não encontrada');
    }

    if (existingClass.school_id !== schoolId) {
      throw new Error('Acesso negado: Turma de outra instituição');
    }

    // 2. Montar objeto de atualização
    const updateRecord: any = {};

    if (data.teacherId !== undefined || data.teacher_id !== undefined) {
      const rawTeacher = data.teacherId !== undefined ? data.teacherId : data.teacher_id;
      updateRecord.teacher_id = (rawTeacher && typeof rawTeacher === 'string' && rawTeacher.trim()) ? rawTeacher.trim() : null;
    }

    if (data.name !== undefined) updateRecord.name = data.name.trim();
    if (data.category !== undefined) updateRecord.category = data.category;
    if (data.daysOfWeek !== undefined) updateRecord.days_of_week = data.daysOfWeek;
    if (data.days_of_week !== undefined) updateRecord.days_of_week = data.days_of_week;
    if (data.startTime !== undefined) updateRecord.start_time = data.startTime;
    if (data.start_time !== undefined) updateRecord.start_time = data.start_time;
    if (data.endTime !== undefined) updateRecord.end_time = data.endTime;
    if (data.end_time !== undefined) updateRecord.end_time = data.end_time;
    if (data.location !== undefined) updateRecord.location = data.location.trim();
    if (data.capacity !== undefined) updateRecord.capacity = Number(data.capacity);
    if (data.status !== undefined) updateRecord.status = data.status;

    // 3. Validar se há conflito de agenda do professor para esta turma
    const effectiveTeacherId = updateRecord.teacher_id !== undefined ? updateRecord.teacher_id : existingClass.teacher_id;
    const effectiveDays = updateRecord.days_of_week !== undefined ? updateRecord.days_of_week : existingClass.days_of_week;
    const effectiveStart = updateRecord.start_time !== undefined ? updateRecord.start_time : existingClass.start_time;
    const effectiveEnd = updateRecord.end_time !== undefined ? updateRecord.end_time : existingClass.end_time;

    if (effectiveTeacherId) {
      await this.checkTeacherScheduleConflict(
        schoolId,
        effectiveTeacherId,
        effectiveDays,
        effectiveStart,
        effectiveEnd,
        classId
      );
    }

    const { data: updatedClass, error: updateError } = await supabaseAdmin
      .from('classes')
      .update(updateRecord)
      .eq('id', classId)
      .select(`
        *,
        teachers (
          id,
          name,
          email,
          phone,
          cref
        )
      `)
      .single();

    if (updateError || !updatedClass) {
      console.error('Erro ao atualizar turma:', updateError);
      throw new Error(`Falha ao atualizar turma: ${updateError?.message}`);
    }

    // 4. Auditoria (Integridade e Rastreabilidade CID)
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: updatedBy,
      action: 'ATUALIZAR_TURMA',
      resource: `Turma: ${updatedClass.name}`,
      details: {
        classId,
        updatedFields: Object.keys(updateRecord),
        teacherId: updatedClass.teacher_id,
        teacherName: updatedClass.teachers?.name || 'Sem Professor'
      }
    }]);

    return {
      ...updatedClass,
      schoolId: updatedClass.school_id,
      teacherId: updatedClass.teacher_id,
      daysOfWeek: updatedClass.days_of_week,
      startTime: updatedClass.start_time,
      endTime: updatedClass.end_time,
      teacher: updatedClass.teachers || null,
      teacherName: updatedClass.teachers?.name || 'Sem Professor'
    };
  }

  async createClass(schoolId: string, data: any, createdBy: string) {
    const rawTeacher = data.teacherId || data.teacher_id;
    const days = data.daysOfWeek || data.days_of_week;
    const start = data.startTime || data.start_time;
    const end = data.endTime || data.end_time;

    const classRecord = {
      school_id: schoolId,
      teacher_id: (rawTeacher && typeof rawTeacher === 'string' && rawTeacher.trim()) ? rawTeacher.trim() : null,
      name: data.name.trim(),
      category: data.category,
      days_of_week: days,
      start_time: start,
      end_time: end,
      location: (data.location && data.location.trim()) ? data.location.trim() : 'Campo Principal',
      capacity: Number(data.capacity) || 25,
      status: data.status || 'ATIVO'
    };

    // Validar conflito de agenda do professor antes de criar a turma
    if (classRecord.teacher_id) {
      await this.checkTeacherScheduleConflict(
        schoolId,
        classRecord.teacher_id,
        classRecord.days_of_week,
        classRecord.start_time,
        classRecord.end_time
      );
    }

    const { data: newClass, error } = await supabaseAdmin
      .from('classes')
      .insert([classRecord])
      .select()
      .single();

    if (error || !newClass) {
      console.error('Erro ao criar turma:', error);
      throw new Error(`Falha ao criar turma: ${error?.message}`);
    }

    // Auditoria
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: createdBy,
      action: 'CRIAR_TURMA',
      resource: `Turma: ${newClass.name}`,
      details: { classId: newClass.id, capacity: newClass.capacity }
    }]);

    return newClass;
  }

  async enrollStudent(classId: string, studentId: string, schoolId: string, userId: string) {
    // 1. Buscar a turma e validar capacidade máxima
    const { data: targetClass, error: classErr } = await supabaseAdmin
      .from('classes')
      .select('id, name, capacity, school_id')
      .eq('id', classId)
      .single();

    if (classErr || !targetClass) {
      throw new Error('Turma não encontrada');
    }

    if (targetClass.school_id !== schoolId) {
      throw new Error('Acesso negado: Turma de outra instituição');
    }

    // Contar alunos atualmente matriculados
    const { count, error: countErr } = await supabaseAdmin
      .from('class_students')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId);

    if (countErr) {
      throw new Error('Erro ao validar capacidade da turma');
    }

    const currentCount = count || 0;
    // REGRA DE INTEGRIDADE NO BACKEND: Capacidade Máxima
    if (currentCount >= targetClass.capacity) {
      const err: any = new Error(`Turma cheia: A turma atingiu a capacidade máxima de ${targetClass.capacity} alunos.`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Verificar se o aluno já está matriculado nesta turma
    const { data: existing } = await supabaseAdmin
      .from('class_students')
      .select('*')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing) {
      const err: any = new Error('O aluno já está matriculado nesta turma.');
      err.statusCode = 400;
      throw err;
    }

    // 3. Efetuar a matrícula
    const { error: insertErr } = await supabaseAdmin
      .from('class_students')
      .insert([{
        class_id: classId,
        student_id: studentId
      }]);

    if (insertErr) {
      throw new Error(`Falha ao matricular aluno: ${insertErr.message}`);
    }

    // Buscar nome do aluno para o log de auditoria
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('name')
      .eq('id', studentId)
      .single();

    // 4. Registrar na Trilha de Auditoria (Integridade - CID)
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: userId,
      action: 'MATRICULAR_ALUNO_TURMA',
      resource: `Turma: ${targetClass.name}`,
      details: { 
        classId, 
        studentId, 
        studentName: student?.name || 'Aluno',
        newEnrolledCount: currentCount + 1,
        capacity: targetClass.capacity 
      }
    }]);

    return { 
      message: 'Aluno matriculado com sucesso.', 
      enrolledCount: currentCount + 1, 
      capacity: targetClass.capacity 
    };
  }

  async unenrollStudent(classId: string, studentId: string, schoolId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('class_students')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId);

    if (error) {
      throw new Error('Falha ao desmatricular aluno');
    }

    // Auditoria
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: userId,
      action: 'DESMATRICULAR_ALUNO_TURMA',
      resource: `Turma ID: ${classId}`,
      details: { classId, studentId }
    }]);

    return { message: 'Aluno removido da turma com sucesso.' };
  }
}

export const classService = new ClassService();
