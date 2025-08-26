
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Regulacao {
  id: string;
  status: 'Pendente' | 'Concluída' | 'Cancelada';
  criadaEm: string; // ISO string
  concluidaEm?: string; // ISO string
  setorOrigemNome: string;
  setorDestinoNome: string;
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

  // Adiciona uma nova regulação básica (mantém compatibilidade com quem chama este hook)
  const criarRegulacao = async (dados: {
    pacienteId: string;
    leitoDestinoId: string;
    observacoes?: string;
    motivoAlteracao?: string;
    justificativaHomonimo?: string;
  }) => {
    await addDoc(collection(db, 'regulacoesRegulaFacil'), {
      status: 'Pendente',
      criadaEm: new Date().toISOString(),
      historicoEventos: [],
      pacienteId: dados.pacienteId,
      leitoDestinoId: dados.leitoDestinoId,
      observacoes: dados.observacoes || '',
      motivoAlteracao: dados.motivoAlteracao || null,
      justificativaHomonimo: dados.justificativaHomonimo || null,
    });
  };

  return { regulacoes, loading, criarRegulacao };
};
