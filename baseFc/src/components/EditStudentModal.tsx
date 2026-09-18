import { useState, useEffect } from 'react';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  X, User, ShieldCheck, Heart, AlertCircle, CheckCircle2, 
  Save, AlertTriangle, Phone, Shield
} from 'lucide-react';
import { maskCPF, maskPhone, unmask } from '../utils/masks.ts';

interface Props {
  studentId: string;
  onClose: () => void;
  onSaved: () => void;
}

export const EditStudentModal = ({ studentId, onClose, onSaved }: Props) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'dados' | 'saude' | 'responsaveis'>('dados');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    dob: '',
    phone: '',
    address: '',
    category: 'Sub-11',
    position: 'Atacante',
    dominantFoot: 'DIREITO',
    shirtNumber: 10 as number | string,
    status: 'ATIVO',
    allergies: '',
    medicalRestrictions: '',
    medications: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelationship: 'Pai/Mãe',
    guardianCpf: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: 'Familiar',
    emergencyPickup: true,
    emergencyNotes: ''
  });

  useEffect(() => {
    const loadStudent = async () => {
      try {
        setLoading(true);
        const data = await fetchApi(`/students/${studentId}/profile`, {}, token);
        if (data && data.student) {
          const s = data.student;
          const g = data.guardians?.[0] || null;
          const e = data.emergencyContacts?.[0] || null;

          setFormData({
            name: s.name || '',
            cpf: s.cpf ? maskCPF(s.cpf) : '',
            dob: s.dob ? s.dob.slice(0, 10) : '',
            phone: s.phone ? maskPhone(s.phone) : '',
            address: s.address || '',
            category: s.category || 'Sub-11',
            position: s.position || 'Atacante',
            dominantFoot: s.dominantFoot || s.dominant_foot || 'DIREITO',
            shirtNumber: s.shirtNumber || s.shirt_number || 10,
            status: s.status || 'ATIVO',
            allergies: s.allergies || '',
            medicalRestrictions: s.medicalRestrictions || s.medical_restrictions || '',
            medications: s.medications || '',
            guardianName: g?.name || '',
            guardianPhone: g?.phone ? maskPhone(g.phone) : '',
            guardianRelationship: g?.relationship || 'Pai/Mãe',
            guardianCpf: g?.cpf ? maskCPF(g.cpf) : '',
            emergencyName: e?.name || '',
            emergencyPhone: e?.phone ? maskPhone(e.phone) : '',
            emergencyRelationship: e?.relationship || 'Familiar',
            emergencyPickup: e?.authorized_pickup ?? true,
            emergencyNotes: e?.notes || ''
          });
        }
      } catch (err) {
        console.error('Erro ao carregar dados do aluno:', err);
        setErrorMsg('Não foi possível carregar os dados do atleta.');
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [studentId, token]);

  // Cálculo de idade exata do atleta (anos completos)
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const parts = dobString.split('-').map(Number);
    if (parts.length !== 3) return 0;
    const [year, month, day] = parts;
    const dob = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const now = new Date();
  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const maxDob = formatYMD(new Date(now.getFullYear() - 6, now.getMonth(), now.getDate()));
  const minDob = formatYMD(new Date(now.getFullYear() - 17, now.getMonth(), now.getDate() + 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setErrorMsg('O nome do atleta deve conter no mínimo 3 caracteres.');
      setActiveTab('dados');
      return;
    }

    if (!formData.dob) {
      setErrorMsg('Data de nascimento é obrigatória.');
      setActiveTab('dados');
      return;
    }

    const athleteAge = calculateAge(formData.dob);
    if (athleteAge < 6 || athleteAge > 16) {
      setErrorMsg(`A idade do atleta é de ${athleteAge} anos. A escolinha aceita apenas atletas entre 6 e 16 anos (categorias Sub-7 ao Sub-17).`);
      setActiveTab('dados');
      return;
    }

    const shirt = Number(formData.shirtNumber);
    if (!formData.shirtNumber || isNaN(shirt) || shirt < 1 || shirt > 99) {
      setErrorMsg('O número da camisa deve conter no máximo 2 dígitos (entre 1 e 99).');
      setActiveTab('dados');
      return;
    }

    try {
      setSaveLoading(true);
      setErrorMsg('');

      const payload: any = {
        name: formData.name.trim(),
        cpf: unmask(formData.cpf) || null,
        dob: formData.dob,
        phone: unmask(formData.phone) || null,
        address: formData.address.trim() || null,
        category: formData.category,
        position: formData.position,
        dominantFoot: formData.dominantFoot,
        shirtNumber: Number(formData.shirtNumber) || 10,
        status: formData.status,
        allergies: formData.allergies.trim() || null,
        medicalRestrictions: formData.medicalRestrictions.trim() || null,
        medications: formData.medications.trim() || null
      };

      if (formData.guardianName.trim()) {
        payload.guardian = {
          name: formData.guardianName.trim(),
          phone: unmask(formData.guardianPhone) || '000000000',
          cpf: unmask(formData.guardianCpf) || null,
          relationship: formData.guardianRelationship || 'Pai/Mãe'
        };
      }

      if (formData.emergencyName.trim()) {
        payload.emergencyContact = {
          name: formData.emergencyName.trim(),
          phone: unmask(formData.emergencyPhone) || '000000000',
          relationship: formData.emergencyRelationship || 'Familiar',
          authorizedPickup: Boolean(formData.emergencyPickup),
          notes: formData.emergencyNotes.trim() || null
        };
      }

      await fetchApi(`/students/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }, token);

      setSuccessMsg('Dados do atleta atualizados com sucesso!');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar dados do atleta');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm font-medium">Carregando dados do atleta para edição...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Header */}
        <div className="bg-[#112F20] text-white p-4 sm:p-6 relative shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-10 sm:pr-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-base sm:text-lg flex items-center justify-center shadow-inner shrink-0">
              #{formData.shirtNumber || '--'}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-white truncate">Editar Dados do Atleta</h3>
              <p className="text-emerald-200/80 text-2xs sm:text-xs mt-0.5 line-clamp-1">
                Atualize as informações esportivas, cadastrais e contatos.
              </p>
            </div>
          </div>

          {/* Abas */}
          <div className="flex space-x-1 sm:space-x-2 mt-4 sm:mt-5 border-b border-white/10 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('dados')}
              className={`flex items-center px-3 sm:px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                activeTab === 'dados'
                  ? 'border-emerald-400 text-emerald-300 bg-white/5 rounded-t-lg'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
              Identificação
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saude')}
              className={`flex items-center px-3 sm:px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                activeTab === 'saude'
                  ? 'border-emerald-400 text-emerald-300 bg-white/5 rounded-t-lg'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
              Saúde & Restrições
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('responsaveis')}
              className={`flex items-center px-3 sm:px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                activeTab === 'responsaveis'
                  ? 'border-emerald-400 text-emerald-300 bg-white/5 rounded-t-lg'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
              Responsável & Emergência
            </button>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="p-4 sm:p-7 space-y-4 sm:space-y-5">
            
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ABA 1: DADOS GERAIS & ESPORTIVOS */}
            {activeTab === 'dados' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo do Atleta *</label>
                  <input 
                    type="text"
                    required
                    maxLength={100}
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Data de Nascimento * <span className="font-normal text-emerald-600 text-2xs">(6 a 16 anos)</span>
                    </label>
                    <input 
                      type="date"
                      required
                      min={minDob}
                      max={maxDob}
                      value={formData.dob}
                      onChange={e => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                    />
                    {formData.dob && (
                      <p className="text-2xs text-gray-400 mt-1">
                        {(() => {
                          const age = calculateAge(formData.dob);
                          return age >= 6 && age <= 16
                            ? `Idade: ${age} anos (Válido)`
                            : `Idade: ${age} anos (Fora do limite de 6 a 16 anos)`;
                        })()}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">CPF do Atleta</label>
                    <input 
                      type="text"
                      maxLength={14}
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={e => setFormData(prev => ({ ...prev, cpf: maskCPF(e.target.value) }))}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Telefone do Atleta</label>
                    <input 
                      type="text"
                      maxLength={15}
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Categoria *</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                    >
                      <option value="Sub-7">Sub-7</option>
                      <option value="Sub-9">Sub-9</option>
                      <option value="Sub-11">Sub-11</option>
                      <option value="Sub-13">Sub-13</option>
                      <option value="Sub-15">Sub-15</option>
                      <option value="Sub-17">Sub-17</option>
                      <option value="Feminino Base">Feminino Base</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Posição *</label>
                    <select
                      value={formData.position}
                      onChange={e => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                    >
                      <option value="Atacante">Atacante</option>
                      <option value="Centroavante">Centroavante</option>
                      <option value="Ponta Direita">Ponta Direita</option>
                      <option value="Ponta Esquerda">Ponta Esquerda</option>
                      <option value="Meio-campo">Meio-campo</option>
                      <option value="Volante">Volante</option>
                      <option value="Lateral Direito">Lateral Direito</option>
                      <option value="Lateral Esquerdo">Lateral Esquerdo</option>
                      <option value="Zagueiro">Zagueiro</option>
                      <option value="Goleiro">Goleiro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Pé Dominante *</label>
                    <select
                      value={formData.dominantFoot}
                      onChange={e => setFormData(prev => ({ ...prev, dominantFoot: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                    >
                      <option value="DIREITO">Destro (Direito)</option>
                      <option value="ESQUERDO">Canhoto (Esquerdo)</option>
                      <option value="AMBIDESTRO">Ambidestro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Camisa (1-99) *</label>
                    <input 
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      placeholder="10"
                      required
                      value={formData.shirtNumber}
                      onKeyDown={e => {
                        if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                          return;
                        }
                        if (!/^\d$/.test(e.key)) {
                          e.preventDefault();
                          return;
                        }
                        const input = e.currentTarget;
                        const hasSelection = (input.selectionEnd ?? 0) - (input.selectionStart ?? 0) > 0;
                        if (!hasSelection && input.value.length >= 2) {
                          e.preventDefault();
                        }
                      }}
                      onInput={e => {
                        const input = e.currentTarget;
                        if (input.value.length > 2) {
                          input.value = input.value.slice(0, 2);
                        }
                      }}
                      onChange={e => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 2);
                        setFormData(prev => ({ ...prev, shirtNumber: clean }));
                      }}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Status da Matrícula</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                    >
                      <option value="ATIVO">ATIVO</option>
                      <option value="INATIVO">INATIVO</option>
                      <option value="TRANCADO">TRANCADO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Endereço Residencial</label>
                    <input 
                      type="text"
                      maxLength={150}
                      placeholder="Rua, número, bairro, cidade"
                      value={formData.address}
                      onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: SAÚDE & RESTRIÇÕES */}
            {activeTab === 'saude' && (
              <div className="space-y-4">
                <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Informações Médicas de Emergência:</strong>
                    <p className="text-2xs text-amber-800 mt-0.5">
                      Essas restrições aparecem em destaque na ficha rápida para garantir a segurança do atleta durante os treinos e partidas.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Restrições Médicas / Físicas</label>
                  <textarea 
                    rows={2}
                    maxLength={200}
                    placeholder="Ex: Asma induzida por esforço, problemas articulares no joelho..."
                    value={formData.medicalRestrictions}
                    onChange={e => setFormData(prev => ({ ...prev, medicalRestrictions: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Alergias Relatadas</label>
                  <input 
                    type="text"
                    maxLength={200}
                    placeholder="Ex: Penicilina, picada de abelha, lactose, amendoim..."
                    value={formData.allergies}
                    onChange={e => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Medicações de Uso Contínuo</label>
                  <input 
                    type="text"
                    maxLength={200}
                    placeholder="Ex: Bombinha de salbutamol antes do treino, antialérgico..."
                    value={formData.medications}
                    onChange={e => setFormData(prev => ({ ...prev, medications: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                  />
                </div>
              </div>
            )}

            {/* ABA 3: RESPONSÁVEL & SEGURANÇA */}
            {activeTab === 'responsaveis' && (
              <div className="space-y-5">
                {/* Bloco Responsável Legal */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-700" />
                    Responsável Legal Principal
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Responsável</label>
                      <input 
                        type="text"
                        maxLength={100}
                        placeholder="Nome completo do pai, mãe ou tutor"
                        value={formData.guardianName}
                        onChange={e => setFormData(prev => ({ ...prev, guardianName: e.target.value }))}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Telefone do Responsável</label>
                      <input 
                        type="text"
                        maxLength={15}
                        placeholder="(00) 00000-0000"
                        value={formData.guardianPhone}
                        onChange={e => setFormData(prev => ({ ...prev, guardianPhone: maskPhone(e.target.value) }))}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Parentesco</label>
                      <input 
                        type="text"
                        maxLength={50}
                        placeholder="Ex: Mãe, Pai, Avô..."
                        value={formData.guardianRelationship}
                        onChange={e => setFormData(prev => ({ ...prev, guardianRelationship: e.target.value }))}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">CPF do Responsável</label>
                      <input 
                        type="text"
                        maxLength={14}
                        placeholder="000.000.000-00"
                        value={formData.guardianCpf}
                        onChange={e => setFormData(prev => ({ ...prev, guardianCpf: maskCPF(e.target.value) }))}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloco Contato de Emergência & Retirada */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-700" />
                    Contato de Emergência & Retirada do Menor
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nome para Emergência</label>
                      <input 
                        type="text"
                        maxLength={100}
                        placeholder="Nome da pessoa a acionar"
                        value={formData.emergencyName}
                        onChange={e => setFormData(prev => ({ ...prev, emergencyName: e.target.value }))}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Telefone de Emergência</label>
                      <input 
                        type="text"
                        maxLength={15}
                        placeholder="(00) 00000-0000"
                        value={formData.emergencyPhone}
                        onChange={e => setFormData(prev => ({ ...prev, emergencyPhone: maskPhone(e.target.value) }))}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input 
                      type="checkbox"
                      id="emergencyPickup"
                      checked={formData.emergencyPickup}
                      onChange={e => setFormData(prev => ({ ...prev, emergencyPickup: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="emergencyPickup" className="text-xs font-bold text-gray-800 cursor-pointer">
                      Esta pessoa está autorizada a retirar o menor da escolinha após os treinos
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer com Ações */}
          <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saveLoading}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-[#112F20] hover:bg-[#1E4D36] rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-center"
            >
              {saveLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando alterações...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
