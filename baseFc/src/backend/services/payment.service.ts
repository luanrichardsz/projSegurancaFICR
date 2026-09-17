import { supabaseAdmin } from '../config/supabase.ts';

export class PaymentService {
  async listPayments(schoolId: string, filters?: { status?: string; studentId?: string; competence?: string }) {
    const today = new Date().toISOString().slice(0, 10);

    // 1. Atualizar automaticamente no banco pagamentos pendentes que já venceram
    try {
      await supabaseAdmin
        .from('payments')
        .update({ status: 'ATRASADO' })
        .eq('status', 'PENDENTE')
        .lt('due_date', today);
    } catch (err) {
      console.warn('Aviso: falha ao atualizar títulos atrasados em background:', err);
    }

    // 2. Consultar pagamentos com dados do atleta (incluindo CPF e categoria)
    let query = supabaseAdmin
      .from('payments')
      .select(`
        *,
        students!inner (
          id,
          name,
          category,
          shirt_number,
          cpf,
          school_id
        )
      `)
      .eq('students.school_id', schoolId)
      .order('due_date', { ascending: false });

    if (filters?.status && filters.status !== 'TODOS') {
      query = query.eq('status', filters.status);
    }
    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters?.competence && filters.competence !== 'TODOS') {
      query = query.eq('competence', filters.competence);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar mensalidades:', error);
      throw new Error('Falha ao listar mensalidades');
    }

