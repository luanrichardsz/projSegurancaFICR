import { supabaseAdmin } from '../config/supabase.ts';

export class StudentService {
  async createStudent(schoolId: string, studentData: any, createdBy: string) {
    const studentRecord = {
      school_id: schoolId,
      name: studentData.name,
      cpf: studentData.cpf,
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

    if (error) {
      console.error('Erro ao cadastrar aluno no Supabase:', error);
      throw new Error(`Falha ao cadastrar aluno: ${error.message}`);
    }

    // Registrar na Trilha de Auditoria (Integridade - CID)
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: createdBy,
      action: 'CREATE_STUDENT',
      resource: newStudent.id,
      details: { name: newStudent.name, cpf: newStudent.cpf }
    }]);

    return {
      ...newStudent,
      schoolId: newStudent.school_id,
      dominantFoot: newStudent.dominant_foot,
      shirtNumber: newStudent.shirt_number,
      enrolledAt: newStudent.enrolled_at
    };
  }

  async getStudentsBySchool(schoolId: string) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('school_id', schoolId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar alunos no Supabase:', error);
      throw new Error('Falha ao listar alunos');
    }

    return (data || []).map(s => ({
      ...s,
      schoolId: s.school_id,
      dominantFoot: s.dominant_foot,
      shirtNumber: s.shirt_number,
      enrolledAt: s.enrolled_at
    }));
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
}

export const studentService = new StudentService();
