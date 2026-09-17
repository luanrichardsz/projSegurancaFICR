import { supabaseAdmin } from '../config/supabase.ts';

export class AttendanceService {
  async getClassAttendance(classId: string, date: string) {
    // 1. Obter alunos matriculados na turma
    const { data: classStudents, error: csErr } = await supabaseAdmin
      .from('class_students')
      .select(`
        student_id,
        students (
          id,
          name,
          shirt_number,
          category
        )
      `)
      .eq('class_id', classId);

    if (csErr) {
      throw new Error('Falha ao buscar alunos da turma');
    }

    // 2. Obter registros de presença existentes para a data
    const { data: existingAttendance } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('class_id', classId)
      .eq('date', date);

    const attendanceMap = new Map();
    (existingAttendance || []).forEach((att: any) => {
      attendanceMap.set(att.student_id, att.status);
    });

    const list = (classStudents || [])
      .map((cs: any) => cs.students)
      .filter(Boolean)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        shirtNumber: s.shirt_number,
        category: s.category,
        status: attendanceMap.get(s.id) || 'PRESENTE' // Padrão PRESENTE para agilizar a chamada
      }));

    return {
      classId,
      date,
      totalStudents: list.length,
      students: list
    };
  }

  async saveAttendance(classId: string, date: string, attendees: { studentId: string; status: string }[], recordedBy: string, schoolId: string) {
    // 1. Deletar registros anteriores desta turma e data para evitar duplicidade
    await supabaseAdmin
      .from('attendance')
      .delete()
      .eq('class_id', classId)
      .eq('date', date);

    // 2. Inserir novos registros
    const recordsToInsert = attendees.map(a => ({
      class_id: classId,
      student_id: a.studentId,
      date,
      status: a.status,
      recorded_by: recordedBy
    }));

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .insert(recordsToInsert)
      .select();

    if (error) {
      console.error('Erro ao salvar presença:', error);
      throw new Error(`Falha ao registrar chamada: ${error.message}`);
    }

    // 3. Buscar nome da turma para auditoria
    const { data: classData } = await supabaseAdmin
      .from('classes')
      .select('name')
      .eq('id', classId)
      .single();

    // 4. Trilha de Auditoria (Integridade - CID)
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: recordedBy,
      action: 'REGISTRAR_CHAMADA',
      resource: `Chamada: ${classData?.name || classId} (${date})`,
      details: {
        classId,
        date,
        totalAtletas: attendees.length,
        presentes: attendees.filter(a => a.status === 'PRESENTE').length,
        faltas: attendees.filter(a => a.status === 'AUSENTE').length
      }
    }]);

    return { message: 'Chamada registrada com sucesso.', total: data?.length };
  }
}

export const attendanceService = new AttendanceService();
