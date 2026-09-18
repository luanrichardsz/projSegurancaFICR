import { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  ShieldCheck, Lock, CheckCircle2, Search, Filter, 
  Clock, Eye, FileText, Database, ShieldAlert, User
} from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: any;
  created_at: string;
  user?: {
    email: string;
    role?: string;
  };
}

export const Auditoria = () => {
  const { token, role } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('TODAS');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/audit', {}, token);
      setLogs(data || []);
    } catch (err) {
      console.error('Erro ao carregar logs de auditoria', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [token]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const email = log.user?.email || '';
      const action = log.action || '';
      const resource = log.resource || '';
      const detailsStr = JSON.stringify(log.details || {});

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
    if (action.includes('PAYMENT') || action.includes('PAID')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('STUDENT') || action.includes('ENROLL')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (action.includes('ATTENDANCE')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (action.includes('DELETE') || action.includes('INACTIVE')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Trilha de Auditoria & Segurança</h1>
          <p className="text-gray-500 mt-1">Registros imutáveis de ações críticas para garantia da Tríade CID</p>
        </div>
        
        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 shadow-2xs"
        >
          <Clock className="w-3.5 h-3.5 text-gray-500" /> Atualizar Logs
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
              <option value="TODAS">Todas as Ações</option>
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
          <div className="overflow-x-auto">
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
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-medium">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{log.user?.email || 'Sistema'}</p>
                          <p className="text-2xs text-gray-400 uppercase">{log.user?.role || 'GESTOR'}</p>
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
                          {log.details.student_name ? `Aluno: ${log.details.student_name} ` : ''}
                          {log.details.payment_method ? `Método: ${log.details.payment_method} ` : ''}
                          {log.details.amount ? `R$ ${log.details.amount}` : ''}
                          {!log.details.student_name && !log.details.payment_method ? JSON.stringify(log.details) : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Sem payload</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-semibold px-2.5 py-1 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Inspecionar Payload Completo do Log */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Evidência de Auditoria</h3>
                <p className="text-xs text-gray-500">ID: {selectedLog.id}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 pt-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Timestamp:</span>
                <span className="font-bold text-gray-800">{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Operador:</span>
                <span className="font-bold text-gray-800">{selectedLog.user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Ação:</span>
                <span className="font-bold text-gray-800">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Recurso:</span>
                <span className="font-bold font-mono text-gray-800">{selectedLog.resource} ({selectedLog.resource_id || 'Global'})</span>
              </div>

              <div>
                <span className="text-gray-500 font-medium block mb-1.5">Metadados Auditados (Payload):</span>
                <pre className="bg-gray-900 text-emerald-400 p-4 rounded-xl text-2xs font-mono overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
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
