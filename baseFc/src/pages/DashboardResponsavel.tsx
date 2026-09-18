import { useState, useEffect } from 'react';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  ShieldCheck, Calendar, Clock, CreditCard, Heart, AlertCircle, 
  CheckCircle2, XCircle, ChevronRight, ChevronLeft, User, Award, MapPin, 
  HelpCircle, CalendarCheck, Sparkles, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { maskCPF, maskPhone } from '../utils/masks.ts';

const cardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
    filter: 'blur(2px)'
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.28,
      ease: 'easeOut' as const
    }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
    filter: 'blur(2px)',
    transition: {
      duration: 0.22,
      ease: 'easeIn' as const
    }
  })
};

export const DashboardResponsavel = () => {
  const { token, user } = useAuth();
  const [data, setData] = useState<{ guardian: any; students: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [currentClassIndex, setCurrentClassIndex] = useState(0);
  const [carouselDirection, setCarouselDirection] = useState(1);

  // Reset do índice do carrossel ao alternar de atleta
  useEffect(() => {
    setCurrentClassIndex(0);
    setCarouselDirection(1);
  }, [selectedStudentIndex]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetchApi('/dashboard', {}, token);
        setData(res);
      } catch (err) {
        console.error('Erro ao carregar portal do responsável:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-semibold text-sm">Carregando portal do atleta...</p>
      </div>
    );
  }

  const guardian = data?.guardian;
  const students = data?.students || [];
  const currentStudent = students[selectedStudentIndex] || null;

  if (!currentStudent) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#112F20] to-[#1E4D36] p-8 rounded-3xl text-white shadow-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Portal da Família • Base FC
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">Olá, {guardian?.name || 'Responsável'}!</h1>
          <p className="text-emerald-100/80 text-sm mt-1">
            Seja bem-vindo ao portal oficial de acompanhamento do seu atleta na Escolinha Base FC.
          </p>
        </div>

        <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Nenhum atleta vinculado no momento</h3>
          <p className="text-gray-500 text-sm">
            Sua conta está ativa no sistema, mas ainda não localizamos nenhum atleta associado ao seu cadastro.
          </p>
          <div className="p-4 bg-gray-50 rounded-2xl text-xs text-gray-600 text-left space-y-1">
            <p className="font-bold text-gray-700">O que fazer?</p>
            <p>Entre em contato com a secretaria da escolinha informando seu e-mail de acesso (<strong>{user?.email}</strong>) para vincular a matrícula do seu filho.</p>
          </div>
        </div>
      </div>
    );
  }

  const attendance = currentStudent.attendance || { totalTrainings: 0, presences: 0, absences: 0, justified: 0, attendanceRate: 100, history: [] };
  const payments = currentStudent.payments || [];
  const classes = currentStudent.classes || [];
  const activeClassIndex = classes.length > 0 
    ? ((currentClassIndex % classes.length) + classes.length) % classes.length 
    : 0;
  const currentClass = classes[activeClassIndex] || null;

  const handlePrevClass = () => {
    if (classes.length <= 1) return;
    setCarouselDirection(-1);
    setCurrentClassIndex(prev => (prev - 1 + classes.length) % classes.length);
  };

  const handleNextClass = () => {
    if (classes.length <= 1) return;
    setCarouselDirection(1);
    setCurrentClassIndex(prev => (prev + 1) % classes.length);
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Banner de Boas-Vindas */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#112F20] via-[#143B27] to-[#1E4D36] p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl text-white shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-3 h-3" /> Portal do Responsável
              </span>
              <span className="text-2xs font-medium text-emerald-200/70">
                Acesso Seguro • LGPD Compliant
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Olá, {guardian?.name ? guardian.name.split(' ')[0] : 'Responsável'}!
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-xl">
              Acompanhe a frequência nos treinos, horários das aulas, mensalidades e saúde esportiva do seu atleta.
            </p>
          </div>

          {/* Seletor de Atletas (caso o pai tenha mais de 1 filho) */}
          {students.length > 1 && (
            <div className="bg-black/25 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 w-full lg:w-auto min-w-0 max-w-full overflow-x-auto no-scrollbar">
              <p className="text-2xs font-bold text-emerald-300 uppercase px-1 mb-1.5">Selecione o Atleta</p>
              <div className="flex gap-2">
                {students.map((st, idx) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStudentIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedStudentIndex === idx
                        ? 'bg-emerald-400 text-[#112F20] shadow-md'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    #{st.shirtNumber || '--'} {st.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cartão de Identidade do Atleta */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-[#112F20] text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            #{currentStudent.shirtNumber || '--'}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-2xl font-black text-gray-900 truncate">{currentStudent.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-2xs sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {currentStudent.status || 'ATIVO'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Categoria <strong className="text-gray-800">{currentStudent.category}</strong> • Posição: <strong className="text-gray-800">{currentStudent.position}</strong> • Pé: <strong className="text-gray-800">{currentStudent.dominantFoot || 'Não informado'}</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
          <div className="px-2.5 py-2 bg-gray-50 rounded-xl text-center">
            <span className="block text-3xs sm:text-2xs text-gray-400 font-bold uppercase">Camisa</span>
            <span className="text-xs sm:text-sm font-black text-emerald-700">#{currentStudent.shirtNumber || '--'}</span>
          </div>
          <div className="px-2.5 py-2 bg-gray-50 rounded-xl text-center">
            <span className="block text-3xs sm:text-2xs text-gray-400 font-bold uppercase">Turmas</span>
            <span className="text-xs sm:text-sm font-bold text-gray-800 truncate block">
              {classes.length > 1 
                ? `${classes.length} turmas` 
                : currentClass?.name || 'Aguardando'}
            </span>
          </div>
          <div className="px-2.5 py-2 bg-gray-50 rounded-xl text-center">
            <span className="block text-3xs sm:text-2xs text-gray-400 font-bold uppercase">Mensalidade</span>
            <span className={`text-3xs sm:text-xs font-bold px-1.5 py-0.5 rounded-md inline-block ${
              currentStudent.financialStatus === 'EM_DIA'
                ? 'bg-emerald-100 text-emerald-800'
                : currentStudent.financialStatus === 'PENDENTE'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {currentStudent.financialStatus === 'EM_DIA' ? 'Em dia' : currentStudent.financialStatus === 'PENDENTE' ? 'Pendente' : 'Em atraso'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de 3 Colunas: Frequência, Turma e Mensalidades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna 1: Frequência nos Treinos */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Frequência nos Treinos</h3>
                  <p className="text-2xs text-gray-400">Assiduidade do atleta</p>
                </div>
              </div>
              <span className="text-lg font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">
                {attendance.attendanceRate}%
              </span>
            </div>

            {/* Barra de Progresso de Frequência */}
            <div className="mt-4">
              <div className="flex justify-between text-2xs font-semibold text-gray-500 mb-1">
                <span>Taxa de Presença Geral</span>
                <span className="text-emerald-700">{attendance.presences} de {attendance.totalTrainings} treinos</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, attendance.attendanceRate))}%` }}
                ></div>
              </div>
            </div>

            {/* Mini Contadores */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="block text-2xs text-gray-400 font-bold uppercase">Total</span>
                <span className="text-base font-black text-gray-800">{attendance.totalTrainings}</span>
              </div>
              <div className="p-2.5 bg-emerald-50/60 rounded-xl">
                <span className="block text-2xs text-emerald-700 font-bold uppercase">Presenças</span>
                <span className="text-base font-black text-emerald-700">{attendance.presences}</span>
              </div>
              <div className="p-2.5 bg-rose-50/60 rounded-xl">
                <span className="block text-2xs text-rose-700 font-bold uppercase">Faltas</span>
                <span className="text-base font-black text-rose-700">{attendance.absences}</span>
              </div>
            </div>

            {/* Histórico Recente */}
            <div className="mt-5">
              <h4 className="text-xs font-bold text-gray-700 mb-2">Últimas Chamadas Registradas</h4>
              {attendance.history.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center bg-gray-50 rounded-xl">
                  Nenhuma chamada registrada até o momento.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {attendance.history.slice(0, 5).map((att: any) => (
                    <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100/80 rounded-xl text-xs transition-colors">
                      <span className="font-semibold text-gray-700">
                        {new Date(att.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-2xs ${
                        att.status === 'PRESENTE' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : att.status === 'AUSENTE'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {att.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-2xs text-gray-400 border-t border-gray-100 pt-3">
            Chamadas validadas pelos professores após cada treino.
          </p>
        </div>

        {/* Coluna 2: Turma & Horários */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Turma & Horários de Treino</h3>
                  <p className="text-2xs text-gray-400">Programação semanal</p>
                </div>
              </div>

              {classes.length > 1 && (
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/60 px-2 py-1 rounded-xl">
                  <button
                    type="button"
                    onClick={handlePrevClass}
                    className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors cursor-pointer"
                    title="Turma anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-2xs font-bold text-emerald-900 px-1 select-none">
                    {activeClassIndex + 1} de {classes.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextClass}
                    className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors cursor-pointer"
                    title="Próxima turma"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {classes.length > 0 && currentClass ? (
              <div className="space-y-4 mt-4">
                {/* Carrossel Animado da Turma - muda exclusivamente o card da turma */}
                <div className="relative overflow-hidden min-h-[195px] rounded-2xl">
                  <AnimatePresence mode="wait" custom={carouselDirection}>
                    <motion.div
                      key={currentClass.id || activeClassIndex}
                      custom={carouselDirection}
                      variants={cardVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-900">{currentClass.name}</span>
                          {classes.length > 1 && (
                            <span className="text-2xs font-semibold px-1.5 py-0.5 rounded-md bg-emerald-200/60 text-emerald-800">
                              Turma {activeClassIndex + 1}/{classes.length}
                            </span>
                          )}
                        </div>
                        <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {currentClass.category}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{currentClass.daysOfWeek?.join(' • ') || 'Dias a definir'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{currentClass.startTime?.slice(0, 5) || '--:--'} às {currentClass.endTime?.slice(0, 5) || '--:--'}</span>
                        </div>
                        {currentClass.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{currentClass.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1 border-t border-emerald-100/60">
                          <User className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-gray-700">Professor: {currentClass.teacherName}</span>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Indicadores / Dots de Navegação do Carrossel */}
                {classes.length > 1 && (
                  <div className="flex items-center justify-between px-1 pt-0.5">
                    <button
                      type="button"
                      onClick={handlePrevClass}
                      className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                    </button>

                    <div className="flex items-center gap-1.5">
                      {classes.map((cl: any, idx: number) => (
                        <button
                          key={cl.id || idx}
                          type="button"
                          onClick={() => {
                            setCarouselDirection(idx > activeClassIndex ? 1 : -1);
                            setCurrentClassIndex(idx);
                          }}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            idx === activeClassIndex 
                              ? 'w-5 bg-emerald-600' 
                              : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                          }`}
                          aria-label={`Ver turma ${idx + 1}: ${cl.name}`}
                          title={cl.name}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleNextClass}
                      className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Próxima <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Dicas para o Responsável (inalteradas, ficam abaixo do card da turma) */}
                <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 text-xs text-gray-600">
                  <p className="font-bold text-gray-800">Recomendações para os treinos:</p>
                  <ul className="list-disc list-inside text-2xs space-y-1 text-gray-500">
                    <li>Chegar com 10 minutos de antecedência.</li>
                    <li>Utilizar chuteira adequada e caneleira obrigatória.</li>
                    <li>Garrafa de hidratação individual.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 space-y-2">
                <p className="text-sm font-semibold">Atleta ainda não vinculado a uma turma</p>
                <p className="text-xs">A coordenação da escolinha alocará a turma conforme a categoria.</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/60 text-2xs text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Treinamentos monitorados e com controle de entrada/saída.</span>
          </div>
        </div>

        {/* Coluna 3: Mensalidades & Situação Financeira */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Mensalidades do Atleta</h3>
                  <p className="text-2xs text-gray-400">Controle de pagamentos</p>
                </div>
              </div>

              <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                currentStudent.financialStatus === 'EM_DIA'
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentStudent.financialStatus === 'PENDENTE'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {currentStudent.financialStatus === 'EM_DIA' ? 'Em dia' : currentStudent.financialStatus === 'PENDENTE' ? 'Pendente' : 'Em atraso'}
              </span>
            </div>

            {/* Lista de Mensalidades */}
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
              {payments.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center bg-gray-50 rounded-xl">
                  Nenhuma mensalidade emitida até o momento.
                </p>
              ) : (
                payments.slice(0, 6).map((p: any) => (
                  <div key={p.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs hover:bg-gray-100/80 transition-colors">
                    <div>
                      <div className="font-bold text-gray-800">
                        {p.reference_month || 'Mensalidade'}
                      </div>
                      <div className="text-2xs text-gray-400">
                        Vencimento: {new Date(p.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-gray-900 text-sm">
                        R$ {Number(p.amount || 0).toFixed(2).replace('.', ',')}
                      </div>
                      <span className={`inline-block text-2xs font-bold px-2 py-0.5 rounded-md ${
                        p.status === 'PAGO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'PENDENTE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl text-2xs text-gray-500 border border-gray-100">
            Dúvidas sobre recibos ou pagamentos? Contate o setor financeiro da Base FC.
          </div>
        </div>

      </div>

      {/* Ficha Médica & Restrições */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Heart className="w-5 h-5 text-rose-600" />
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Ficha de Saúde & Cuidados Especiais</h3>
            <p className="text-2xs text-gray-400">Informações registradas para segurança médica durante os treinos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="block text-2xs font-bold text-gray-500 uppercase mb-1">Alergias</span>
            <p className="font-medium text-gray-800">
              {currentStudent.allergies || 'Nenhuma alergia informada.'}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="block text-2xs font-bold text-gray-500 uppercase mb-1">Restrições Médicas</span>
            <p className="font-medium text-gray-800">
              {currentStudent.medical_restrictions || currentStudent.medicalRestrictions || 'Sem restrições físicas relatadas.'}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="block text-2xs font-bold text-gray-500 uppercase mb-1">Medicamentos Contínuos</span>
            <p className="font-medium text-gray-800">
              {currentStudent.medications || 'Nenhum medicamento informado.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
