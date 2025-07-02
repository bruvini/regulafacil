
import { useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SolicitacaoCirurgica, SolicitacaoCirurgicaFormData } from '@/types/hospital';
import { useToast } from '@/hooks/use-toast';

export const useCirurgias = () => {
  const [loading, setLoading] = useState(false);
  const [cirurgias, setCirurgias] = useState<SolicitacaoCirurgica[]>([]);
  const { toast } = useToast();

  // Escutar mudanças em tempo real
  useEffect(() => {
    const q = query(
      collection(db, 'cirurgiasRegulaFacil'), 
      orderBy('dataCriacao', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const cirurgiasCarregadas: SolicitacaoCirurgica[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataPrevistaInternacao: doc.data().dataPrevistaInternacao?.toDate() || new Date(),
        dataPrevisaCirurgia: doc.data().dataPrevisaCirurgia?.toDate() || new Date(),
        dataCriacao: doc.data().dataCriacao?.toDate() || new Date(),
      } as SolicitacaoCirurgica));

      setCirurgias(cirurgiasCarregadas);
    });

    return () => unsubscribe();
  }, []);

  const criarSolicitacao = async (dados: SolicitacaoCirurgicaFormData) => {
    setLoading(true);
    try {
      const novaSolicitacao: Omit<SolicitacaoCirurgica, 'id'> = {
        ...dados,
        dataCriacao: new Date(),
        status: 'Pendente'
      };

      await addDoc(collection(db, 'cirurgiasRegulaFacil'), novaSolicitacao);

      toast({
        title: "Sucesso!",
        description: "Solicitação cirúrgica criada com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao criar solicitação cirúrgica:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar solicitação cirúrgica. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const atualizarSolicitacao = async (id: string, dados: Partial<SolicitacaoCirurgica>) => {
    setLoading(true);
    try {
      const docRef = doc(db, 'cirurgiasRegulaFacil', id);
      await updateDoc(docRef, dados);

      toast({
        title: "Sucesso!",
        description: "Solicitação cirúrgica atualizada com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao atualizar solicitação:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar solicitação. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const excluirSolicitacao = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'cirurgiasRegulaFacil', id));

      toast({
        title: "Sucesso!",
        description: "Solicitação cirúrgica excluída com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir solicitação. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    cirurgias,
    loading,
    criarSolicitacao,
    atualizarSolicitacao,
    excluirSolicitacao
  };
};
