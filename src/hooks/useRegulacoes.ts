
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Regulacao } from '@/types/hospital';

export const useRegulacoes = () => {
  const [regulacoes, setRegulacoes] = useState<Regulacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'regulacoesRegulaFacil'), orderBy('criadaEm', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Regulacao[];
      setRegulacoes(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { regulacoes, loading };
};
