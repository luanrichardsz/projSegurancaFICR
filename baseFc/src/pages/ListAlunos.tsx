import { useState, useEffect } from 'react';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Users, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ListAlunos = () => {
  const { token, role } = useAuth();
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadAlunos = async () => {
      try {
        const data = await fetchApi('/students', {}, token);
        setAlunos(data);
      } catch (err) {
        console.error('Falha ao carregar alunos', err);
      } finally {
        setLoading(false);
      }
    };
    loadAlunos();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alunos</h1>
          <p className="text-gray-500 mt-1">Gerenciamento de atletas</p>
        </div>
        
        {role === 'GESTOR' && (
          <button 
            onClick={() => navigate('/alunos/novo')}
            className="bg-[#112F20] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#1E4D36] transition-colors shadow-lg shadow-green-900/20"
          >
            Matricular Aluno
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center bg-gray-50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar aluno por nome ou CPF..." 
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando dados...</div>
        ) : alunos.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum aluno encontrado</h3>
            <p className="text-gray-500">Comece matriculando um novo aluno no sistema.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nome do Atleta</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Posição</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alunos.map(aluno => (
                <tr key={aluno.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{aluno.name}</div>
                    <div className="text-xs text-gray-500 mt-1">CPF: {aluno.cpf}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{aluno.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{aluno.position}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      aluno.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {aluno.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
