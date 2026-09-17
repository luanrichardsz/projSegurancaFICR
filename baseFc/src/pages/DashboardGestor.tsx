import { useState, useEffect } from 'react';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Users, BookOpen, AlertCircle, TrendingUp } from 'lucide-react';

export const DashboardGestor = () => {
  const { token, role } = useAuth();
  const [stats, setStats] = useState({ ativos: 0, turmas: 0, atrasadas: 0, recebido: 0 });

  // Simulação de fetch para fins visuais no MVP
  useEffect(() => {
    // Em um cenário real, bateríamos na API: const data = await fetchApi('/dashboard', {}, token)
    setStats({ ativos: 142, turmas: 12, atrasadas: 5, recebido: 12450.00 });
  }, []);

  if (role !== 'GESTOR') {
    return <div className="p-8 text-red-500">Acesso restrito a gestores.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-gray-500 mt-1">Resumo administrativo da escolinha</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users className="w-8 h-8 text-blue-500" />} title="Alunos Ativos" value={stats.ativos} />
        <StatCard icon={<BookOpen className="w-8 h-8 text-purple-500" />} title="Turmas Abertas" value={stats.turmas} />
        <StatCard icon={<AlertCircle className="w-8 h-8 text-red-500" />} title="Mensalidades Atrasadas" value={stats.atrasadas} />
        <StatCard icon={<TrendingUp className="w-8 h-8 text-green-500" />} title="Receita (Mês)" value={`R$ ${stats.recebido}`} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Próximos Treinos</h2>
        <div className="text-gray-500 text-sm">Nenhum treino agendado para hoje.</div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4">
    <div className="bg-gray-50 p-3 rounded-lg">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
    </div>
  </div>
);
