/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { Layout } from './components/Layout.tsx';
import { Login } from './pages/Login.tsx';
import { DashboardGestor } from './pages/DashboardGestor.tsx';
import { ListAlunos } from './pages/ListAlunos.tsx';
import { NovoAluno } from './pages/NovoAluno.tsx';
import { Turmas } from './pages/Turmas.tsx';
import { Mensalidades } from './pages/Mensalidades.tsx';
import { Professores } from './pages/Professores.tsx';
import { Auditoria } from './pages/Auditoria.tsx';

const PrivateRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#112F20] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium tracking-wide">Validando credenciais seguras...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<DashboardGestor />} />
            <Route path="alunos" element={<ListAlunos />} />
            <Route 
              path="alunos/novo" 
              element={
                <PrivateRoute allowedRoles={['GESTOR']}>
                  <NovoAluno />
                </PrivateRoute>
              } 
            />
            <Route path="turmas" element={<Turmas />} />
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
