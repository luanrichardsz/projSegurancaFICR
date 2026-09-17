import { supabaseAdmin } from '../config/supabase.ts';

export class AttendanceService {
  async getClassAttendance(classId: string, date: string, schoolId?: string | null) {
    // 1. Validar existência da turma e isolamento por escola
    if (schoolId) {
      const { data: classData, error: classErr } = await supabaseAdmin
        .from('classes')
        .select('id, name, school_id')
        .eq('id', classId)
        .single();

      if (classErr || !classData || classData.school_id !== schoolId) {
        const err: any = new Error('Turma não encontrada ou acesso não autorizado');
        err.statusCode = 404;
        throw err;
      }
    }

    // 2. Obter alunos matriculados na turma
    const { data: classStudents, error: csErr } = await supabaseAdmin
      .from('class_students')
      .select(`
        student_id,
        students (
          id,
          name,
          shirt_number,
          category,
          status
        )
      `)
      .eq('class_id', classId);

    if (csErr) {
      console.error('Erro ao buscar alunos da turma:', csErr);
      throw new Error('Falha ao buscar alunos da turma');
    }

    // 3. Obter registros de presença existentes para a data
    const { data: existingAttendance } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('class_id', classId)
      .eq('date', date);

    const attendanceMap = new Map<string, string>();
    (existingAttendance || []).forEach((att: any) => {
      let st = att.status;
      if (st === 'FALTA') st = 'AUSENTE';
      if (st === 'FALTA_JUSTIFICADA') st = 'JUSTIFICADO';
      attendanceMap.set(att.student_id, st);
    });

    const list = (classStudents || [])
      .map((cs: any) => cs.students)
      .filter(Boolean)
      .map((s: any) => {
        const recordedStatus = attendanceMap.get(s.id);
        return {
          id: s.id,
          name: s.name,
          shirtNumber: s.shirt_number,
          shirt_number: s.shirt_number,
          category: s.category,
          studentStatus: s.status || 'ATIVO',
          hasRecorded: !!recordedStatus,
          status: recordedStatus || 'PRESENTE' // Padrão PRESENTE para agilizar
        };
      });

    const summary = {
      total: list.length,
      presentes: list.filter((s: any) => s.status === 'PRESENTE').length,
      ausentes: list.filter((s: any) => s.status === 'AUSENTE').length,
      justificados: list.filter((s: any) => s.status === 'JUSTIFICADO').length
    };

    return {
      classId,
      date,
      totalStudents: list.length,
      hasRecorded: (existingAttendance || []).length > 0,
      summary,
      students: list
    };
  }

  async saveAttendance(classId: string, date: string, attendees: { studentId: string; status: string }[], recordedBy: string, schoolId: string) {
    // 1. Validar se a turma existe e pertence à mesma escola do usuário
    const { data: classData, error: classErr } = await supabaseAdmin
      .from('classes')
      .select('id, name, school_id')
      .eq('id', classId)
      .single();

    if (classErr || !classData || classData.school_id !== schoolId) {
      const err: any = new Error('Turma não encontrada ou acesso não autorizado');
      err.statusCode = 404;
      throw err;
    }

    // 2. Desduplicar participantes por studentId
    const uniqueMap = new Map<string, string>();
    for (const a of attendees) {
      let st = a.status;
      if (st === 'FALTA') st = 'AUSENTE';
      if (st === 'FALTA_JUSTIFICADA' || st === 'JUSTIFICADA') st = 'JUSTIFICADO';
      uniqueMap.set(a.studentId, st);
    }

    // 3. Deletar registros anteriores desta turma e data para evitar duplicidade
    const { error: delErr } = await supabaseAdmin
      .from('attendance')
      .delete()
      .eq('class_id', classId)
      .eq('date', date);

    if (delErr) {
      console.error('Erro ao limpar registros anteriores de presença:', delErr);
      throw new Error(`Falha ao sincronizar chamada: ${delErr.message}`);
    }

    // 4. Inserir novos registros
    const recordsToInsert = Array.from(uniqueMap.entries()).map(([studentId, status]) => ({
      class_id: classId,
      student_id: studentId,
      date,
      status,
      recorded_by: recordedBy
    }));

    if (recordsToInsert.length > 0) {
      const { error: insErr } = await supabaseAdmin
        .from('attendance')
        .insert(recordsToInsert);

      if (insErr) {
        console.error('Erro ao salvar presença no banco:', insErr);
        throw new Error(`Falha ao registrar chamada: ${insErr.message}`);
      }
    }

    const presentesCount = recordsToInsert.filter(a => a.status === 'PRESENTE').length;
    const ausentesCount = recordsToInsert.filter(a => a.status === 'AUSENTE').length;
    const justificadosCount = recordsToInsert.filter(a => a.status === 'JUSTIFICADO').length;

    // 5. Trilha de Auditoria (Integridade - CID)
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: recordedBy,
      action: 'REGISTRAR_CHAMADA',
      resource: `Chamada: ${classData.name} (${date})`,
      details: {
        classId,
        className: classData.name,
        date,
        totalAtletas: recordsToInsert.length,
        presentes: presentesCount,
        ausentes: ausentesCount,
        justificados: justificadosCount
      }
    }]);

    return { 
      message: 'Chamada registrada com sucesso.', 
      date,
      total: recordsToInsert.length,
      presentes: presentesCount,
      ausentes: ausentesCount,
      justificados: justificadosCount
    };
  }
}

export const attendanceService = new AttendanceService();
