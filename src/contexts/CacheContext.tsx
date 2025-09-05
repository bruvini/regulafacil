import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
} from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Setor } from '@/types/hospital';
import { TipoIsolamento } from '@/types/isolamento';

interface CacheContextData {
  setores: Setor[];
  tiposDeIsolamento: TipoIsolamento[];
  loading: boolean;
  getCachedData: <T = any>(key: string) => T | undefined;
  setCachedData: (key: string, data: any) => void;
}

const CacheContext = createContext<CacheContextData>({} as CacheContextData);

export const CacheProvider = ({ children }: { children: ReactNode }) => {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [tiposDeIsolamento, setTiposDeIsolamento] =
    useState<TipoIsolamento[]>([]);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef<Record<string, any>>({});

  const getCachedData = <T = any,>(key: string): T | undefined => {
    if (cacheRef.current[key]) return cacheRef.current[key] as T;
    const stored = localStorage.getItem(`cache_${key}`);
    if (stored) {
      const parsed = JSON.parse(stored) as T;
      cacheRef.current[key] = parsed;
      return parsed;
    }
    return undefined;
  };

  const setCachedData = (key: string, data: any) => {
    cacheRef.current[key] = data;
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(data));
    } catch {
      // Ignore write errors (e.g., storage full)
    }
  };

  useEffect(() => {
    setLoading(true);

    const setoresCached = getCachedData<Setor[]>('setores');
    const isolamentosCached = getCachedData<TipoIsolamento[]>('isolamentos');

    if (setoresCached) setSetores(setoresCached);
    if (isolamentosCached) setTiposDeIsolamento(isolamentosCached);

    const unsubSetores = onSnapshot(collection(db, 'setoresRegulaFacil'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Setor[];
      setSetores(data);
      setCachedData('setores', data);
      setLoading(false);
    });

    const unsubIsolamentos = onSnapshot(collection(db, 'isolamentosRegulaFacil'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TipoIsolamento[];
      setTiposDeIsolamento(data);
      setCachedData('isolamentos', data);
    });

    return () => {
      unsubSetores();
      unsubIsolamentos();
    };
  }, []);

  return (
    <CacheContext.Provider
      value={{ setores, tiposDeIsolamento, loading, getCachedData, setCachedData }}
    >
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  return useContext(CacheContext);
};
