import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Falha ao autenticar com Google.');
    }
  };

  return (
    <div className="min-h-screen bg-[#112F20] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-green-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BASE FC</h1>
          <p className="text-sm text-gray-500 mt-2">Acesso restrito ao sistema de gestão</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm mb-6 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              required
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gestor@basefc.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              required
              maxLength={64}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#112F20] text-white font-medium py-3 rounded-md hover:bg-[#1E4D36] transition-colors shadow-lg shadow-green-900/20"
          >
            Acessar Sistema
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          Base FC - Sistema Acadêmico Integrado
        </div>
      </div>
    </div>
  );
};
