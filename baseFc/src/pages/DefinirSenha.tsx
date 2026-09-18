import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Shield, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const DefinirSenha = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar se há indicação de convite ou recuperação no hash da URL
  const hash = location.hash || window.location.hash;
  const isInvite = hash.includes('type=invite');
  const isRecovery = hash.includes('type=recovery');

  useEffect(() => {
    // Se o auth terminou de carregar e não há usuário nem hash de recuperação/convite
    if (!authLoading && !user && !hash) {
      setError('Sessão expirada ou link inválido. Solicite um novo link ou entre em contato com o suporte.');
    }
  }, [authLoading, user, hash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Digite a mesma senha em ambos os campos.');
      return;
    }

    try {
      setLoading(true);
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Falha ao atualizar a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#112F20] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header com Logo */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">
            {isInvite ? 'Cadastre sua Senha' : isRecovery ? 'Redefinir Senha' : 'Nova Senha de Acesso'}
          </h1>
          <p className="text-xs text-gray-500 mt-1.5 max-w-xs">
            {isInvite
              ? 'Seja bem-vindo à Base FC! Defina uma senha segura para acessar o portal do seu atleta.'
              : 'Digite sua nova senha abaixo para continuar acessando sua conta com segurança.'}
          </p>
        </div>

        {/* Alerta de Erro */}
        {error && (
          <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-xs mb-5 border border-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Alerta de Sucesso */}
        {success && (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs mb-5 border border-emerald-200 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold">Senha cadastrada com sucesso!</p>
              <p className="text-emerald-700 text-2xs mt-0.5">Redirecionando para o seu portal...</p>
            </div>
          </div>
        )}

        {/* Formulário */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  maxLength={64}
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  maxLength={64}
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha digitada"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl text-2xs text-gray-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                <span>Mínimo de 6 caracteres</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${password && password === confirmPassword ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                <span>As senhas devem coincidir</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 6 || password !== confirmPassword}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Salvando Senha...</span>
                </>
              ) : (
                <>
                  <span>Salvar Senha e Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center border-t border-gray-100 pt-4">
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-gray-500 hover:text-emerald-700 font-semibold transition-colors cursor-pointer"
          >
            Voltar para o Login
          </button>
        </div>

      </div>
    </div>
  );
};
