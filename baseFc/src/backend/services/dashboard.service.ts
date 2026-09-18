import { supabaseAdmin } from '../config/supabase.ts';

export class DashboardService {
  async getMetrics(schoolId: string) {
    // 1. Alunos Ativos
    const { count: activeStudents } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('status', 'ATIVO');

    // 2. Turmas Abertas
    const { count: totalClasses } = await supabaseAdmin
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('status', 'ATIVO');

    // 3. Mensalidades
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select(`
        amount,
        status,
        due_date,
        students!inner (
          school_id
        )
      `)
      .eq('students.school_id', schoolId);

    const today = new Date().toISOString().slice(0, 10);
    const allPayments = payments || [];
    const paidList = allPayments.filter((p: any) => p.status === 'PAGO');
    const pendingList = allPayments.filter((p: any) => p.status === 'PENDENTE' && p.due_date >= today);
    const overdueList = allPayments.filter((p: any) => p.status === 'ATRASADO' || (p.status === 'PENDENTE' && p.due_date < today));

    const totalReceived = paidList.reduce((acc: number, cur: any) => acc + Number(cur.amount || 0), 0);

    // 4. Próximos Treinos (Turmas cadastradas)
    const { data: classes } = await supabaseAdmin
      .from('classes')
      .select(`
        id,
        name,
        category,
        days_of_week,
        start_time,
        end_time,
        location,
        teachers (
          name
        )
      `)
      .eq('school_id', schoolId)
      .eq('status', 'ATIVO')
      .limit(6);

    const mappedClasses = (classes || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      daysOfWeek: c.days_of_week,
      startTime: c.start_time,
      endTime: c.end_time,
      location: c.location,
      teacherName: c.teachers?.name || 'Técnico'
    }));

    return {
      activeStudents: activeStudents || 0,
      totalClasses: totalClasses || 0,
      overduePayments: overdueList.length,
      monthRevenue: totalReceived,
      paymentsSummary: {
        paid: paidList.length,
        pending: pendingList.length,
        overdue: overdueList.length
      },
      upcomingTrainings: mappedClasses
    };
  }

  async getGuardianDashboard(userId: string, userEmail?: string, schoolId?: string | null, userMetadata?: any) {
    const targetSchoolId = schoolId || '00000000-0000-0000-0000-000000000001';

    // 1. Garantir que o usuário exista em public.users
    if (userEmail) {
      try {
        await supabaseAdmin.from('users').upsert({
          id: userId,
          email: userEmail.toLowerCase().trim(),
          role: 'RESPONSAVEL',
          school_id: targetSchoolId,
          status: 'ATIVO'
        }, { onConflict: 'id' });
      } catch (ignore) {}
    }

    // 2. Localizar registros de responsável vinculados ao user_id
    let { data: guardianList } = await supabaseAdmin
      .from('guardians')
      .select('id, name, phone, school_id, user_id')
      .eq('user_id', userId);

    // 3. Auto-cura / Auto-vínculo: caso ainda não haja vínculo para este user_id, buscar por nome de metadata ou telefone
    if (!guardianList || guardianList.length === 0) {
      const userName = userMetadata?.name || '';
      if (userName) {
        const firstName = userName.split(' ')[0].trim();
        const { data: unlinked } = await supabaseAdmin
          .from('guardians')
          .select('id, name, phone, school_id, user_id')
          .is('user_id', null)
          .ilike('name', `%${firstName}%`);

        if (unlinked && unlinked.length > 0) {
          for (const u of unlinked) {
            await supabaseAdmin
              .from('guardians')
              .update({ user_id: userId })
              .eq('id', u.id);
          }
          const { data: reloaded } = await supabaseAdmin
            .from('guardians')
            .select('id, name, phone, school_id, user_id')
            .eq('user_id', userId);
          guardianList = reloaded || [];
        }
      }
    }

    if (!guardianList || guardianList.length === 0) {
      return {
        guardian: {
          id: userId,
          name: userMetadata?.name || userEmail?.split('@')[0] || 'Responsável',
          phone: '',
          school_id: targetSchoolId
        },
        students: []
      };
    }

    const primaryGuardian = guardianList[0];
    const guardianIds = guardianList.map(g => g.id);

    // 4. Buscar vínculos com alunos em todos os registros de responsável deste usuário
    const { data: guardianStudents } = await supabaseAdmin
      .from('guardian_students')
      .select(`
        student_id,
        students (
          id,
          name,
          dob,
          cpf,
          phone,
          category,
          position,
          dominant_foot,
          shirt_number,
          status,
          allergies,
          medical_restrictions,
          medications,
          enrolled_at
        )
      `)
      .in('guardian_id', guardianIds);

    const studentsData: any[] = [];
    const seenStudentIds = new Set<string>();

    for (const gs of guardianStudents || []) {
      const student: any = gs.students;
      if (!student || seenStudentIds.has(student.id)) continue;
      seenStudentIds.add(student.id);

      const studentId = student.id;

      // a. Turmas do aluno
      const { data: classLinks } = await supabaseAdmin
        .from('class_students')
        .select(`
          classes (
            id,
            name,
            category,
            days_of_week,
            start_time,
            end_time,
            location,
            teachers (
              name
            )
          )
        `)
        .eq('student_id', studentId);

      const enrolledClasses = (classLinks || []).map((cl: any) => {
        const c = cl.classes;
        if (!c) return null;
        return {
          id: c.id,
          name: c.name,
          category: c.category,
          daysOfWeek: c.days_of_week,
          startTime: c.start_time,
          endTime: c.end_time,
          location: c.location,
          teacherName: c.teachers?.name || 'Treinador da Base'
        };
      }).filter(Boolean);

      // b. Frequência / Presença
      const { data: attendanceRecords } = await supabaseAdmin
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });

      const totalTrainings = attendanceRecords?.length || 0;
      const presences = attendanceRecords?.filter((a: any) => a.status === 'PRESENTE').length || 0;
      const absences = attendanceRecords?.filter((a: any) => a.status === 'AUSENTE').length || 0;
      const justified = attendanceRecords?.filter((a: any) => a.status === 'JUSTIFICADO').length || 0;
      const attendanceRate = totalTrainings > 0 ? Math.round((presences / totalTrainings) * 100) : 100;

      // c. Mensalidades do Aluno
      const { data: payments } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .order('due_date', { ascending: false });

      const today = new Date().toISOString().slice(0, 10);
      const studentPayments = payments || [];
      const hasOverdue = studentPayments.some((p: any) => p.status === 'ATRASADO' || (p.status === 'PENDENTE' && p.due_date < today));
      const hasPending = studentPayments.some((p: any) => p.status === 'PENDENTE' && p.due_date >= today);

      let financialStatus: 'EM_DIA' | 'PENDENTE' | 'ATRASADO' = 'EM_DIA';
      if (hasOverdue) financialStatus = 'ATRASADO';
      else if (hasPending) financialStatus = 'PENDENTE';

      studentsData.push({
        ...student,
        dominantFoot: student.dominant_foot,
        shirtNumber: student.shirt_number,
        relationship: 'Responsável Legal',
        classes: enrolledClasses,
        attendance: {
          totalTrainings,
          presences,
          absences,
          justified,
          attendanceRate,
          history: attendanceRecords || []
        },
        payments: studentPayments,
        financialStatus
      });
    }

    return {
      guardian: primaryGuardian,
      students: studentsData
    };
  }
}

export const dashboardService = new DashboardService();
