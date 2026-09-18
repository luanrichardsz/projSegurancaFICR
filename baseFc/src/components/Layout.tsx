import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  LogOut, LayoutDashboard, Users, UserPlus, BookOpen, 
  CreditCard, UserCheck, ShieldCheck, Shield 
} from 'lucide-react';

export const Layout = () => {
  const { logout, user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#112F20] text-white flex flex-col justify-between shrink-0 shadow-2xl">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-[#1E4D36]/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-[#112F20] font-black flex items-center justify-center text-lg shadow-md shadow-emerald-500/30">
                B
              </div>
              <div>
                <h1 className="text-xl font-black tracking-wider text-white">BASE FC</h1>
                <p className="text-2xs text-emerald-400 font-semibold tracking-wider uppercase">Segurança FICR</p>
              </div>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="px-3 py-6 space-y-1">
            {visibleItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-[#112F20] shadow-md shadow-emerald-500/20 font-bold'
                      : 'text-gray-300 hover:text-white hover:bg-[#1E4D36]/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-[#112F20]' : 'text-emerald-400'}`} />
                  {item.label}
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
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Sessão Segura Conectada"></div>
          </div>

          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center w-full px-3 py-2 text-xs font-semibold text-red-300 hover:text-red-200 bg-red-950/40 hover:bg-red-900/50 rounded-xl transition-colors border border-red-900/30"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" /> Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
