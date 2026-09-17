import { supabaseAdmin } from '../config/supabase.ts';

export class TeacherService {
  async listTeachers(schoolId: string) {
    const { data: teachers, error } = await supabaseAdmin
      .from('teachers')
      .select(`
        id,
        school_id,
        name,
        email,
        phone,
        cref,
        specialties,
        status,
        created_at,
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

  async createTeacher(schoolId: string, data: any, createdBy: string) {
    const cleanPhone = data.phone ? data.phone.replace(/\D/g, '') : null;
    const cleanEmail = data.email && data.email.trim() ? data.email.trim().toLowerCase() : null;
    const cleanCref = data.cref && data.cref.trim() ? data.cref.trim().toUpperCase() : null;

    const teacherRecord = {
      school_id: schoolId,
      name: data.name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      cref: cleanCref,
      specialties: Array.isArray(data.specialties) ? data.specialties : [],
      status: data.status || 'ATIVO'
    };

    const { data: newTeacher, error } = await supabaseAdmin
      .from('teachers')
      .insert([teacherRecord])
      .select()
      .single();

    if (error || !newTeacher) {
      console.error('Erro ao cadastrar professor:', error);
      throw new Error(`Falha ao cadastrar professor: ${error?.message}`);
    }

    // Auditoria (Integridade e Rastreabilidade)
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: createdBy,
      action: 'CADASTRAR_PROFESSOR',
      resource: `Professor: ${newTeacher.name}`,
      details: { 
        teacherId: newTeacher.id, 
        name: newTeacher.name,
        email: newTeacher.email,
        cref: newTeacher.cref 
      }
    }]);

    return newTeacher;
  }

  async updateTeacher(teacherId: string, schoolId: string, data: any, updatedBy: string) {
    const dataToUpdate: any = {};
    if (data.name !== undefined) dataToUpdate.name = data.name.trim();
    if (data.email !== undefined) dataToUpdate.email = data.email && data.email.trim() ? data.email.trim().toLowerCase() : null;
    if (data.phone !== undefined) dataToUpdate.phone = data.phone ? data.phone.replace(/\D/g, '') : null;
    if (data.cref !== undefined) dataToUpdate.cref = data.cref && data.cref.trim() ? data.cref.trim().toUpperCase() : null;
    if (data.specialties !== undefined) dataToUpdate.specialties = Array.isArray(data.specialties) ? data.specialties : [];
    if (data.status !== undefined) dataToUpdate.status = data.status;

    const { data: updatedTeacher, error } = await supabaseAdmin
      .from('teachers')
      .update(dataToUpdate)
      .eq('id', teacherId)
      .eq('school_id', schoolId)
      .select()
      .single();

    if (error || !updatedTeacher) {
      console.error('Erro ao atualizar professor:', error);
      throw new Error(`Falha ao atualizar professor: ${error?.message}`);
    }

    // Auditoria
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: updatedBy,
      action: 'ATUALIZAR_PROFESSOR',
      resource: `Professor: ${updatedTeacher.name}`,
      details: { 
        teacherId, 
        updatedFields: Object.keys(dataToUpdate) 
      }
    }]);

    return updatedTeacher;
  }

  async deleteTeacher(teacherId: string, schoolId: string, deletedBy: string) {
    // 1. Obter dados antes de inativar
    const { data: teacher } = await supabaseAdmin
      .from('teachers')
      .select('id, name')
      .eq('id', teacherId)
      .eq('school_id', schoolId)
      .single();

    // 2. Inativar professor (soft delete para integridade histórica)
    const { data: inativado, error } = await supabaseAdmin
      .from('teachers')
      .update({ status: 'INATIVO' })
      .eq('id', teacherId)
      .eq('school_id', schoolId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao inativar professor:', error);
      throw new Error('Falha ao inativar professor');
    }

    // Auditoria
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: deletedBy,
      action: 'INATIVAR_PROFESSOR',
      resource: `Professor: ${teacher?.name || teacherId}`,
      details: { teacherId }
    }]);

    return { message: 'Professor inativado com sucesso.', teacher: inativado };
  }
}

export const teacherService = new TeacherService();
