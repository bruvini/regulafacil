
import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Log {
  id: string;
  usuario: string;
  acao: string;
  detalhes: string;
  timestamp: Timestamp; // Firestore Timestamp
}

export const useAuditoriaLogs = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'auditoriaRegulaFacil'),
      orderBy('timestamp', 'desc'),
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      const logsData = snapshot.docs.map(
        doc => ({ id: doc.id, ...(doc.data() as Omit<Log, 'id'>) }),
      );
      setLogs(logsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const deleteAllLogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'auditoriaRegulaFacil'));
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
