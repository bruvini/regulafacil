
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Usuario } from './useUsuarios';

interface AuthContextType {
  currentUser: User | null;
  userData: Usuario | null;
  loading: boolean;
  isFirstLogin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Busca os dados do usuário no Firestore usando o UID
        const q = query(collection(db, 'usuariosRegulaFacil'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const data = { id: userDoc.id, ...userDoc.data() } as Usuario;
          setUserData(data);
          
          // Verifica se é o primeiro login
          if (!data.historicoAcessos || data.historicoAcessos.length === 0) {
            setIsFirstLogin(true);
          }
        }
      } else {
        setUserData(null);
        setIsFirstLogin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  const logout = async () => {
    await auth.signOut();
    setCurrentUser(null);
    setUserData(null);
    setIsFirstLogin(false);
  };

  const value = { currentUser, userData, loading, isFirstLogin, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
