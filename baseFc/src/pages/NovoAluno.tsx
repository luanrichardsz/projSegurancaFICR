import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { UserPlus, ArrowLeft, ShieldCheck, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';

export const NovoAluno = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Aluno
    name: '',
    cpf: '',
    dob: '',
    category: 'Sub-11',
    position: 'Meia',
    dominantFoot: 'DIREITO',
    shirtNumber: 10,
    classId: '',
    // Responsável
    guardianName: '',
    guardianCpf: '',
    guardianPhone: '',
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
        setClasses(data);
      } catch (err) {
        console.error('Falha ao carregar turmas', err);
      }
    };
    loadClasses();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        cpf: formData.cpf || undefined,
        dob: formData.dob,
        category: formData.category,
        position: formData.position,
        dominantFoot: formData.dominantFoot,
        shirtNumber: Number(formData.shirtNumber),
        classId: formData.classId || undefined
      };

      if (formData.guardianName) {
        payload.guardian = {
          name: formData.guardianName,
          cpf: formData.guardianCpf || undefined,
          phone: formData.guardianPhone,
          relationship: formData.guardianRelationship
        };
      }

      if (formData.emergencyName) {
        payload.emergencyContact = {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relationship: formData.emergencyRelationship,
          authorizedPickup: formData.authorizedPickup,
          notes: formData.emergencyNotes || undefined
        };
      }

      await fetchApi('/students', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, token);

      setSuccess(true);
      setTimeout(() => {
        navigate('/alunos');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Falha ao cadastrar aluno.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/alunos')}
          className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Matricular Novo Aluno</h1>
          <p className="text-gray-500 text-sm mt-1">Preencha os dados do atleta, responsáveis e contatos de emergência</p>
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
          <span className="font-bold">Aluno matriculado com sucesso! Redirecionando...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Bloco 1: Dados do Atleta */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <UserPlus className="w-5 h-5 text-green-700" />
            <h2 className="font-bold text-gray-900 text-lg">Dados do Atleta</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome Completo *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Lucas Gabriel da Silva"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Data de Nascimento *</label>
              <input 
                type="date" 
                required 
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.dob}
                onChange={e => setFormData({...formData, dob: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">CPF (Opcional)</label>
              <input 
                type="text" 
                placeholder="000.000.000-00"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.cpf}
                onChange={e => setFormData({...formData, cpf: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Categoria *</label>
              <select 
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="Sub-7">Sub-7</option>
                <option value="Sub-9">Sub-9</option>
                <option value="Sub-11">Sub-11</option>
                <option value="Sub-13">Sub-13</option>
                <option value="Sub-15">Sub-15</option>
                <option value="Sub-17">Sub-17</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Posição Preferida *</label>
              <select 
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.position}
                onChange={e => setFormData({...formData, position: e.target.value})}
              >
                <option value="Goleiro">Goleiro</option>
                <option value="Zagueiro">Zagueiro</option>
                <option value="Lateral">Lateral</option>
                <option value="Volante">Volante</option>
                <option value="Meia">Meia</option>
                <option value="Ponta">Ponta</option>
                <option value="Atacante">Atacante</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Pé Dominante *</label>
              <select 
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
                type="number" 
                min={1} 
                max={99} 
                required 
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.shirtNumber}
                onChange={e => setFormData({...formData, shirtNumber: Number(e.target.value)})}
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

        {/* Bloco 2: Dados do Responsável */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-green-700" />
            <h2 className="font-bold text-gray-900 text-lg">Responsável Legal</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome do Responsável *</label>
              <input 
                type="text" 
                required
                placeholder="Ex: Marcos Silva"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.guardianName}
                onChange={e => setFormData({...formData, guardianName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Telefone / WhatsApp *</label>
              <input 
                type="text" 
                required
                placeholder="(81) 99999-9999"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.guardianPhone}
                onChange={e => setFormData({...formData, guardianPhone: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Parentesco</label>
              <select 
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

        {/* Bloco 3: Contatos de Emergência & Retirada */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <Heart className="w-5 h-5 text-green-700" />
            <h2 className="font-bold text-gray-900 text-lg">Contato de Emergência & Autorização de Retirada</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome para Emergência</label>
              <input 
                type="text" 
                placeholder="Ex: Ana Silva"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.emergencyName}
                onChange={e => setFormData({...formData, emergencyName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Telefone de Emergência</label>
              <input 
                type="text" 
                placeholder="(81) 98888-8888"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.emergencyPhone}
                onChange={e => setFormData({...formData, emergencyPhone: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Observações Médicas / Alergias</label>
              <input 
                type="text" 
                placeholder="Ex: Possui alergia a dipirona, usa bombinha de asma..."
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
                Esta pessoa está autorizada a retirar o atleta ao final dos treinos e jogos
              </label>
            </div>
          </div>
        </div>

        {/* Botão de Envio */}
        <div className="flex justify-end space-x-4">
          <button 
            type="button"
            onClick={() => navigate('/alunos')}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-[#112F20] hover:bg-[#1E4D36] text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-950/20 disabled:opacity-50"
          >
            {loading ? 'Matriculando Atleta...' : 'Concluir Matrícula'}
          </button>
        </div>

      </form>
    </div>
  );
};
