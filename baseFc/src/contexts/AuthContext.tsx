import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, User, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicializa Firebase no Frontend
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const auth = getAuth();

interface AuthContextType {
  user: User | null;
  role: string | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const t = await firebaseUser.getIdToken();
        setToken(t);
        // Em um sistema real, decodificaríamos o JWT para obter a role injetada
        // ou faríamos um fetch rápido em /api/auth/me
        // Para simplificar a simulação no frontend:
        const tokenResult = await getIdTokenResult(firebaseUser);
        setRole((tokenResult.claims.role as string) || 'GESTOR'); // Mock para testes iniciais
      } else {
        setUser(null);
        setToken(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, role, token, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
