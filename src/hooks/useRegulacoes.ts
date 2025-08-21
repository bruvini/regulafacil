
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Regulacao {
  id: string;
  status: 'Pendente' | 'Concluída' | 'Cancelada';
  criadaEm: string; // ISO string
  concluidaEm?: string; // ISO string
  setorOrigemNome: string;
  setorDestinoNome: string;
  pacienteId: string; // Adicionado para resolver o erro
  historicoEventos: Array<{ evento: string; timestamp: string }>;
}

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
