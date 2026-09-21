import { useState, useEffect } from 'react';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  Users, BookOpen, AlertCircle, TrendingUp, Calendar, 
  Clock, ShieldCheck, UserPlus, CreditCard, ChevronRight, UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardGestor = () => {
  const { token, role } = useAuth();
  const [stats, setStats] = useState({
    activeStudents: 0,
    totalClasses: 0,
    overduePayments: 0,
    monthRevenue: 0,
    paymentsSummary: { paid: 0, pending: 0, overdue: 0 },
    upcomingTrainings: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await fetchApi('/dashboard', {}, token);
        setStats(data);
      } catch (err) {
        console.error('Erro ao carregar métricas do dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [token]);

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full">
      {/* Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-r from-[#112F20] to-[#1E4D36] p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl text-white shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 mb-2 sm:mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Gestão de Time • Tríade CID
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Painel do Gestor</h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-xl">
            Visão consolidada de atletas, turmas ativas, controle financeiro e integridade de registros da escolinha de futebol.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => navigate('/alunos/novo')}
            className="inline-flex items-center justify-center gap-2 bg-emerald-400 text-[#112F20] px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-300 transition-all shadow-md active:scale-95 cursor-pointer w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4" /> Nova Matrícula
          </button>
          <button
            onClick={() => navigate('/turmas')}
            className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-white/20 transition-all cursor-pointer w-full sm:w-auto"
          >
            <UserCheck className="w-4 h-4" /> Fazer Chamada
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          icon={<Users className="w-6 h-6 text-emerald-600" />} 
          title="Atletas Ativos" 
          value={loading ? '...' : stats.activeStudents}
          subtitle="Matrículas regulares"
          bg="bg-emerald-50"
          onClick={() => navigate('/alunos')}
        />
        <StatCard 
          icon={<BookOpen className="w-6 h-6 text-blue-600" />} 
          title="Turmas Abertas" 
          value={loading ? '...' : stats.totalClasses}
          subtitle="Horários e categorias"
          bg="bg-blue-50"
          onClick={() => navigate('/turmas')}
        />
        <StatCard 
          icon={<AlertCircle className="w-6 h-6 text-red-600" />} 
          title="Mensalidades em Atraso" 
          value={loading ? '...' : stats.overduePayments}
          subtitle="Requer acompanhamento"
          bg="bg-red-50"
          onClick={() => navigate('/mensalidades')}
        />
        <StatCard 
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />} 
          title="Arrecadação do Mês" 
          value={loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthRevenue)}
          subtitle={`${stats.paymentsSummary?.paid || 0} títulos liquidados`}
          bg="bg-emerald-50"
          onClick={() => navigate('/mensalidades')}
        />
      </div>

      {/* Main Grid: Próximos Treinos & Resumo Financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos Treinos */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Turmas e Treinos</h2>
              <p className="text-xs text-gray-500">Categorias em andamento</p>
            </div>
            <button
              onClick={() => navigate('/turmas')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500 text-xs">Carregando treinos...</div>
          ) : !stats.upcomingTrainings || stats.upcomingTrainings.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-xs">
              Nenhuma turma ativa cadastrada no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.upcomingTrainings.map((t: any) => (
                <div 
                  key={t.id}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
                      {t.category}
                    </span>
                    <span className="text-2xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      {t.startTime?.substring(0, 5)} - {t.endTime?.substring(0, 5)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">{t.name}</h4>
                  <p className="text-2xs text-gray-500 mt-1">Prof. {t.teacherName}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumo Financeiro */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Status de Cobranças</h2>
            <p className="text-xs text-gray-500 mb-4">Distribuição das mensalidades</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-xs font-bold text-emerald-800">Pagas</span>
                <span className="text-xs font-black text-emerald-800">{stats.paymentsSummary?.paid || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                <span className="text-xs font-bold text-blue-800">Pendentes</span>
                <span className="text-xs font-black text-blue-800">{stats.paymentsSummary?.pending || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                <span className="text-xs font-bold text-red-800">Atrasadas</span>
                <span className="text-xs font-black text-red-800">{stats.paymentsSummary?.overdue || 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => navigate('/mensalidades')}
              className="w-full py-2.5 px-4 bg-[#112F20] hover:bg-[#1E4D36] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Acessar Faturamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ 
  icon, title, value, subtitle, bg, onClick 
}: { 
  icon: React.ReactNode, title: string, value: string | number, subtitle: string, bg: string, onClick?: () => void 
}) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
  >
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">{title}</p>
      <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-1 truncate">{value}</h3>
      <p className="text-2xs text-gray-500 mt-0.5 truncate">{subtitle}</p>
    </div>
    <div className={`p-3 sm:p-3.5 rounded-2xl shrink-0 ${bg}`}>
      {icon}
    </div>
  </div>
);
