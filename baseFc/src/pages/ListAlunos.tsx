import { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Users, Search, UserPlus, FileText, CheckCircle2, XCircle, ShieldAlert, Filter, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { maskCPF } from '../utils/masks.ts';
import { StudentProfileModal } from '../components/StudentProfileModal.tsx';
import { EditStudentModal } from '../components/EditStudentModal.tsx';

export const ListAlunos = () => {
  const { token, role } = useAuth();
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadAlunos = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/students', {}, token);
      setAlunos(data || []);
    } catch (err) {
      console.error('Falha ao carregar alunos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlunos();
  }, [token]);

  const handleToggleStatus = async (aluno: any) => {
    const newStatus = aluno.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    if (actionLoading) return;
    const actionLabel = newStatus === 'INATIVO' ? 'inativar' : 'reativar';

    if (!window.confirm(`Deseja realmente ${actionLabel} o atleta ${aluno.name}?`)) {
      return;
    }

    try {
      setActionLoading(aluno.id);
      if (newStatus === 'INATIVO') {
        await fetchApi(`/students/${aluno.id}`, { method: 'DELETE' }, token);
      } else {
        await fetchApi(`/students/${aluno.id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'ATIVO' })
        }, token);
      }
      await loadAlunos();
    } catch (err: any) {
      alert(`Erro ao alterar status: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    alunos.forEach(a => { if (a.category) set.add(a.category); });
    return Array.from(set);
  }, [alunos]);

  const filteredAlunos = useMemo(() => {
    return alunos.filter(aluno => {
      const shirtNum = String(aluno.shirt_number || aluno.shirtNumber || '');
      const cleanTerm = searchTerm.trim().toLowerCase();
      const shirtSearchTerm = cleanTerm.startsWith('#') ? cleanTerm.slice(1).trim() : cleanTerm;
      const matchesSearch = 
        aluno.name.toLowerCase().includes(cleanTerm) ||
        (aluno.cpf && aluno.cpf.includes(cleanTerm)) ||
        (shirtSearchTerm && (shirtNum === shirtSearchTerm || shirtNum.includes(shirtSearchTerm)));
      
      const matchesStatus = statusFilter === 'TODOS' || aluno.status === statusFilter;
      const matchesCategory = categoryFilter === 'TODAS' || aluno.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [alunos, searchTerm, statusFilter, categoryFilter]);

  const activeCount = alunos.filter(a => a.status === 'ATIVO').length;
  const inactiveCount = alunos.filter(a => a.status === 'INATIVO').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Atletas Matriculados</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Gestão de atletas, ficha 360° e integridade de registros</p>
        </div>
        
        {role === 'GESTOR' && (
          <button 
            onClick={() => navigate('/alunos/novo')}
            className="inline-flex items-center justify-center gap-2 bg-[#112F20] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#1E4D36] transition-all shadow-md shadow-emerald-900/20 active:scale-95 cursor-pointer w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4" />
            Nova Matrícula
          </button>
        )}
      </div>

      {/* KPI Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Total Cadastrado</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{alunos.length}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Atletas Ativos</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-0.5 sm:mt-1">{activeCount}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Inativos / Trancados</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-0.5 sm:mt-1">{inactiveCount}</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 bg-gray-50/70 items-stretch md:items-center justify-between">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              maxLength={100}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, CPF ou camisa (#10)..." 
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-gray-200 py-2 px-3 rounded-lg font-medium text-gray-700 focus:outline-none focus:border-emerald-600 w-full sm:w-auto"
            >
              <option value="TODOS">Todos Status</option>
              <option value="ATIVO">Ativos</option>
              <option value="INATIVO">Inativos</option>
              <option value="TRANCADO">Trancados</option>
            </select>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="text-xs bg-white border border-gray-200 py-2 px-3 rounded-lg font-medium text-gray-700 focus:outline-none focus:border-emerald-600 w-full sm:w-auto"
              >
                <option value="TODAS">Todas Categorias</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            Carregando atletas...
          </div>
        ) : filteredAlunos.length === 0 ? (
          <div className="p-12 sm:p-16 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800">Nenhum atleta encontrado</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'TODOS' || categoryFilter !== 'TODAS'
                ? 'Nenhum atleta corresponde aos filtros selecionados. Experimente limpar a busca.'
                : 'Comece cadastrando um novo atleta com seus responsáveis.'}
            </p>
          </div>
        ) : (
          <>
            {/* Visualização Mobile: Cards Individuais de Atletas */}
            <div className="block md:hidden divide-y divide-gray-100">
              {filteredAlunos.map(aluno => (
                <div key={aluno.id} className="p-4 space-y-3 hover:bg-emerald-50/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-xl bg-[#112F20] text-emerald-300 font-bold flex items-center justify-center text-sm shadow-xs border border-emerald-800/60">
                          {aluno.name.charAt(0).toUpperCase()}
                        </div>
                        {(aluno.shirt_number || aluno.shirtNumber) && (
                          <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-3xs font-black px-1.5 py-0.2 rounded-full border-2 border-white shadow-xs">
                            #{aluno.shirt_number || aluno.shirtNumber}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{aluno.name}</h4>
                        <p className="text-2xs text-gray-500">
                          CPF: {aluno.cpf && aluno.cpf !== '00000000000' ? maskCPF(aluno.cpf) : 'Não informado'}
                        </p>
                      </div>
                    </div>

                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-3xs font-bold rounded-full ${
                      aluno.status === 'ATIVO' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : aluno.status === 'TRANCADO'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        aluno.status === 'ATIVO' ? 'bg-emerald-600' : aluno.status === 'TRANCADO' ? 'bg-amber-600' : 'bg-red-600'
                      }`}></span>
                      {aluno.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-2xs bg-gray-50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-gray-400 font-semibold block">Categoria / Camisa</span>
                      <span className="font-bold text-gray-800">{aluno.category || 'Geral'} • #{aluno.shirt_number || aluno.shirtNumber || 'S/N'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Posição / Pé</span>
                      <span className="font-bold text-gray-800">{aluno.position || 'Não def.'} • {aluno.dominant_foot || 'Destro'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setSelectedStudentId(aluno.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Ficha 360°
                    </button>

                    <button
                      onClick={() => setEditingStudentId(aluno.id)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {role === 'GESTOR' && (
                      <button
                        onClick={() => handleToggleStatus(aluno)}
                        disabled={actionLoading === aluno.id}
                        className={`inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                          aluno.status === 'ATIVO'
                            ? 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                            : 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200'
                        }`}
                      >
                        {actionLoading === aluno.id ? '...' : aluno.status === 'ATIVO' ? 'Inativar' : 'Reativar'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Visualização Desktop: Tabela Completa */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Atleta</th>
                    <th className="px-6 py-4">Categoria / Camisa</th>
                    <th className="px-6 py-4">Posição / Pé</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAlunos.map(aluno => (
                    <tr key={aluno.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-[#112F20] text-emerald-300 font-bold flex items-center justify-center text-sm shadow-xs border border-emerald-800/60">
                              {aluno.name.charAt(0).toUpperCase()}
                            </div>
                            {(aluno.shirt_number || aluno.shirtNumber) && (
                              <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-600 text-white text-3xs font-black px-1.5 py-0.2 rounded-full border-2 border-white shadow-xs">
                                #{aluno.shirt_number || aluno.shirtNumber}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{aluno.name}</div>
                            <div className="text-xs text-gray-500">
                              CPF: {aluno.cpf && aluno.cpf !== '00000000000' ? maskCPF(aluno.cpf) : 'Não informado'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-800">{aluno.category || 'Geral'}</div>
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 font-bold text-xs px-2 py-0.5 rounded-md border border-emerald-200">
                            Camisa #{aluno.shirt_number || aluno.shirtNumber || 'S/N'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{aluno.position || 'Não def.'}</div>
                        <div className="text-xs text-gray-500">Pé: {aluno.dominant_foot || 'Destro'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                          aluno.status === 'ATIVO' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : aluno.status === 'TRANCADO'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            aluno.status === 'ATIVO' ? 'bg-emerald-600' : aluno.status === 'TRANCADO' ? 'bg-amber-600' : 'bg-red-600'
                          }`}></span>
                          {aluno.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedStudentId(aluno.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                            title="Visualizar Ficha Completa 360°"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Ficha 360°
                          </button>

                          <button
                            onClick={() => setEditingStudentId(aluno.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                            title="Editar informações do atleta"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Editar
                          </button>

                          {role === 'GESTOR' && (
                            <button
                              onClick={() => handleToggleStatus(aluno)}
                              disabled={actionLoading === aluno.id}
                              className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                                aluno.status === 'ATIVO'
                                  ? 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                                  : 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200'
                              }`}
                              title={aluno.status === 'ATIVO' ? 'Inativar atleta' : 'Reativar atleta'}
                            >
                              {actionLoading === aluno.id ? (
                                <span className="animate-spin text-xs">...</span>
                              ) : aluno.status === 'ATIVO' ? (
                                'Inativar'
                              ) : (
                                'Reativar'
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Ficha 360° Modal */}
      {selectedStudentId && (
        <StudentProfileModal 
          studentId={selectedStudentId} 
          onClose={() => setSelectedStudentId(null)} 
        />
      )}

      {/* Editar Informações do Aluno Modal */}
      {editingStudentId && (
        <EditStudentModal
          studentId={editingStudentId}
          onClose={() => setEditingStudentId(null)}
          onSaved={() => {
            loadAlunos();
          }}
        />
      )}
    </div>
  );
};