    return (data || []).map((p: any) => {
      // Extrair mês e ano da competência (ex: "09/2026") ou da data de vencimento
      let refMonth = 0;
      let refYear = 0;

      if (p.competence && typeof p.competence === 'string') {
        if (p.competence.includes('/')) {
          const parts = p.competence.split('/');
          refMonth = parseInt(parts[0], 10) || 0;
          refYear = parseInt(parts[1], 10) || 0;
        } else if (p.competence.includes('-')) {
          const parts = p.competence.split('-');
          refYear = parseInt(parts[0], 10) || 0;
          refMonth = parseInt(parts[1], 10) || 0;
        }
      }

      if (!refMonth && p.due_date) {
        refMonth = parseInt(p.due_date.slice(5, 7), 10) || 0;
        refYear = parseInt(p.due_date.slice(0, 4), 10) || 0;
      }

      const isOverdue = p.status === 'PENDENTE' && p.due_date < today;
      const effectiveStatus = isOverdue ? 'ATRASADO' : p.status;

      return {
        ...p,
        id: p.id,
        student_id: p.student_id,
        studentId: p.student_id,
        amount: Number(p.amount || 0),
        due_date: p.due_date,
        dueDate: p.due_date,
        status: effectiveStatus,
        payment_method: p.payment_method,
        paymentMethod: p.payment_method,
        paid_at: p.paid_at,
        paidAt: p.paid_at,
        payment_date: p.paid_at, // Compatibilidade com front
        competence: p.competence || `${String(refMonth).padStart(2, '0')}/${refYear}`,
        reference_month: refMonth,
        reference_year: refYear,
        studentName: p.students?.name || 'Atleta',
        category: p.students?.category || '',
        shirt_number: p.students?.shirt_number,
        shirtNumber: p.students?.shirt_number,
        students: {
          id: p.students?.id,
          name: p.students?.name || 'Atleta',
          cpf: p.students?.cpf || '',
          category: p.students?.category || '',
          shirt_number: p.students?.shirt_number,
          shirtNumber: p.students?.shirt_number
        }
      };
    });
  }

  async createPayment(schoolId: string, data: any, createdBy: string) {
    const studentId = data.studentId || data.student_id;
    const dueDate = data.dueDate || data.due_date;
    const amount = Number(data.amount);

    let competence = data.competence;
    if (!competence && data.reference_month && data.reference_year) {
      competence = `${String(data.reference_month).padStart(2, '0')}/${data.reference_year}`;
    }
    if (!competence && dueDate) {
      competence = `${dueDate.slice(5, 7)}/${dueDate.slice(0, 4)}`;
    }

    // 1. Validar se o aluno pertence à instituição
    const { data: student, error: sErr } = await supabaseAdmin
      .from('students')
      .select('id, name, school_id')
      .eq('id', studentId)
      .single();

    if (sErr || !student || student.school_id !== schoolId) {
      const err: any = new Error('Aluno não encontrado na instituição');
      err.statusCode = 404;
      throw err;
    }

    // 2. Verificar duplicidade de mensalidade para o mesmo mês
    const { data: existing } = await supabaseAdmin
      .from('payments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('competence', competence)
      .maybeSingle();

    if (existing) {
      const err: any = new Error(
        `Já existe uma cobrança para o atleta ${student.name} referente à competência ${competence}.`
      );
      err.statusCode = 400;
      throw err;
    }

    // 3. Inserir mensalidade
    const { data: newPayment, error } = await supabaseAdmin
      .from('payments')
      .insert([{
        student_id: studentId,
        amount,
        due_date: dueDate,
        competence,
        status: 'PENDENTE'
      }])
      .select()
      .single();

    if (error || !newPayment) {
      throw new Error(`Falha ao emitir mensalidade: ${error?.message || ''}`);
    }

    // 4. Trilha de Auditoria (Tríade CID)
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
    // 1. Buscar todos os alunos ativos da escola
    const { data: activeStudents, error } = await supabaseAdmin
      .from('students')
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('status', 'ATIVO');

    if (error || !activeStudents || activeStudents.length === 0) {
      const err: any = new Error('Nenhum aluno ativo encontrado para emissão em lote');
      err.statusCode = 400;
      throw err;
    }

    // 2. Prevenir duplicidade: verificar quais alunos já possuem cobrança nesta competência
    const { data: existingPayments } = await supabaseAdmin
      .from('payments')
      .select('student_id')
      .eq('competence', competence);

    const existingSet = new Set((existingPayments || []).map((p: any) => p.student_id));
    const studentsToBill = activeStudents.filter(s => !existingSet.has(s.id));

    if (studentsToBill.length === 0) {
      const err: any = new Error(
        `Todas as mensalidades para a competência ${competence} já foram geradas anteriormente (${activeStudents.length} alunos já faturados).`
      );
      err.statusCode = 400;
      throw err;
    }

    // 3. Montar e inserir as novas cobranças
    const paymentsToInsert = studentsToBill.map(s => ({
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
      console.error('Erro ao gerar lote de mensalidades:', insertErr);
      throw new Error(`Falha ao gerar lote de mensalidades: ${insertErr.message}`);
    }

    // 4. Auditoria (Tríade CID)
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: createdBy,
      action: 'GERAR_MENSALIDADES_LOTE',
      resource: `Lote ${competence}`,
      details: {
        totalAlunosAtivos: activeStudents.length,
        geradasAgora: createdPayments?.length || 0,
        jaExistentes: existingSet.size,
        valorUnitario: amount,
        competencia: competence,
        vencimento: dueDate
      }
    }]);

    const infoExtra = existingSet.size > 0 ? ` (${existingSet.size} já existiam e foram mantidas)` : '';

    return {
      message: `${createdPayments?.length} mensalidades geradas com sucesso para ${competence}${infoExtra}.`,
      count: createdPayments?.length || 0
    };
  }

  async recordManualPayment(
    paymentId: string, 
    paymentMethod: string, 
    paidAtDate: string | undefined, 
    receivedBy: string, 
    schoolId: string,
    notes?: string
  ) {
    // 1. REGRA DE INTEGRIDADE (ANTI-TAMPERING): Buscar registro original
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
      const err: any = new Error('Mensalidade não encontrada');
      err.statusCode = 404;
      throw err;
    }

    const student: any = payment.students;
    if (student?.school_id !== schoolId) {
      const err: any = new Error('Acesso negado: Mensalidade pertence a outra instituição');
      err.statusCode = 403;
      throw err;
    }

    if (payment.status === 'PAGO') {
      const err: any = new Error('Esta mensalidade já consta como PAGA no sistema.');
      err.statusCode = 400;
      throw err;
    }

    const paidAt = paidAtDate || new Date().toISOString();

    // 2. Atualizar status e método (o valor jamais é alterado)
    const { data: updatedPayment, error: upErr } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'PAGO',
        payment_method: paymentMethod || 'PIX',
        paid_at: paidAt
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (upErr || !updatedPayment) {
      throw new Error('Falha ao registrar baixa do pagamento');
    }

    // 3. Trilha de Auditoria (Tríade CID - Integridade e Não-repúdio)
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
        dataBaixa: paidAt,
        observacoes: notes || null
      }
    }]);

    return {
      message: 'Pagamento registrado com sucesso.',
      payment: updatedPayment
    };
  }

  async deletePayment(paymentId: string, schoolId: string, userId: string) {
    const { data: payment, error: pErr } = await supabaseAdmin
      .from('payments')
      .select(`
        id,
        status,
        amount,
        competence,
        student_id,
        students!inner (
          name,
          school_id
        )
      `)
      .eq('id', paymentId)
      .eq('students.school_id', schoolId)
      .single();

    if (pErr || !payment) {
      const err: any = new Error('Mensalidade não encontrada.');
      err.statusCode = 404;
      throw err;
    }

    if (payment.status === 'PAGO') {
      const err: any = new Error('Não é possível excluir uma mensalidade já liquidada/paga.');
      err.statusCode = 400;
      throw err;
    }

    const { error: delErr } = await supabaseAdmin
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (delErr) {
      throw new Error(`Falha ao excluir cobrança: ${delErr.message}`);
    }

    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: userId,
      action: 'EXCLUIR_MENSALIDADE',
      resource: `Mensalidade ${(payment as any).students?.name} (${payment.competence})`,
      details: {
        paymentId,
        studentName: (payment as any).students?.name,
        amount: Number(payment.amount),
        competence: payment.competence
      }
    }]);

    return { message: 'Mensalidade cancelada/excluída com sucesso.' };
  }
}

export const paymentService = new PaymentService();
