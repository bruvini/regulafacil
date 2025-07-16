
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export const useAuditoria = () => {
  const { userData } = useAuth();

  /**
   * Registra uma nova entrada de log no Firestore.
   * @param acao A descrição detalhada da ação realizada.
   * @param origem A página ou módulo onde a ação ocorreu.
   */
  const registrarLog = async (acao: string, origem: string) => {
    if (!userData) {
      console.error("Tentativa de registrar log sem usuário autenticado.");
      return;
    }

    try {
      await addDoc(collection(db, 'logsAuditoria'), {
        acao,
        origem,
        data: new Date(),
        usuario: {
          nome: userData.nomeCompleto,
          uid: userData.uid,
        },
      });
    } catch (error) {
      console.error("Erro ao registrar log de auditoria:", error);
    }
  };

  return { registrarLog };
};
