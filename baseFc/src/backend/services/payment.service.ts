import { supabaseAdmin } from '../config/supabase.ts';

export class PaymentService {
  async listPayments(schoolId: string, filters?: { status?: string; studentId?: string; competence?: string }) {
    let query = supabaseAdmin
      .from('payments')
      .select(`
        *,
        students!inner (
          id,
          name,
          category,
          shirt_number,
          school_id
        )
      `)
      .eq('students.school_id', schoolId)
      .order('due_date', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters?.competence) {
      query = query.eq('competence', filters.competence);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar mensalidades:', error);
      throw new Error('Falha ao listar mensalidades');
    }

    return (data || []).map((p: any) => ({
      ...p,
      studentId: p.student_id,
      dueDate: p.due_date,
      paymentMethod: p.payment_method,
      paidAt: p.paid_at,
      studentName: p.students?.name || 'Atleta',
      category: p.students?.category || ''
    }));
  }

  async createPayment(schoolId: string, data: any, createdBy: string) {
    // Validar se o aluno pertence à escola
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id, name, school_id')
      .eq('id', data.studentId)
      .single();

    if (!student || student.school_id !== schoolId) {
      throw new Error('Aluno não encontrado na instituição');
    }

    const { data: newPayment, error } = await supabaseAdmin
      .from('payments')
      .insert([{
        student_id: data.studentId,
        amount: data.amount,
        due_date: data.dueDate,
        competence: data.competence,
        status: 'PENDENTE'
      }])
      .select()
      .single();

    if (error || !newPayment) {
      throw new Error('Falha ao emitir mensalidade');
    }

    // Auditoria
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: createdBy,
      action: 'EMITIR_MENSALIDADE',
      resource: `Mensalidade para ${student.name}`,
      details: {
        paymentId: newPayment.id,
        amount: newPayment.amount,
        competence: newPayment.competence,
        dueDate: newPayment.due_date
      }
    }]);

    return newPayment;
  }

  async generateBatch(schoolId: string, competence: string, dueDate: string, amount: number, createdBy: string) {
    // Buscar todos os alunos ativos da escola
    const { data: activeStudents, error } = await supabaseAdmin
      .from('students')
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('status', 'ATIVO');

    if (error || !activeStudents || activeStudents.length === 0) {
      throw new Error('Nenhum aluno ativo encontrado para emissão em lote');
    }

    const paymentsToInsert = activeStudents.map(s => ({
      student_id: s.id,
      amount,
      due_date: dueDate,
      competence,
      status: 'PENDENTE'
    }));

    const { data: createdPayments, error: insertErr } = await supabaseAdmin
      .from('payments')
      .insert(paymentsToInsert)
      .select();

    if (insertErr) {
      throw new Error(`Falha ao gerar lote de mensalidades: ${insertErr.message}`);
    }

    // Auditoria
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: createdBy,
      action: 'GERAR_MENSALIDADES_LOTE',
      resource: `Lote ${competence}`,
      details: {
        totalAlunos: activeStudents.length,
        valorUnitario: amount,
        competencia: competence
      }
    }]);

    return {
      message: `${createdPayments?.length} mensalidades geradas com sucesso.`,
      count: createdPayments?.length
    };
  }

  async recordManualPayment(paymentId: string, paymentMethod: string, paidAtDate: string | undefined, receivedBy: string, schoolId: string) {
    // 1. REGRA DE INTEGRIDADE (ANTI-TAMPERING): Buscar o registro original no banco
    const { data: payment, error: pErr } = await supabaseAdmin
      .from('payments')
      .select(`
        id,
        amount,
        status,
        competence,
        due_date,
        student_id,
        students (
          id,
          name,
          school_id
        )
      `)
      .eq('id', paymentId)
      .single();

    if (pErr || !payment) {
      throw new Error('Mensalidade não encontrada');
    }

    const student: any = payment.students;
    if (student?.school_id !== schoolId) {
      throw new Error('Acesso negado: Mensalidade pertence a outra instituição');
    }

    if (payment.status === 'PAGO') {
      const err: any = new Error('Esta mensalidade já consta como PAGA.');
      err.statusCode = 400;
      throw err;
    }

    const paidAt = paidAtDate || new Date().toISOString();

    // 2. Atualizar status e método (o valor NUNCA é adulterado pelo cliente)
    const { data: updatedPayment, error: upErr } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'PAGO',
        payment_method: paymentMethod,
        paid_at: paidAt
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (upErr || !updatedPayment) {
      throw new Error('Falha ao registrar baixa do pagamento');
    }

    // 3. Auditoria Detalhada de Segurança (Tríade CID - Integridade e Não-repúdio)
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: receivedBy,
      action: 'BAIXA_MENSALIDADE',
      resource: `Mensalidade #${paymentId.substring(0, 8)} (${student.name})`,
      details: {
        paymentId,
        studentName: student.name,
        amount: Number(payment.amount),
        competence: payment.competence,
        formaPagamento: paymentMethod,
        dataBaixa: paidAt
      }
    }]);

    return {
      message: 'Pagamento registrado com sucesso.',
      payment: updatedPayment
    };
  }
}

export const paymentService = new PaymentService();
