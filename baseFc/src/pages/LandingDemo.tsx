import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext.tsx';
import { 
  Shield, 
  Sparkles, 
  ArrowRight, 
  Heart, 
  CheckCircle2, 
  Lock, 
  Activity, 
  Users, 
  CreditCard 
} from 'lucide-react';
import { motion } from 'motion/react';

export const LandingDemo = () => {
  const { loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const demoSectionRef = useRef<HTMLDivElement>(null);

  const handleEnterDemo = (role: UserRole) => {
    setSelectedRole(role);
    loginAsDemo(role);
    setTimeout(() => {
      navigate('/');
    }, 150);
  };

  const scrollToDemo = () => {
    demoSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1E14] via-[#112F20] to-[#0D2619] text-white flex flex-col justify-between selection:bg-emerald-400 selection:text-[#112F20]">
      {/* Top Navbar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-400 text-[#112F20] font-black flex items-center justify-center text-xl shadow-lg shadow-emerald-400/20">
            B
          </div>
          <div>
            <span className="text-xl font-black tracking-wider text-white">BASE FC</span>
            <span className="block text-3xs text-emerald-400/80 font-bold uppercase tracking-widest">
              Plataforma Esportiva
            </span>
          </div>
        </div>

        <Link
          to="/login"
          className="text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Login com Senha</span>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col items-center justify-center text-center">
        {/* Badge Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-6 backdrop-blur-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Demonstração Aberta ao Público</span>
        </motion.div>

        {/* Título e Headline Principal */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4 max-w-3xl"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-none">
            BASE FC
          </h1>
          <p className="text-lg sm:text-2xl font-semibold text-emerald-200/90 leading-relaxed max-w-2xl mx-auto">
            Gestão inteligente para escolinhas de futebol
          </p>
          <p className="text-xs sm:text-sm text-emerald-100/60 max-w-xl mx-auto font-normal">
            Controle integrado de atletas, turmas, chamadas de presença, mensalidades e portal exclusivo para responsáveis, com segurança fundamentada na Tríade CID.
          </p>
        </motion.div>

        {/* Botão ACESSAR DEMONSTRAÇÃO */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 sm:mt-10"
        >
          <button
            type="button"
            onClick={scrollToDemo}
            className="group inline-flex items-center gap-3 bg-emerald-400 text-[#0E261A] font-black px-8 py-4 rounded-2xl text-base sm:text-lg hover:bg-emerald-300 transition-all shadow-xl shadow-emerald-400/20 active:scale-95 cursor-pointer"
          >
            <span>ACESSAR DEMONSTRAÇÃO</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Seção AMBIENTE DE DEMONSTRAÇÃO */}
        <div
          ref={demoSectionRef}
          className="w-full mt-16 sm:mt-24 pt-12 border-t border-emerald-500/20 text-left"
        >
          <div className="text-center mb-8">
            <span className="text-3xs uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/60">
              Acesso Imediato
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-3">
              AMBIENTE DE DEMONSTRAÇÃO
            </h2>
            <p className="text-xs sm:text-sm text-emerald-300/80 mt-1 font-medium">
              Todos os dados apresentados são fictícios. Nenhuma criação de conta é necessária.
            </p>
          </div>

          {/* 2 Personas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {/* 1. Gestor */}
            <div className="bg-gradient-to-b from-[#163D2B] to-[#102C1F] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-400 transition-all shadow-xl group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mb-4 group-hover:bg-emerald-400 group-hover:text-[#112F20] transition-colors">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white">Perfil Gestor</h3>
                <p className="text-xs text-emerald-100/70 mt-2 leading-relaxed">
                  Visão executiva e administrativa completa da escolinha.
                </p>
                <ul className="mt-4 space-y-2 text-2xs text-emerald-200/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Dashboard de receitas e métricas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Matrículas e fichas médicas de atletas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Gestão de turmas e mensalidades</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Trilha de auditoria e segurança CID</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleEnterDemo('GESTOR')}
                disabled={selectedRole !== null}
                className="mt-6 w-full bg-emerald-400 hover:bg-emerald-300 text-[#112F20] font-extrabold py-3 rounded-xl text-xs transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Entrar como Gestor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Responsável */}
            <div className="bg-gradient-to-b from-[#163D2B] to-[#102C1F] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-400 transition-all shadow-xl group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mb-4 group-hover:bg-emerald-400 group-hover:text-[#112F20] transition-colors">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white">Perfil Responsável</h3>
                <p className="text-xs text-emerald-100/70 mt-2 leading-relaxed">
                  Portal dedicado para mães, pais e tutores dos atletas.
                </p>
                <ul className="mt-4 space-y-2 text-2xs text-emerald-200/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Acompanhamento dos treinos do filho</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Taxa e histórico de frequência</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Situação financeira das mensalidades</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Ficha médica e contatos atualizados</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleEnterDemo('RESPONSAVEL')}
                disabled={selectedRole !== null}
                className="mt-6 w-full bg-emerald-400 hover:bg-emerald-300 text-[#112F20] font-extrabold py-3 rounded-xl text-xs transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Entrar como Responsável</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 border-t border-emerald-500/20 text-center text-3xs sm:text-2xs text-emerald-200/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>Base FC • Sistema Acadêmico & Esportivo Integrado • FICR</p>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hover:text-emerald-300 transition-colors">
            Acesso com E-mail e Senha
          </Link>
          <span>•</span>
          <span className="text-emerald-400/80">Ambiente 100% Mockado</span>
        </div>
      </footer>
    </div>
  );
};
