import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { LogOut, LayoutDashboard, Users, UserPlus } from 'lucide-react';

export const Layout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex">
      {/* Sidebar - Verde Escuro / Verde Campo */}
      <aside className="w-64 bg-[#112F20] text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider text-green-400">BASE FC</h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Painel Administrativo</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={() => navigate('/')} className="flex items-center w-full px-4 py-3 text-sm rounded-lg hover:bg-[#1E4D36] transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </button>
          <button onClick={() => navigate('/alunos')} className="flex items-center w-full px-4 py-3 text-sm rounded-lg hover:bg-[#1E4D36] transition-colors">
            <Users className="w-5 h-5 mr-3" /> Alunos
          </button>
          <button onClick={() => navigate('/alunos/novo')} className="flex items-center w-full px-4 py-3 text-sm rounded-lg hover:bg-[#1E4D36] transition-colors">
            <UserPlus className="w-5 h-5 mr-3" /> Matricular
          </button>
        </nav>

        <div className="p-4 border-t border-[#1E4D36]">
          <div className="text-sm text-gray-300 mb-4">{user?.email}</div>
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-400 rounded-lg hover:bg-[#1E4D36] transition-colors">
            <LogOut className="w-5 h-5 mr-3" /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
