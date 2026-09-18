import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../services/supabase.ts';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [loading, setLoading] = useState(false);
  const submittingRef = useState({ current: false })[0];
  
  // Esqueci minha senha state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || submittingRef.current) return;
    try {
      submittingRef.current = true;
      setLoading(true);
      setError('');
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!recoveryEmail.trim()) {
      setResetError('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    try {
      setResetLoading(true);
      const appUrl = window.location.origin;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(recoveryEmail.trim().toLowerCase(), {
        redirectTo: `${appUrl}/definir-senha`
      });

      if (resetErr) {
        throw resetErr;
      }

      setResetSent(true);
    } catch (err: any) {
      setResetError(err?.message || 'Falha ao solicitar recuperação de senha. Verifique o e-mail informado.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#112F20] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">BASE FC</h1>
          <p className="text-xs text-gray-500 mt-1">Acesso seguro ao portal da escolinha</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-xs mb-6 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail</label>
            <input
              type="email"
              required
              maxLength={100}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700 uppercase">Senha</label>
              <button
                type="button"
                onClick={() => {
                  setRecoveryEmail(email);
                  setResetError('');
                  setResetSent(false);
                  setShowForgotPassword(true);
                }}
                className="text-2xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
              >
                Esqueci minha senha
              </button>
            </div>
            <input
              type="password"
              required
              maxLength={64}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#112F20] text-white font-bold py-3 rounded-xl hover:bg-[#1E4D36] transition-all shadow-lg shadow-emerald-950/20 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Entrando...</span>
              </>
            ) : (
              'Acessar Sistema'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-2xs text-gray-400">
          Base FC • Sistema Acadêmico & Esportivo Integrado
        </div>
      </div>

      {/* Modal Esqueci Minha Senha */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Recuperação de Senha</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Digite o e-mail cadastrado na escolinha. Enviaremos um link seguro para você definir uma nova senha.
            </p>

            {resetError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs border border-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSent ? (
              <div className="bg-emerald-50 text-emerald-800 p-5 rounded-2xl text-xs border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>E-mail de recuperação enviado!</span>
                </div>
                <p className="text-emerald-700 text-xs leading-relaxed">
                  Verifique sua caixa de entrada (ou pasta de spam). Clique no link enviado para cadastrar sua nova senha de acesso.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full mt-2 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer text-xs"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail Cadastrado</label>
                  <input
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-1/2 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-1/2 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      'Enviar Link'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
