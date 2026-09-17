import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase.ts';

interface AuthContextType {
  user: User | null;
  role: string | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setToken(session.access_token);
          
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
        }
      } catch (err) {
        console.error('Erro ao inicializar sessão:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setToken(session.access_token);
        
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
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, token, loading, login, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
