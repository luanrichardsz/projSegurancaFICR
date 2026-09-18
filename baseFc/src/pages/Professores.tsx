import { useState, useEffect } from 'react';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  UserCheck, Plus, Mail, Phone, Award, Shield, 
  Trash2, X, AlertCircle, CheckCircle2, Search, Edit2
} from 'lucide-react';
import { maskPhone, unmask, isValidPhone } from '../utils/masks.ts';

interface Teacher {
  id: string;
  name: string;
  email?: string;
  phone?: string;
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

  // New teacher modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    cref: '',
    specialties: 'Preparação Física, Iniciação'
  });

  // Edit teacher modal state
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    cref: '',
    specialties: '',
    status: 'ATIVO'
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

  // Create Teacher
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (newTeacher.name.trim().length < 3) {
      setCreateError('O nome do professor deve ter no mínimo 3 caracteres.');
      return;
    }

    if (newTeacher.phone && unmask(newTeacher.phone).length > 0) {
      if (!isValidPhone(newTeacher.phone)) {
        setCreateError('O telefone deve conter DDD + 8 ou 9 dígitos válidos.');
        return;
      }
    }

    try {
      setCreateLoading(true);
      
      const specialtiesArray = newTeacher.specialties
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await fetchApi('/teachers', {
        method: 'POST',
        body: JSON.stringify({
          name: newTeacher.name.trim(),
          email: newTeacher.email.trim().toLowerCase() || undefined,
          phone: unmask(newTeacher.phone) || undefined,
          cref: newTeacher.cref.trim().toUpperCase() || undefined,
          specialties: specialtiesArray
        })
      }, token);

      setShowCreateModal(false);
      setNewTeacher({
        name: '',
        email: '',
        phone: '',
        cref: '',
        specialties: 'Preparação Física, Iniciação'
      });
      await loadTeachers();
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao cadastrar professor');
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditError('');
    setEditForm({
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone ? maskPhone(teacher.phone) : '',
      cref: teacher.cref || '',
      specialties: Array.isArray(teacher.specialties) ? teacher.specialties.join(', ') : '',
      status: teacher.status || 'ATIVO'
    });
  };

  // Submit Update
  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setEditError('');

    if (editForm.name.trim().length < 3) {
      setEditError('O nome do professor deve ter no mínimo 3 caracteres.');
      return;
    }

    if (editForm.phone && unmask(editForm.phone).length > 0) {
      if (!isValidPhone(editForm.phone)) {
        setEditError('O telefone deve conter DDD + 8 ou 9 dígitos válidos.');
        return;
      }
    }

    try {
      setEditLoading(true);

      const specialtiesArray = editForm.specialties
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await fetchApi(`/teachers/${editingTeacher.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim().toLowerCase() || null,
          phone: unmask(editForm.phone) || null,
          cref: editForm.cref.trim().toUpperCase() || null,
          specialties: specialtiesArray,
          status: editForm.status
        })
      }, token);

      setEditingTeacher(null);
      await loadTeachers();
    } catch (err: any) {
      setEditError(err.message || 'Erro ao atualizar dados do professor');
    } finally {
      setEditLoading(false);
    }
  };

  // Inactivate / Delete Teacher
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
    (t.name && t.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.cref && t.cref.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Comissão Técnica</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Professores, treinadores e preparadores físicos da escolinha</p>
        </div>
        
        {role === 'GESTOR' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#112F20] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#1E4D36] transition-all shadow-md shadow-emerald-900/20 active:scale-95"
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
                      {teacher.name ? teacher.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{teacher.name}</h3>
                      <span className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-0.5">
                        <Award className="w-3 h-3" /> CREF: {teacher.cref || 'Não informado'}
                      </span>
                    </div>
                  </div>

                  {role === 'GESTOR' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(teacher)}
                        className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Editar professor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Inativar professor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs text-gray-600 mb-4 pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{teacher.email || 'E-mail não cadastrado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{teacher.phone ? maskPhone(teacher.phone) : 'Telefone não cadastrado'}</span>
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
                <span className={`font-bold px-2 py-0.5 rounded-full ${
                  teacher.status === 'ATIVO' 
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                    : 'text-red-700 bg-red-50 border border-red-200'
                }`}>
                  {teacher.status || 'ATIVO'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Cadastrar Professor */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cadastrar Professor</h3>
                <p className="text-xs text-gray-500">Adicione um novo integrante à comissão técnica</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-4 pt-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">E-mail</label>
                  <input 
                    type="email"
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

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-[#112F20] hover:bg-[#1E4D36] rounded-xl transition-all shadow-xs disabled:opacity-50 text-center"
                >
                  {createLoading ? 'Cadastrando...' : 'Salvar Professor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Editar Professor */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Editar Professor</h3>
                <p className="text-xs text-gray-500">Atualize dados cadastrais, e-mail, telefone e CREF</p>
              </div>
              <button 
                onClick={() => setEditingTeacher(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTeacher} className="space-y-4 pt-4">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo *</label>
                <input 
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Ex: Carlos Eduardo Silva"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">E-mail</label>
                  <input 
                    type="email"
                    maxLength={100}
                    placeholder="carlos@escolinha.com"
                    value={editForm.email}
                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telefone / Celular</label>
                  <input 
                    type="tel"
                    maxLength={15}
                    placeholder="(81) 98888-7777"
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">CREF</label>
                  <input 
                    type="text"
                    maxLength={20}
                    placeholder="Ex: 012345-G/PE"
                    value={editForm.cref}
                    onChange={e => setEditForm(prev => ({ ...prev, cref: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Especialidades (separadas por vírgula)</label>
                <input 
                  type="text"
                  maxLength={200}
                  placeholder="Ex: Treinador de Goleiros, Tático Sub-15, Futsal"
                  value={editForm.specialties}
                  onChange={e => setEditForm(prev => ({ ...prev, specialties: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs disabled:opacity-50 text-center"
                >
                  {editLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
