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

const PrivateRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />; // Fallback para home se nÃ£o tiver permissÃ£o
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
            <Route path="alunos/novo" element={<div>FormulÃ¡rio de MatrÃ­cula (Em breve)</div>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
