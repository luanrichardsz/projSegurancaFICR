import { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  ShieldCheck, Lock, CheckCircle2, Search, Filter, 
  Clock, Eye, FileText, Database, ShieldAlert, User
} from 'lucide-react';

interface AuditLog {
  id: string;
  user_id?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: any;
  created_at?: string;
  timestamp?: string;
  user?: {
    email: string;
    role?: string;
  };
}

export const Auditoria = () => {
  const { token, role } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('TODAS');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      let data: any = null;
      try {
        data = await fetchApi('/audit', {}, token);
      } catch (firstErr) {
        console.warn('Tentando endpoint alternativo /audit-logs...', firstErr);
        data = await fetchApi('/audit-logs', {}, token);
      }
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Erro ao carregar logs de auditoria:', err);
      setError(err?.message || 'Falha ao carregar trilha de auditoria.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [token]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('pt-BR');
    } catch {
      return '—';
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const email = log.user?.email || log.userEmail || '';
      const action = log.action || '';
      const resource = log.resource || '';
      const detailsStr = typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '');

      const matchesSearch = 
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detailsStr.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = actionFilter === 'TODAS' || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => { if (l.action) set.add(l.action); });
    return Array.from(set);
  }, [logs]);

  const getActionBadge = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('PAGAMENTO') || act.includes('MENSALIDADE') || act.includes('PAYMENT') || act.includes('BAIXA')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (act.includes('ALUNO') || act.includes('STUDENT') || act.includes('MATRICULA')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (act.includes('CHAMADA') || act.includes('FREQUENCIA') || act.includes('ATTENDANCE')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (act.includes('TURMA') || act.includes('CLASS')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (act.includes('PROFESSOR') || act.includes('TEACHER')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
    if (act.includes('EXCLUIR') || act.includes('INATIVAR') || act.includes('DELETE') || act.includes('INACTIVE')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Trilha de Auditoria & Segurança</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Registros imutáveis de ações críticas para garantia da Tríade CID</p>
        </div>
        
        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 shadow-2xs cursor-pointer transition-colors disabled:opacity-50 w-full sm:w-auto"
        >
          <Clock className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} /> 
          {loading ? 'Atualizando...' : 'Atualizar Logs'}
        </button>
      </div>

      {/* Tríade CID Educational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase text-blue-900 tracking-wider">Confidencialidade</h4>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Autenticação JWT, RBAC rígido (GESTOR, RESPONSAVEL) e isolamento IDOR multitenant por escolinha.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase text-emerald-900 tracking-wider">Integridade & Não-Repúdio</h4>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Toda alteração cadastral, baixa de mensalidade e chamada gera log rastreável de operador, timestamp e estado anterior.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-start gap-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase text-purple-900 tracking-wider">Disponibilidade</h4>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Validações robustas com Zod no backend, bloqueio de sobrelotação de turmas e sanitização de falhas sem vazamento.
            </p>
          </div>
        </div>
      </div>

      {/* Alerta de Erro */}
      {error && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs font-medium">{error}</span>
          </div>
          <button
            onClick={loadLogs}
            className="text-xs font-bold bg-rose-600 text-white px-3 py-1.5 rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      )}

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
              placeholder="Buscar por operador, ação ou recurso..." 
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mr-1">
              <Filter className="w-3.5 h-3.5" />
              Ação:
            </div>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="text-xs bg-white border border-gray-200 py-2 px-3 rounded-lg font-medium text-gray-700 focus:outline-none focus:border-emerald-600"
            >
              <option value="TODAS">Todas as Ações ({uniqueActions.length})</option>
              {uniqueActions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            Carregando trilha de auditoria...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800">Nenhum registro de auditoria</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Ações executadas no sistema (matrícula, chamada, baixa de mensalidades) serão registradas automaticamente aqui.
            </p>
          </div>
        ) : (
          <>
            {/* Visualização Mobile: Cards Individuais de Auditoria */}
            <div className="block md:hidden divide-y divide-gray-100">
              {filteredLogs.map(log => {
                const operatorEmail = log.user?.email || log.userEmail || 'Sistema';
                const operatorRole = log.user?.role || log.userRole || 'GESTOR';
                const logDate = log.created_at || log.timestamp;

                return (
                  <div key={log.id} className="p-4 space-y-3 hover:bg-emerald-50/20 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{operatorEmail}</p>
                          <p className="text-3xs text-gray-400 uppercase font-semibold">{operatorRole} • {formatDate(logDate)}</p>
                        </div>
                      </div>

                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 text-3xs font-bold rounded-md border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-xl space-y-1 text-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-semibold">Recurso:</span>
                        <span className="font-mono text-gray-800 font-bold">{log.resource}</span>
                      </div>
                      {log.details && (
                        <div className="text-gray-600 truncate pt-1 border-t border-gray-200/60">
                          {log.details.name ? `Nome: ${log.details.name} ` : ''}
                          {log.details.student_name ? `Aluno: ${log.details.student_name} ` : ''}
                          {log.details.category ? `Cat: ${log.details.category} ` : ''}
                          {log.details.amount ? `R$ ${log.details.amount} ` : ''}
                          {log.details.paymentMethod || log.details.payment_method ? `Método: ${log.details.paymentMethod || log.details.payment_method} ` : ''}
                          {log.details.status ? `Status: ${log.details.status} ` : ''}
                          {!log.details.name && !log.details.student_name && !log.details.amount && !log.details.status ? 'Payload registrado' : ''}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedLog(log)}
                      className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-bold px-3 py-2 bg-emerald-50 rounded-xl hover:bg-emerald-100 border border-emerald-200/60 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspecionar Evidência
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Visualização Desktop: Tabela Completa */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Data / Hora</th>
                    <th className="px-6 py-4">Operador (Quem)</th>
                    <th className="px-6 py-4">Ação Executada</th>
                    <th className="px-6 py-4">Recurso Afetado</th>
                    <th className="px-6 py-4">Detalhes da Transação</th>
                    <th className="px-6 py-4 text-right">Auditar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.map(log => {
                    const operatorEmail = log.user?.email || log.userEmail || 'Sistema';
                    const operatorRole = log.user?.role || log.userRole || 'GESTOR';
                    const logDate = log.created_at || log.timestamp;

                    return (
                      <tr key={log.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-medium">
                          {formatDate(logDate)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900">{operatorEmail}</p>
                              <p className="text-2xs text-gray-400 uppercase">{operatorRole}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 text-2xs font-bold rounded-md border ${getActionBadge(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-700">
                          {log.resource}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">
                          {log.details ? (
                            <span>
                              {log.details.name ? `Nome: ${log.details.name} ` : ''}
                              {log.details.student_name ? `Aluno: ${log.details.student_name} ` : ''}
                              {log.details.category ? `Cat: ${log.details.category} ` : ''}
                              {log.details.amount ? `R$ ${log.details.amount} ` : ''}
                              {log.details.paymentMethod || log.details.payment_method ? `Método: ${log.details.paymentMethod || log.details.payment_method} ` : ''}
                              {log.details.capacity ? `Vagas: ${log.details.capacity} ` : ''}
                              {log.details.status ? `Status: ${log.details.status} ` : ''}
                              {!log.details.name && !log.details.student_name && !log.details.amount && !log.details.capacity && !log.details.category ? JSON.stringify(log.details) : ''}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Sem payload</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-semibold px-2.5 py-1 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Detalhes
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal: Inspecionar Payload Completo do Log */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 p-5 sm:p-6 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="min-w-0 pr-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Evidência de Auditoria</h3>
                <p className="text-2xs text-gray-500 font-mono truncate">ID: {selectedLog.id}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 pt-4 text-xs overflow-y-auto flex-1">
              <div className="flex justify-between py-1.5 border-b border-gray-50 gap-2">
                <span className="text-gray-500 font-medium shrink-0">Timestamp:</span>
                <span className="font-bold text-gray-800 text-right">{formatDate(selectedLog.created_at || selectedLog.timestamp)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 gap-2">
                <span className="text-gray-500 font-medium shrink-0">Operador:</span>
                <span className="font-bold text-gray-800 truncate text-right">{selectedLog.user?.email || selectedLog.userEmail || 'Sistema'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 gap-2">
                <span className="text-gray-500 font-medium shrink-0">Perfil (Role):</span>
                <span className="font-bold text-gray-800 text-right">{selectedLog.user?.role || selectedLog.userRole || 'GESTOR'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 gap-2">
                <span className="text-gray-500 font-medium shrink-0">Ação:</span>
                <span className="font-bold text-gray-800 text-right">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 gap-2">
                <span className="text-gray-500 font-medium shrink-0">Recurso:</span>
                <span className="font-bold font-mono text-gray-800 text-right">{selectedLog.resource}</span>
              </div>

              <div>
                <span className="text-gray-500 font-medium block mb-1.5">Metadados Auditados (Payload):</span>
                <pre className="bg-gray-900 text-emerald-400 p-3 sm:p-4 rounded-xl text-2xs font-mono overflow-x-auto max-h-60 whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Fechar Evidência
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
