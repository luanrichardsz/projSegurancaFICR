import { useAuth, UserRole } from '../contexts/AuthContext.tsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Shield, Heart, RefreshCw, LogOut, Check } from 'lucide-react';
import { useState } from 'react';

export const DemoBanner = () => {
  const { isDemo, role, switchDemoRole, resetDemo, logout, demoName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [resetting, setResetting] = useState(false);

  if (!isDemo) return null;

  const handleRoleChange = (newRole: UserRole) => {
    switchDemoRole(newRole);
    // Se alternar para perfil com menos privilégios em página restrita, redireciona para a home
    if (newRole === 'RESPONSAVEL') {
      navigate('/');
    }
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar os dados fictícios da demonstração ao estado original?')) {
      setResetting(true);
      resetDemo();
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  };

  const handleExit = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-[#0F3826] to-emerald-950 text-white border-b border-emerald-500/30 px-3 sm:px-6 py-2 shadow-md relative z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4 text-xs">
        {/* Linha 1 no Mobile / Esquerda no Desktop */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <span className="font-extrabold uppercase tracking-wider text-emerald-300 text-2xs sm:text-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Ambiente Demo</span>
            </span>
            <span className="text-3xs text-emerald-200/70 hidden sm:inline bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700/40">
              Fictício
            </span>
          </div>

          {/* Ações Mobile: Reset e Sair compactos */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              title="Restaurar dados fictícios"
              className="flex items-center gap-1 text-3xs font-semibold px-2 py-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/50 border border-emerald-700/40 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1 text-3xs font-semibold px-2 py-1 rounded-lg text-rose-200 hover:text-rose-100 hover:bg-rose-900/50 border border-rose-800/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Linha 2 no Mobile: Alternador de Personas (grid 2 colunas full-width no mobile) */}
        <div className="w-full md:w-auto grid grid-cols-2 md:flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-emerald-500/20">
          <button
            type="button"
            onClick={() => handleRoleChange('GESTOR')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 md:py-1 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
              role === 'GESTOR'
                ? 'bg-emerald-400 text-[#112F20] shadow-sm'
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Gestor</span>
            {role === 'GESTOR' && <Check className="w-3.5 h-3.5 ml-0.5 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('RESPONSAVEL')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 md:py-1 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
              role === 'RESPONSAVEL'
                ? 'bg-emerald-400 text-[#112F20] shadow-sm'
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <Heart className="w-3.5 h-3.5 shrink-0" />
            <span>Responsável</span>
            {role === 'RESPONSAVEL' && <Check className="w-3.5 h-3.5 ml-0.5 shrink-0" />}
          </button>
        </div>

        {/* Direita no Desktop: Ações de Reset e Sair */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            title="Restaura os atletas, turmas e mensalidades da demo"
            className="flex items-center gap-1 text-3xs font-semibold px-2.5 py-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/40 border border-emerald-700/30 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reiniciar Dados</span>
          </button>

          <button
            type="button"
            onClick={handleExit}
            className="flex items-center gap-1 text-3xs font-semibold px-2.5 py-1 rounded-lg text-rose-200 hover:text-rose-100 hover:bg-rose-900/40 border border-rose-800/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span>Sair da Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
