import { supabaseAdmin } from '../config/supabase.ts';

export class TeacherService {
  async listTeachers(schoolId: string) {
    const { data: teachers, error } = await supabaseAdmin
      .from('teachers')
      .select(`
        *,
        classes (
          id,
          name,
          category
        )
      `)
      .eq('school_id', schoolId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao listar professores:', error);
      throw new Error('Falha ao listar professores');
    }

    return teachers || [];
  }

  async createTeacher(schoolId: string, data: { name: string; email?: string; phone?: string; specialty?: string }, createdBy: string) {
    const { data: newTeacher, error } = await supabaseAdmin
      .from('teachers')
      .insert([{
        school_id: schoolId,
        name: data.name
      }])
      .select()
      .single();

    if (error || !newTeacher) {
      console.error('Erro ao cadastrar professor:', error);
      throw new Error(`Falha ao cadastrar professor: ${error?.message}`);
    }

    // Auditoria
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: createdBy,
      action: 'CADASTRAR_PROFESSOR',
      resource: `Professor: ${newTeacher.name}`,
      details: { teacherId: newTeacher.id, name: newTeacher.name }
    }]);

    return newTeacher;
  }
}

export const teacherService = new TeacherService();
