import { useState, useEffect } from 'react';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  UserCheck, Plus, Mail, Phone, Award, Shield, 
  Trash2, X, AlertCircle, CheckCircle2, Search
} from 'lucide-react';
import { maskPhone, unmask, isValidPhone } from '../utils/masks.ts';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  cref?: string;
  specialties?: string[];
  status: string;
  classes?: { id: string; name: string }[];
}

export const Professores = () => {
  const { token, role } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // New teacher modal
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    cref: '',
    specialties: 'Preparação Física, Iniciação'
  });

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/teachers', {}, token);
      setTeachers(data || []);
    } catch (err) {
      console.error('Erro ao carregar comissão técnica', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, [token]);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (newTeacher.name.trim().length < 3) {
      setFormError('O nome do professor deve ter no mínimo 3 caracteres.');
      return;
    }

    if (newTeacher.phone && unmask(newTeacher.phone).length > 0) {
      if (!isValidPhone(newTeacher.phone)) {
        setFormError('O telefone deve conter DDD + 8 ou 9 dígitos válidos.');
        return;
      }
    }

    try {
      setFormLoading(true);
      
      const specialtiesArray = newTeacher.specialties
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await fetchApi('/teachers', {
        method: 'POST',
        body: JSON.stringify({
          name: newTeacher.name.trim(),
          email: newTeacher.email.trim().toLowerCase(),
          phone: unmask(newTeacher.phone) || undefined,
          cref: newTeacher.cref.trim().toUpperCase() || undefined,
          specialties: specialtiesArray
        })
      }, token);

      setShowModal(false);
      setNewTeacher({
        name: '',
        email: '',
        phone: '',
        cref: '',
        specialties: 'Preparação Física, Iniciação'
      });
      await loadTeachers();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao cadastrar professor');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!window.confirm(`Deseja inativar o professor ${name}?`)) return;
    try {
      await fetchApi(`/teachers/${id}`, { method: 'DELETE' }, token);
      await loadTeachers();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.cref && t.cref.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Comissão Técnica</h1>
          <p className="text-gray-500 mt-1">Professores, treinadores e preparadores físicos da escolinha</p>
        </div>
        
        {role === 'GESTOR' && (
          <button 
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#112F20] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#1E4D36] transition-all shadow-md shadow-emerald-900/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Professor
          </button>
        )}
      </div>

      {/* Search with length limit */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input 
          type="text"
          maxLength={100}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar professor por nome, e-mail ou CREF..."
          className="w-full text-xs text-gray-800 bg-transparent focus:outline-none"
        />
      </div>

      {/* Grid of Teachers */}
      {loading ? (
        <div className="p-16 text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          Carregando professores...
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-xs">
          <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800">Nenhum professor cadastrado</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Cadastre os profissionais da comissão técnica para vinculá-los às turmas de treino.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map(teacher => (
            <div 
              key={teacher.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#112F20] text-emerald-300 font-bold flex items-center justify-center text-base shadow-xs">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{teacher.name}</h3>
                      <span className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-0.5">
                        <Award className="w-3 h-3" /> CREF: {teacher.cref || 'Não informado'}
                      </span>
                    </div>
                  </div>

                  {role === 'GESTOR' && (
                    <button
                      onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Inativar professor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-xs text-gray-600 mb-4 pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{teacher.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{teacher.phone ? maskPhone(teacher.phone) : 'Sem telefone'}</span>
                  </div>
                </div>

                {/* Specialties */}
                <div>
                  <p className="text-2xs font-bold text-gray-400 uppercase tracking-wider mb-2">Especialidades</p>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.specialties && teacher.specialties.length > 0 ? (
                      teacher.specialties.map((spec, i) => (
                        <span key={i} className="text-2xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                          {spec}
                        </span>
                      ))
                    ) : (
                      <span className="text-2xs text-gray-400 italic">Treinador Geral</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-between text-2xs text-gray-500">
                <span>Status:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {teacher.status || 'ATIVO'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Cadastrar Professor */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cadastrar Professor</h3>
                <p className="text-xs text-gray-500">Adicione um novo integrante à comissão técnica</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-4 pt-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo *</label>
                <input 
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Ex: Carlos Eduardo Silva"
                  value={newTeacher.name}
                  onChange={e => setNewTeacher(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">E-mail *</label>
                  <input 
                    type="email"
                    required
                    maxLength={100}
                    placeholder="carlos@escolinha.com"
                    value={newTeacher.email}
                    onChange={e => setNewTeacher(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telefone / Celular</label>
                  <input 
                    type="tel"
                    maxLength={15}
                    placeholder="(81) 98888-7777"
                    value={newTeacher.phone}
                    onChange={e => setNewTeacher(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Registro Profissional (CREF)</label>
                <input 
                  type="text"
                  maxLength={20}
                  placeholder="Ex: 012345-G/PE"
                  value={newTeacher.cref}
                  onChange={e => setNewTeacher(prev => ({ ...prev, cref: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Especialidades (separadas por vírgula)</label>
                <input 
                  type="text"
                  maxLength={200}
                  placeholder="Ex: Treinador de Goleiros, Tático Sub-15, Futsal"
                  value={newTeacher.specialties}
                  onChange={e => setNewTeacher(prev => ({ ...prev, specialties: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#112F20] hover:bg-[#1E4D36] rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {formLoading ? 'Cadastrando...' : 'Salvar Professor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
