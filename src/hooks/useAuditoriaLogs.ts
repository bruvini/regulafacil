
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Log {
  id: string;
  acao: string;
  origem: string;
  data: any; // Firestore Timestamp
  usuario: { nome: string; uid: string; };
}

export const useAuditoriaLogs = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'logsAuditoria'), orderBy('data', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log));
      setLogs(logsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const deleteAllLogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'logsAuditoria'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } catch (error) {
      console.error("Erro ao deletar logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return { logs, loading, deleteAllLogs };
};
