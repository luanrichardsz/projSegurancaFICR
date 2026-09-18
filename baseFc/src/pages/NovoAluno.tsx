import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { UserPlus, ArrowLeft, ShieldCheck, Heart, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { maskCPF, maskPhone, unmask, isValidCPF, isValidPhone } from '../utils/masks.ts';

export const NovoAluno = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Aluno
    name: '',
    cpf: '',
    dob: '',
    phone: '',
    address: '',
    category: 'Sub-11',
    position: 'Meia',
    dominantFoot: 'DIREITO',
    shirtNumber: 10 as number | string,
    classId: '',
    allergies: '',
    medicalRestrictions: '',
    medications: '',
    // Responsável
    guardianName: '',
    guardianCpf: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelationship: 'Pai',
    // Emergência & Retirada
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: 'Mãe',
    authorizedPickup: true,
    emergencyNotes: ''
  });

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await fetchApi('/classes', {}, token);
        setClasses(data || []);
      } catch (err) {
        console.error('Falha ao carregar turmas', err);
      }
    };
    loadClasses();
  }, [token]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || submittingRef.current) return;
    setError('');

    // Validações de Consistência e Integridade (OWASP Input Validation)
    if (formData.name.trim().length < 3) {
      setError('O nome do atleta deve ter no mínimo 3 caracteres.');
      return;
    }

    if (!formData.dob) {
      setError('A data de nascimento do atleta é obrigatória.');
      return;
    }

    const athleteAge = calculateAge(formData.dob);
    if (athleteAge < 6 || athleteAge > 16) {
      setError(`A idade do atleta é de ${athleteAge} anos. A escolinha aceita apenas atletas entre 6 e 16 anos (categorias Sub-7 ao Sub-17).`);
      return;
    }

    if (formData.cpf && unmask(formData.cpf).length > 0) {
      if (!isValidCPF(formData.cpf)) {
        setError('O CPF informado para o atleta é inválido. Verifique os dígitos digitados.');
        return;
      }
    }

    if (!formData.guardianName.trim()) {
      setError('O nome do responsável legal é obrigatório.');
      return;
    }

    if (!isValidPhone(formData.guardianPhone)) {
      setError('O telefone do responsável deve conter DDD + 8 ou 9 dígitos válidos.');
      return;
    }

    if (formData.guardianCpf && unmask(formData.guardianCpf).length > 0) {
      if (!isValidCPF(formData.guardianCpf)) {
        setError('O CPF informado para o responsável é inválido.');
        return;
      }
    }

    if (formData.emergencyPhone && unmask(formData.emergencyPhone).length > 0) {
      if (!isValidPhone(formData.emergencyPhone)) {
        setError('O telefone de emergência deve conter DDD + 8 ou 9 dígitos válidos.');
        return;
      }
    }

    if (formData.guardianEmail && formData.guardianEmail.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.guardianEmail.trim())) {
        setError('O e-mail do responsável informado é inválido.');
        return;
      }
    }

    const shirt = Number(formData.shirtNumber);
    if (!formData.shirtNumber || isNaN(shirt) || shirt < 1 || shirt > 99) {
      setError('O número da camisa deve conter no máximo 2 dígitos (entre 1 e 99).');
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      // Sanitização de dados: desmascara CPF e telefones antes de enviar ao banco de dados
      const cleanStudentCpf = unmask(formData.cpf);
      const cleanGuardianCpf = unmask(formData.guardianCpf);
      const cleanGuardianPhone = unmask(formData.guardianPhone);
      const cleanEmergencyPhone = unmask(formData.emergencyPhone);
      const cleanStudentPhone = unmask(formData.phone);

      const payload: any = {
        name: formData.name.trim(),
        cpf: cleanStudentCpf || undefined,
        dob: formData.dob,
        phone: cleanStudentPhone || undefined,
        address: formData.address.trim() || undefined,
        category: formData.category,
        position: formData.position,
        dominantFoot: formData.dominantFoot,
        shirtNumber: Number(formData.shirtNumber),
        classId: formData.classId || undefined,
        allergies: formData.allergies.trim() || undefined,
        medicalRestrictions: formData.medicalRestrictions.trim() || undefined,
        medications: formData.medications.trim() || undefined
      };

      if (formData.guardianName) {
        payload.guardian = {
          name: formData.guardianName.trim(),
          cpf: cleanGuardianCpf || undefined,
          phone: cleanGuardianPhone,
          email: formData.guardianEmail.trim() ? formData.guardianEmail.trim().toLowerCase() : undefined,
          relationship: formData.guardianRelationship
        };
      }

      if (formData.emergencyName || cleanEmergencyPhone) {
        payload.emergencyContact = {
          name: formData.emergencyName.trim() || formData.guardianName.trim(),
          phone: cleanEmergencyPhone || cleanGuardianPhone,
          relationship: formData.emergencyRelationship || 'Responsável',
          authorizedPickup: formData.authorizedPickup,
          notes: formData.emergencyNotes.trim() || undefined
        };
      }

      // Envia a URL de origem atual do frontend para garantir o link de convite e definição de senha correto
      payload.clientOrigin = window.location.origin;

      await fetchApi('/students', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, token);

      const hasEmail = !!formData.guardianEmail.trim();
      setSuccessMsg(
        hasEmail 
          ? 'Aluno matriculado com sucesso! Convite de acesso ao Portal dos Pais enviado com segurança via Supabase.'
          : 'Aluno matriculado com sucesso! Redirecionando...'
      );
      setSuccess(true);
      setTimeout(() => {
        navigate('/alunos');
      }, hasEmail ? 2500 : 1500);
    } catch (err: any) {
      setError(err?.message || 'Falha ao cadastrar atleta.');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  // Limites de data de nascimento para atletas entre 6 e 16 anos completos
  const now = new Date();
  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Idade mínima: 6 anos completos (máxima data de nascimento: hoje há 6 anos)
  const maxDob = formatYMD(new Date(now.getFullYear() - 6, now.getMonth(), now.getDate()));
  // Idade máxima: 16 anos completos (mínima data de nascimento: hoje há 17 anos + 1 dia)
  const minDob = formatYMD(new Date(now.getFullYear() - 17, now.getMonth(), now.getDate() + 1));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button 
          onClick={() => navigate('/alunos')}
          className="p-2 sm:p-2.5 bg-white rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-xs shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Nova Matrícula de Atleta</h1>
          <p className="text-xs text-gray-500">Cadastro unificado com validação de integridade</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center space-x-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
          <span className="font-bold">{successMsg || 'Aluno matriculado com sucesso! Redirecionando...'}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Bloco 1: Dados do Atleta */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <UserPlus className="w-5 h-5 text-green-700" />
            <h2 className="font-bold text-gray-900 text-base sm:text-lg">Dados do Atleta</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome Completo *</label>
              <input 
                type="text" 
                required 
                maxLength={100}
                placeholder="Ex: Lucas Gabriel da Silva"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-600 uppercase">
                  Data de Nascimento *
                </label>
                <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  6 a 16 anos (Sub-7 a Sub-17)
                </span>
              </div>
              <input 
                type="date" 
                required 
                min={minDob}
                max={maxDob}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.dob}
                onChange={e => setFormData({...formData, dob: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                CPF do Atleta (Opcional)
                <span className="text-2xs font-normal text-gray-400 ml-1">(11 dígitos)</span>
              </label>
              <input 
                type="text" 
                maxLength={14}
                placeholder="000.000.000-00"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.cpf}
                onChange={e => setFormData({...formData, cpf: maskCPF(e.target.value)})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Telefone do Atleta (Opcional)</label>
              <input 
                type="tel" 
                maxLength={15}
                placeholder="(81) 99999-9999"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Endereço Residencial</label>
              <input 
                type="text" 
                maxLength={150}
                placeholder="Rua, número, bairro, cidade"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Categoria *</label>
              <select 
                required
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="Sub-7">Sub-7 (Iniciação)</option>
                <option value="Sub-9">Sub-9</option>
                <option value="Sub-11">Sub-11</option>
                <option value="Sub-13">Sub-13</option>
                <option value="Sub-15">Sub-15</option>
                <option value="Sub-17">Sub-17</option>
                <option value="Feminino Base">Feminino Base</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Posição Preferida *</label>
              <select 
                required
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.position}
                onChange={e => setFormData({...formData, position: e.target.value})}
              >
                <option value="Goleiro">Goleiro</option>
                <option value="Zagueiro">Zagueiro</option>
                <option value="Lateral Direito">Lateral Direito</option>
                <option value="Lateral Esquerdo">Lateral Esquerdo</option>
                <option value="Volante">Volante</option>
                <option value="Meia">Meia</option>
                <option value="Ponta Direita">Ponta Direita</option>
                <option value="Ponta Esquerda">Ponta Esquerda</option>
                <option value="Centroavante">Centroavante</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Pé Dominante *</label>
              <select 
                required
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.dominantFoot}
                onChange={e => setFormData({...formData, dominantFoot: e.target.value})}
              >
                <option value="DIREITO">Destro (Direito)</option>
                <option value="ESQUERDO">Canhoto (Esquerdo)</option>
                <option value="AMBIDESTRO">Ambidestro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Número da Camisa (1 - 99) *</label>
              <input 
                type="text" 
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                placeholder="10"
                required 
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-semibold"
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
                  setFormData({ ...formData, shirtNumber: clean });
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Turma Inicial (Opcional)</label>
              <select 
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.classId}
                onChange={e => setFormData({...formData, classId: e.target.value})}
              >
                <option value="">Nenhuma turma selecionada (matricular depois)</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id} disabled={c.isFull}>
                    {c.name} ({c.category}) - {c.enrolledCount}/{c.capacity} vagas {c.isFull ? '(LOTADA)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bloco 2: Dados Médicos e Restrições (Confidencialidade) */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <Heart className="w-5 h-5 text-red-600" />
            <div>
              <h2 className="font-bold text-gray-900 text-base sm:text-lg">Informações de Saúde e Médicas</h2>
              <p className="text-2xs text-gray-400">Dados sensíveis protegidos por controle de acesso</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Alergias Conhecidas</label>
              <input 
                type="text" 
                maxLength={200}
                placeholder="Ex: Alergia a picada de insetos, amendoim"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.allergies}
                onChange={e => setFormData({...formData, allergies: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Restrições para Exercícios</label>
              <input 
                type="text" 
                maxLength={200}
                placeholder="Ex: Asma induzida por esforço"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.medicalRestrictions}
                onChange={e => setFormData({...formData, medicalRestrictions: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Medicamentos de Uso Contínuo</label>
              <input 
                type="text" 
                maxLength={200}
                placeholder="Ex: Bombinha de salbutamol"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.medications}
                onChange={e => setFormData({...formData, medications: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Bloco 3: Dados do Responsável */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-green-700" />
            <h2 className="font-bold text-gray-900 text-base sm:text-lg">Responsável Legal</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome do Responsável *</label>
              <input 
                type="text" 
                required
                maxLength={100}
                placeholder="Ex: Marcos Silva"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.guardianName}
                onChange={e => setFormData({...formData, guardianName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                CPF do Responsável (Opcional)
                <span className="text-2xs font-normal text-gray-400 ml-1">(11 dígitos)</span>
              </label>
              <input 
                type="text" 
                maxLength={14}
                placeholder="000.000.000-00"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.guardianCpf}
                onChange={e => setFormData({...formData, guardianCpf: maskCPF(e.target.value)})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Telefone / WhatsApp *</label>
              <input 
                type="tel" 
                required
                maxLength={15}
                placeholder="(81) 99999-9999"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.guardianPhone}
                onChange={e => setFormData({...formData, guardianPhone: maskPhone(e.target.value)})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                E-mail do Responsável (Opcional)
                <span className="text-2xs font-normal text-emerald-600 ml-1">(Para acesso ao Portal)</span>
              </label>
              <input 
                type="email" 
                maxLength={100}
                placeholder="Ex: responsavel@email.com"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.guardianEmail}
                onChange={e => setFormData({...formData, guardianEmail: e.target.value})}
              />
              <p className="text-2xs text-gray-400 mt-1">
                Se informado, o Supabase enviará um convite seguro por e-mail para criar a senha de acesso ao Portal dos Pais.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Parentesco *</label>
              <select 
                required
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.guardianRelationship}
                onChange={e => setFormData({...formData, guardianRelationship: e.target.value})}
              >
                <option value="Pai">Pai</option>
                <option value="Mãe">Mãe</option>
                <option value="Avô/Avó">Avô / Avó</option>
                <option value="Tutor">Tutor(a) Legal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bloco 4: Contatos de Emergência & Retirada */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <ShieldAlert className="w-5 h-5 text-green-700" />
            <h2 className="font-bold text-gray-900 text-base sm:text-lg">Contato de Emergência & Autorização de Retirada</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome para Emergência</label>
              <input 
                type="text" 
                maxLength={100}
                placeholder="Ex: Ana Silva"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.emergencyName}
                onChange={e => setFormData({...formData, emergencyName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Telefone de Emergência</label>
              <input 
                type="tel" 
                maxLength={15}
                placeholder="(81) 98888-8888"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.emergencyPhone}
                onChange={e => setFormData({...formData, emergencyPhone: maskPhone(e.target.value)})}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Observações Adicionais</label>
              <input 
                type="text" 
                maxLength={200}
                placeholder="Ex: Caso não atenda o pai, ligar imediatamente para a avó materna"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.emergencyNotes}
                onChange={e => setFormData({...formData, emergencyNotes: e.target.value})}
              />
            </div>

            <div className="md:col-span-2 flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <input 
                type="checkbox" 
                id="authPickup"
                checked={formData.authorizedPickup}
                onChange={e => setFormData({...formData, authorizedPickup: e.target.checked})}
                className="w-5 h-5 text-green-700 rounded-md focus:ring-green-500"
              />
              <label htmlFor="authPickup" className="text-sm font-semibold text-gray-800 cursor-pointer">
                Autorizo este contato a retirar o atleta ao final dos treinos e partidas (Integridade & Proteção Física)
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 pb-6">
          <button 
            type="button" 
            onClick={() => navigate('/alunos')}
            className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
          >
            Cancelar
          </button>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-[#112F20] text-white rounded-xl text-sm font-bold hover:bg-[#1E4D36] transition-colors shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Salvando Matrícula...</span>
              </>
            ) : (
              'Finalizar Matrícula'
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
