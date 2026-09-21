import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase.ts';
import { getDemoSession, setDemoSession, clearDemoSession, resetDemoData } from '../services/mockApi.ts';

export type UserRole = 'GESTOR' | 'PROFESSOR' | 'RESPONSAVEL';

interface AuthContextType {
  user: User | null;
  role: string | null;
  token: string | null;
  loading: boolean;
  isDemo: boolean;
  demoName: string | null;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: (role: UserRole) => void;
  switchDemoRole: (role: UserRole) => void;
  resetDemo: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function createSyntheticUser(role: UserRole, email: string, name: string): User {
  return {
    id: `demo-user-${role.toLowerCase()}`,
    app_metadata: { provider: 'demo', providers: ['demo'] },
    user_metadata: { role, name, full_name: name },
    aud: 'authenticated',
    confirmation_sent_at: new Date().toISOString(),
    recovery_sent_at: new Date().toISOString(),
    email_change_sent_at: new Date().toISOString(),
    new_email: '',
    invited_at: new Date().toISOString(),
    action_link: '',
    email,
    phone: '',
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
    identities: [],
    is_anonymous: false,
    factors: []
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [demoName, setDemoName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Prioridade: Se houver sessão demo salva no navegador
      const savedDemo = getDemoSession();
      if (savedDemo && savedDemo.active) {
        const synthetic = createSyntheticUser(savedDemo.role, savedDemo.email, savedDemo.name);
        setUser(synthetic);
        setRole(savedDemo.role);
        setToken('demo-mock-token');
        setIsDemo(true);
        setDemoName(savedDemo.name);
        setLoading(false);
        return;
      }

      // 2. Se não houver demo, consulta o Supabase real (com proteção contra erro de conexão)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setToken(session.access_token);
          setIsDemo(false);
          setDemoName(null);
          
          try {
            const { data } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single();
            setRole(data?.role || session.user.user_metadata?.role || 'GESTOR');
          } catch {
            setRole(session.user.user_metadata?.role || 'GESTOR');
          }
        } else {
          setUser(null);
          setToken(null);
          setRole(null);
          setIsDemo(false);
          setDemoName(null);
        }
      } catch (err) {
        console.warn('Supabase não disponível no momento:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Escutar mudanças de autenticação do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Se estamos em modo demo, ignoramos eventos do Supabase
      if (getDemoSession()?.active) return;

      if (session?.user) {
        setUser(session.user);
        setToken(session.access_token);
        setIsDemo(false);
        setDemoName(null);
        
        try {
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          setRole(data?.role || session.user.user_metadata?.role || 'GESTOR');
        } catch {
          setRole(session.user.user_metadata?.role || 'GESTOR');
        }
      } else {
        setUser(null);
        setToken(null);
        setRole(null);
        setIsDemo(false);
        setDemoName(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginAsDemo = (selectedRole: UserRole) => {
    setDemoSession(selectedRole);
    const demoInfo = getDemoSession()!;
    const synthetic = createSyntheticUser(selectedRole, demoInfo.email, demoInfo.name);
    setUser(synthetic);
    setRole(selectedRole);
    setToken('demo-mock-token');
    setIsDemo(true);
    setDemoName(demoInfo.name);
  };

  const switchDemoRole = (newRole: UserRole) => {
    loginAsDemo(newRole);
  };

  const resetDemo = () => {
    resetDemoData();
  };

  const login = async (email: string, pass: string) => {
    clearDemoSession();
    setIsDemo(false);
    setDemoName(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
  };

  const loginWithGoogle = async () => {
    clearDemoSession();
    setIsDemo(false);
    setDemoName(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    clearDemoSession();
    setUser(null);
    setRole(null);
    setToken(null);
    setIsDemo(false);
    setDemoName(null);

    try {
      await supabase.auth.signOut();
    } catch (ignore) {}
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      token,
      loading,
      isDemo,
      demoName,
      login,
      loginWithGoogle,
      loginAsDemo,
      switchDemoRole,
      resetDemo,
      logout
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
