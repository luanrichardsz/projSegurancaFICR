import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { DemoBanner } from './DemoBanner.tsx';
import { 
  LogOut, LayoutDashboard, Users, UserPlus, BookOpen, 
  CreditCard, UserCheck, ShieldCheck, Menu, X, Shield 
} from 'lucide-react';

export const Layout = () => {
  const { logout, user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fecha o menu móvel automaticamente ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Bloqueia rolagem do body quando a gaveta mobile estiver aberta
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { 
      label: role === 'RESPONSAVEL' ? 'Portal do Aluno' : 'Dashboard', 
      path: '/', 
      icon: LayoutDashboard, 
      roles: ['GESTOR', 'PROFESSOR', 'RESPONSAVEL'] 
    },
    { label: 'Atletas', path: '/alunos', icon: Users, roles: ['GESTOR', 'PROFESSOR'] },
    { label: 'Matricular', path: '/alunos/novo', icon: UserPlus, roles: ['GESTOR'] },
    { label: 'Turmas & Treinos', path: '/turmas', icon: BookOpen, roles: ['GESTOR', 'PROFESSOR'] },
    { label: 'Mensalidades', path: '/mensalidades', icon: CreditCard, roles: ['GESTOR'] },
    { label: 'Professores', path: '/professores', icon: UserCheck, roles: ['GESTOR'] },
    { label: 'Auditoria & CID', path: '/auditoria', icon: ShieldCheck, roles: ['GESTOR'] },
  ];

  const visibleItems = navItems.filter(item => !role || item.roles.includes(role));

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Header */}
        <div className="p-5 sm:p-6 border-b border-[#1E4D36]/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-[#112F20] font-black flex items-center justify-center text-lg shadow-md shadow-emerald-500/30">
              B
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider text-white">BASE FC</h1>
              <p className="text-2xs text-emerald-400 font-semibold tracking-wider uppercase">Gestão de Time</p>
            </div>
          </div>

          {/* Botão fechar na versão mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1E4D36] transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="px-3 py-4 sm:py-6 space-y-1">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-[#112F20] shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-[#1E4D36]/80'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 shrink-0 ${isActive ? 'text-[#112F20]' : 'text-emerald-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer User Info */}
      <div className="p-4 border-t border-[#1E4D36]/60 bg-[#0E261A]">
        <div className="flex items-center justify-between mb-3">
          <div className="truncate mr-2">
            <p className="text-xs font-bold text-white truncate">{user?.email}</p>
            <span className="inline-block mt-0.5 text-2xs font-bold px-2 py-0.5 rounded-md bg-[#1E4D36] text-emerald-300 uppercase tracking-wider">
              {role || 'GESTOR'}
            </span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Sessão Segura Conectada"></div>
        </div>

        <button 
          onClick={handleLogout} 
          className="flex items-center justify-center w-full px-3 py-2 text-xs font-semibold text-red-300 hover:text-red-200 bg-red-950/40 hover:bg-red-900/50 rounded-xl transition-colors border border-red-900/30 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" /> Encerrar Sessão
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen md:h-screen bg-[#f4f7f6] flex flex-col w-full max-w-full overflow-x-hidden">
      <DemoBanner />
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-full min-h-0">
        {/* Top Mobile Header (com Safe Area para Dynamic Island / Notch) */}
        <header className="sticky top-0 z-30 bg-[#112F20] border-b border-[#1E4D36] text-white px-4 py-3 flex md:hidden items-center justify-between shadow-md pt-[max(env(safe-area-inset-top),0.75rem)] pr-[max(env(safe-area-inset-right),1rem)] pl-[max(env(safe-area-inset-left),1rem)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-[#112F20] font-black flex items-center justify-center text-base shadow-sm">
            B
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-white">BASE FC</h1>
            <span className="text-3xs text-emerald-400 font-bold uppercase">{role || 'GESTOR'}</span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-gray-200 hover:text-white hover:bg-[#1E4D36] transition-colors focus:outline-none cursor-pointer"
          aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-emerald-400" /> : <Menu className="w-6 h-6 text-emerald-400" />}
        </button>
      </header>

      {/* Backdrop para Gaveta Mobile */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Mobile (Drawer deslizante) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#112F20] text-white md:hidden shadow-2xl transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar Desktop (Fixa) */}
      <aside className="hidden md:flex w-64 bg-[#112F20] text-white flex-col justify-between shrink-0 shadow-2xl h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden min-w-0 w-full max-w-full">
        <Outlet />
      </main>
    </div>
  </div>
  );
};
