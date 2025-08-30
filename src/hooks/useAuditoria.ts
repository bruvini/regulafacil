import { useAuth } from './useAuth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useAuditoria = () => {
  const { currentUser } = useAuth();

  const registrarLog = async (acao: string, detalhes: string) => {
    if (!currentUser) return;

    try {
      await addDoc(collection(db, 'auditoriaRegulaFacil'), {
        usuario: currentUser.displayName || currentUser.email,
        acao,
        detalhes,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao registrar log de auditoria:", error);
    }
  };

  return { registrarLog };
};
