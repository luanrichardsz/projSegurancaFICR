import { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  CreditCard, Search, Filter, Plus, Calendar, CheckCircle2, 
  AlertTriangle, Clock, ShieldCheck, DollarSign, X, AlertCircle, FileText
} from 'lucide-react';

interface Payment {
  id: string;
  student_id: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  payment_method?: 'PIX' | 'DINHEIRO' | 'CARTAO';
  reference_month: number;
  reference_year: number;
  notes?: string;
  students?: {
    id: string;
    name: string;
    cpf: string;
    category: string;
  };
}

export const Mensalidades = () => {
  const { token, role } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [monthFilter, setMonthFilter] = useState('TODOS');

  // Modals
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [payingPayment, setPayingPayment] = useState<Payment | null>(null);

  // Batch Form
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [batchForm, setBatchForm] = useState({
    reference_month: currentMonth,
    reference_year: currentYear,
    due_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-10`,
    default_amount: 150.00
  });
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);

  // Single Form
  const [singleForm, setSingleForm] = useState({
    student_id: '',
    amount: 150.00,
    due_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-10`,
    reference_month: currentMonth,
    reference_year: currentYear
  });
  const [singleLoading, setSingleLoading] = useState(false);

  // Pay Modal Form
  const [payForm, setPayForm] = useState({
    payment_method: 'PIX' as 'PIX' | 'DINHEIRO' | 'CARTAO',
    notes: ''
  });
  const [payLoading, setPayLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, studentsData] = await Promise.all([
        fetchApi('/payments', {}, token),
        fetchApi('/students', {}, token)
      ]);
      setPayments(paymentsData || []);
      setStudents(studentsData || []);
      if (studentsData && studentsData.length > 0 && !singleForm.student_id) {
        setSingleForm(prev => ({ ...prev, student_id: studentsData[0].id }));
      }
    } catch (err) {
      console.error('Erro ao carregar mensalidades', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Batch generate
  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBatchLoading(true);
      setBatchResult(null);
      const res = await fetchApi('/payments/batch', {
        method: 'POST',
        body: JSON.stringify({
          reference_month: Number(batchForm.reference_month),
          reference_year: Number(batchForm.reference_year),
          due_date: batchForm.due_date,
          default_amount: Number(batchForm.default_amount)
        })
      }, token);

      setBatchResult(`Sucesso! ${res.count || 0} mensalidades geradas.`);
      await loadData();
      setTimeout(() => {
        setShowBatchModal(false);
        setBatchResult(null);
      }, 1500);
    } catch (err: any) {
      alert(`Erro ao gerar lote: ${err.message}`);
    } finally {
      setBatchLoading(false);
    }
  };

  // Single create
  const handleSingleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSingleLoading(true);
      await fetchApi('/payments', {
        method: 'POST',
        body: JSON.stringify({
          student_id: singleForm.student_id,
          amount: Number(singleForm.amount),
          due_date: singleForm.due_date,
          reference_month: Number(singleForm.reference_month),
          reference_year: Number(singleForm.reference_year)
        })
      }, token);

      setShowSingleModal(false);
      await loadData();
    } catch (err: any) {
      alert(`Erro ao lançar mensalidade: ${err.message}`);
    } finally {
      setSingleLoading(false);
    }
  };

  // Confirm manual payment settlement (Anti-tampering Demonstration)
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPayment) return;
    try {
      setPayLoading(true);
      await fetchApi(`/payments/${payingPayment.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          payment_method: payForm.payment_method,
          notes: payForm.notes
        })
      }, token);

      setPayingPayment(null);
      setPayForm({ payment_method: 'PIX', notes: '' });
      await loadData();
    } catch (err: any) {
      alert(`Erro ao dar baixa na mensalidade: ${err.message}`);
    } finally {
      setPayLoading(false);
    }
  };

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const studentName = p.students?.name || '';
      const studentCpf = p.students?.cpf || '';
      const matchesSearch = 
        studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        studentCpf.includes(searchTerm);

      const matchesStatus = statusFilter === 'TODOS' || p.status === statusFilter;
      const matchesMonth = monthFilter === 'TODOS' || String(p.reference_month) === monthFilter;

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [payments, searchTerm, statusFilter, monthFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalReceived = payments
      .filter(p => p.status === 'PAGO')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    const pendingCount = payments.filter(p => p.status === 'PENDENTE').length;
    const pendingAmount = payments
      .filter(p => p.status === 'PENDENTE')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const overdueCount = payments.filter(p => p.status === 'ATRASADO').length;
    const overdueAmount = payments
      .filter(p => p.status === 'ATRASADO')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return { totalReceived, pendingCount, pendingAmount, overdueCount, overdueAmount };
  }, [payments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestão de Mensalidades</h1>
          <p className="text-gray-500 mt-1">Controle de faturamento, liquidação manual e auditoria anti-fraude</p>
        </div>
        
        {role === 'GESTOR' && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSingleModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-gray-500" />
              Lançamento Avulso
            </button>
            <button 
              onClick={() => setShowBatchModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-[#112F20] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#1E4D36] transition-all shadow-md shadow-emerald-900/20 active:scale-95"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              Gerar Lote do Mês
            </button>
          </div>
        )}
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Total Recebido</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalReceived)}
            </p>
            <p className="text-2xs text-gray-400 mt-0.5">Mensalidades liquidadas</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Em Aberto (Pendentes)</p>
            <p className="text-2xl font-black text-blue-600 mt-1">
              {stats.pendingCount} títulos
            </p>
            <p className="text-2xs text-gray-400 mt-0.5">
              Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.pendingAmount)}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Atrasadas</p>
            <p className="text-2xl font-black text-red-600 mt-1">
              {stats.overdueCount} títulos
            </p>
            <p className="text-2xs text-gray-400 mt-0.5">
              Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.overdueAmount)}
            </p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Educational Banner: Integridade & Não-Repúdio */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0" />
        <div className="text-xs text-emerald-900">
          <span className="font-bold">Segurança e Integridade:</span> O registro manual de pagamento bloqueia a manipulação arbitrária de valores no frontend. O backend valida a titularidade, calcula status e audita quem realizou a baixa para garantir o não-repúdio (Tríade CID).
        </div>
      </div>

      {/* Table & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 bg-gray-50/70 items-center justify-between">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              maxLength={100}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por atleta ou CPF..." 
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mr-1">
              <Filter className="w-3.5 h-3.5" />
              Filtros:
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-gray-200 py-2 px-3 rounded-lg font-medium text-gray-700 focus:outline-none focus:border-emerald-600"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="PAGO">Pagas</option>
              <option value="ATRASADO">Atrasadas</option>
            </select>

            <select
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              className="text-xs bg-white border border-gray-200 py-2 px-3 rounded-lg font-medium text-gray-700 focus:outline-none focus:border-emerald-600"
            >
              <option value="TODOS">Todos os Meses</option>
              <option value="1">Janeiro</option>
              <option value="2">Fevereiro</option>
              <option value="3">Março</option>
              <option value="4">Abril</option>
              <option value="5">Maio</option>
              <option value="6">Junho</option>
              <option value="7">Julho</option>
              <option value="8">Agosto</option>
              <option value="9">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            Carregando mensalidades...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-16 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800">Nenhuma mensalidade encontrada</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Clique em "Gerar Lote do Mês" para emitir as cobranças de todos os atletas ativos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Atleta</th>
                  <th className="px-6 py-4">Mês / Ano</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Vencimento</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Forma / Baixa</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{p.students?.name || 'Atleta'}</div>
                      <div className="text-2xs text-gray-500">{p.students?.category || 'Geral'} • CPF: {p.students?.cpf || 'S/N'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-700">
                      {String(p.reference_month).padStart(2, '0')}/{p.reference_year}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {p.due_date ? new Date(p.due_date).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${
                        p.status === 'PAGO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'PENDENTE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          p.status === 'PAGO' ? 'bg-emerald-600' : p.status === 'PENDENTE' ? 'bg-blue-600' : 'bg-red-600'
                        }`}></span>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {p.status === 'PAGO' ? (
                        <div>
                          <span className="font-semibold text-gray-800">{p.payment_method || 'MANUAL'}</span>
                          <span className="text-2xs text-gray-400 block">
                            {p.payment_date ? new Date(p.payment_date).toLocaleDateString('pt-BR') : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Aguardando</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status !== 'PAGO' && role === 'GESTOR' ? (
                        <button
                          onClick={() => setPayingPayment(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs"
                          title="Dar baixa com integridade comprovada"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Dar Baixa
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Quitado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Dar Baixa Manual (Anti-Tampering) */}
      {payingPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Registrar Pagamento</h3>
                <p className="text-xs text-gray-500">Baixa manual com integridade protegida</p>
              </div>
              <button 
                onClick={() => setPayingPayment(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4 pt-4">
              <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Atleta:</span>
                  <span className="font-bold text-gray-800">{payingPayment.students?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Referência:</span>
                  <span className="font-bold text-gray-800">{payingPayment.reference_month}/{payingPayment.reference_year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor Cadastrado:</span>
                  <span className="font-black text-emerald-700 text-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payingPayment.amount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Forma de Pagamento *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PIX', 'DINHEIRO', 'CARTAO'] as const).map(method => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPayForm(prev => ({ ...prev, payment_method: method }))}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        payForm.payment_method === method
                          ? 'bg-[#112F20] text-white border-[#112F20] shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Observações (Opcional)</label>
                <textarea
                  rows={2}
                  maxLength={250}
                  placeholder="Ex: Comprovante enviado via WhatsApp pelo responsável"
                  value={payForm.notes}
                  onChange={e => setPayForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingPayment(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {payLoading ? 'Gravando...' : 'Confirmar Baixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Gerar Lote do Mês */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Gerar Lote de Mensalidades</h3>
                <p className="text-xs text-gray-500">Emite cobranças para todos os atletas ativos</p>
              </div>
              <button 
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBatchGenerate} className="space-y-4 pt-4">
              {batchResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{batchResult}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mês de Referência *</label>
                  <select
                    value={batchForm.reference_month}
                    onChange={e => setBatchForm(prev => ({ ...prev, reference_month: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                      <option key={m} value={m}>Mês {String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ano *</label>
                  <input 
                    type="number"
                    required
                    min={2020}
                    max={2050}
                    value={batchForm.reference_year}
                    onChange={e => setBatchForm(prev => ({ ...prev, reference_year: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Data de Vencimento *</label>
                <input 
                  type="date"
                  required
                  value={batchForm.due_date}
                  onChange={e => setBatchForm(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Valor Padrão (R$) *</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  min={1}
                  max={99999}
                  value={batchForm.default_amount}
                  onChange={e => setBatchForm(prev => ({ ...prev, default_amount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={batchLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#112F20] hover:bg-[#1E4D36] rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {batchLoading ? 'Gerando...' : 'Gerar Títulos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Lançamento Avulso */}
      {showSingleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Lançamento Avulso</h3>
                <p className="text-xs text-gray-500">Adicione uma cobrança individual</p>
              </div>
              <button 
                onClick={() => setShowSingleModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSingleCreate} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Selecione o Atleta *</label>
                <select
                  value={singleForm.student_id}
                  onChange={e => setSingleForm(prev => ({ ...prev, student_id: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.category || 'Geral'}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mês *</label>
                  <input 
                    type="number"
                    min="1"
                    max="12"
                    value={singleForm.reference_month}
                    onChange={e => setSingleForm(prev => ({ ...prev, reference_month: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ano *</label>
                  <input 
                    type="number"
                    required
                    min={2020}
                    max={2050}
                    value={singleForm.reference_year}
                    onChange={e => setSingleForm(prev => ({ ...prev, reference_year: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Valor (R$) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    min={1}
                    max={99999}
                    value={singleForm.amount}
                    onChange={e => setSingleForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Vencimento *</label>
                  <input 
                    type="date"
                    required
                    value={singleForm.due_date}
                    onChange={e => setSingleForm(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={singleLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#112F20] hover:bg-[#1E4D36] rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {singleLoading ? 'Criando...' : 'Criar Cobrança'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
