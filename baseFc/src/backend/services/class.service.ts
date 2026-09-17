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
          name
        ),
        class_students (
          students (
            id,
            name,
            cpf,
            category,
            shirt_number,
            status
          )
        )
      `)
      .eq('id', classId)
      .single();

    if (error || !classData) {
      throw new Error('Turma não encontrada');
    }

    const students = (classData.class_students || [])
      .map((cs: any) => cs.students)
      .filter(Boolean)
      .map((s: any) => ({
        ...s,
        shirtNumber: s.shirt_number
      }));

    return {
      ...classData,
      schoolId: classData.school_id,
      teacherId: classData.teacher_id,
      daysOfWeek: classData.days_of_week,
      startTime: classData.start_time,
      endTime: classData.end_time,
      teacherName: classData.teachers?.name || 'Sem Professor',
      enrolledCount: students.length,
      availableSlots: Math.max(0, classData.capacity - students.length),
      isFull: students.length >= classData.capacity,
      students
    };
  }

  async createClass(schoolId: string, data: any, createdBy: string) {
    const classRecord = {
      school_id: schoolId,
      teacher_id: data.teacherId || null,
      name: data.name,
      category: data.category,
      days_of_week: data.daysOfWeek,
      start_time: data.startTime,
      end_time: data.endTime,
      location: data.location || 'Campo Principal',
      capacity: data.capacity || 25,
      status: data.status || 'ATIVO'
    };

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
