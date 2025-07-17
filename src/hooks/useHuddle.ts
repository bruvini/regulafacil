
import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query, orderBy, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Pendencia, Comentario, NovaPendencia } from '@/types/huddle';

export const useHuddle = (huddleId: string) => {
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    if (!huddleId) return;
    
    const pendenciasRef = collection(db, 'huddleRegulaFacil', huddleId, 'pendencias');
    const q = query(pendenciasRef, orderBy('dataCriacao', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pendenciasData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        dataCriacao: doc.data().dataCriacao?.toDate() || new Date()
      })) as Pendencia[];
      
      setPendencias(pendenciasData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [huddleId]);

  const adicionarPendencia = async (huddleId: string, novaPendencia: NovaPendencia) => {
    try {
      const pendenciasRef = collection(db, 'huddleRegulaFacil', huddleId, 'pendencias');
      
      // Fix: Only include pacienteId if it has a value
      const pendenciaParaSalvar = {
        ...novaPendencia,
        ...(novaPendencia.pacienteId && { pacienteId: novaPendencia.pacienteId }),
        status: 'PENDENTE',
        dataCriacao: new Date()
      };

      await addDoc(pendenciasRef, pendenciaParaSalvar);

      toast({
        title: "Sucesso!",
        description: "Pendência adicionada com sucesso."
      });
    } catch (error) {
      console.error("Erro ao adicionar pendência:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a pendência.",
        variant: "destructive"
      });
    }
  };

  const atualizarStatusPendencia = async (huddleId: string, pendenciaId: string, novoStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'RESOLVIDO') => {
    try {
      const pendenciaRef = doc(db, 'huddleRegulaFacil', huddleId, 'pendencias', pendenciaId);
      await updateDoc(pendenciaRef, {
        status: novoStatus
      });

      toast({
        title: "Sucesso!",
        description: "Status da pendência atualizado."
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive"
      });
    }
  };

  const adicionarComentario = async (huddleId: string, pendenciaId: string, comentario: string) => {
    if (!userData) return;

    try {
      const comentariosRef = collection(db, 'huddleRegulaFacil', huddleId, 'pendencias', pendenciaId, 'comentarios');
      
      await addDoc(comentariosRef, {
        texto: comentario,
        autor: {
          uid: userData.uid,
          nome: userData.nomeCompleto
        },
        data: new Date()
      });

      toast({
        title: "Sucesso!",
        description: "Comentário adicionado."
      });
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o comentário.",
        variant: "destructive"
      });
    }
  };

  return { 
    pendencias, 
    loading, 
    adicionarPendencia, 
    atualizarStatusPendencia, 
    adicionarComentario 
  };
};
