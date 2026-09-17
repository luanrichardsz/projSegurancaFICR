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
}

export const dashboardService = new DashboardService();
