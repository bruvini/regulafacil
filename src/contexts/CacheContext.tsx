import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Setor } from '@/types/hospital';
import { TipoIsolamento } from '@/types/isolamento';

interface CacheContextData {
  setores: Setor[];
  tiposDeIsolamento: TipoIsolamento[];
  loading: boolean;
}

const CacheContext = createContext<CacheContextData>({} as CacheContextData);

export const CacheProvider = ({ children }: { children: ReactNode }) => {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [tiposDeIsolamento, setTiposDeIsolamento] = useState<TipoIsolamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const setoresCached = localStorage.getItem('cache_setores');
    const isolamentosCached = localStorage.getItem('cache_isolamentos');

    if (setoresCached) setSetores(JSON.parse(setoresCached));
    if (isolamentosCached) setTiposDeIsolamento(JSON.parse(isolamentosCached));

    const unsubSetores = onSnapshot(collection(db, 'setoresRegulaFacil'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Setor[];
      setSetores(data);
      localStorage.setItem('cache_setores', JSON.stringify(data));
      setLoading(false);
    });

    const unsubIsolamentos = onSnapshot(collection(db, 'isolamentosRegulaFacil'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TipoIsolamento[];
      setTiposDeIsolamento(data);
      localStorage.setItem('cache_isolamentos', JSON.stringify(data));
    });

    return () => {
      unsubSetores();
      unsubIsolamentos();
    };
  }, []);

  return (
    <CacheContext.Provider value={{ setores, tiposDeIsolamento, loading }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  return useContext(CacheContext);
};
