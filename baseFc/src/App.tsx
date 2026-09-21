/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { Layout } from './components/Layout.tsx';
import { Login } from './pages/Login.tsx';
import { DefinirSenha } from './pages/DefinirSenha.tsx';
import { LandingDemo } from './pages/LandingDemo.tsx';
import { DashboardGestor } from './pages/DashboardGestor.tsx';
import { DashboardResponsavel } from './pages/DashboardResponsavel.tsx';
import { ListAlunos } from './pages/ListAlunos.tsx';
import { NovoAluno } from './pages/NovoAluno.tsx';
import { Turmas } from './pages/Turmas.tsx';
import { Mensalidades } from './pages/Mensalidades.tsx';
import { Professores } from './pages/Professores.tsx';
import { Auditoria } from './pages/Auditoria.tsx';

const AuthHashHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('type=invite') || hash.includes('type=recovery'))) {
      if (location.pathname !== '/definir-senha') {
        navigate(`/definir-senha${hash}`, { replace: true });
      }
    }
  }, [location, navigate]);

  return null;
};

const PrivateRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#112F20] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium tracking-wide">Validando credenciais de acesso...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const DashboardRouter = () => {
  const { role } = useAuth();
  if (role === 'RESPONSAVEL') {
    return <DashboardResponsavel />;
  }
  return <DashboardGestor />;
};

const DemoTitleUpdater = () => {
  const { isDemo, role } = useAuth();

  useEffect(() => {
    if (isDemo) {
      const roleName = role === 'RESPONSAVEL' ? 'Responsável' : 'Gestor';
      document.title = `Base FC — Demo (${roleName})`;
    } else {
      document.title = 'Base FC — Gestão Inteligente para Escolinhas de Futebol';
    }
  }, [isDemo, role]);

  return null;
};

const HomeOrLanding = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#112F20] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium tracking-wide">Iniciando Base FC...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingDemo />;
  }

  return <Layout />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthHashHandler />
        <DemoTitleUpdater />
        <Routes>
          <Route path="/demo" element={<LandingDemo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/definir-senha" element={<DefinirSenha />} />
          
          <Route path="/" element={<HomeOrLanding />}>
            <Route index element={<DashboardRouter />} />
            <Route 
              path="alunos" 
              element={
                <PrivateRoute allowedRoles={['GESTOR', 'PROFESSOR']}>
                  <ListAlunos />
                </PrivateRoute>
              } 
            />
            <Route 
              path="alunos/novo" 
              element={
                <PrivateRoute allowedRoles={['GESTOR']}>
                  <NovoAluno />
                </PrivateRoute>
              } 
            />
            <Route 
              path="turmas" 
              element={
                <PrivateRoute allowedRoles={['GESTOR', 'PROFESSOR']}>
                  <Turmas />
                </PrivateRoute>
              } 
            />
            <Route 
              path="mensalidades" 
              element={
                <PrivateRoute allowedRoles={['GESTOR']}>
                  <Mensalidades />
                </PrivateRoute>
              } 
            />
            <Route 
              path="professores" 
              element={
                <PrivateRoute allowedRoles={['GESTOR']}>
                  <Professores />
                </PrivateRoute>
              } 
            />
            <Route 
              path="auditoria" 
              element={
                <PrivateRoute allowedRoles={['GESTOR']}>
                  <Auditoria />
                </PrivateRoute>
              } 
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
