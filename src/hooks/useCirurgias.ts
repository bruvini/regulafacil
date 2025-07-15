
import { useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
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

  const reservarLeitoParaCirurgia = async (cirurgiaId: string, leito: any) => {
    setLoading(true);
    try {
      const cirurgiaRef = doc(db, 'cirurgiasRegulaFacil', cirurgiaId);
      const setorRef = doc(db, 'setoresRegulaFacil', leito.setorId);

      const setorDoc = await getDoc(setorRef);
      if (!setorDoc.exists()) throw new Error("Setor não encontrado");

      const setorData = setorDoc.data();
      const leitosAtualizados = setorData.leitos.map((l: any) => {
        if (l.id === leito.id) {
          return {
            ...l,
            statusLeito: 'Reservado' as const,
            dataAtualizacaoStatus: new Date().toISOString(),
            observacoes: `Reservado para cirurgia - ${cirurgiaId}`
          };
        }
        return l;
      });

      const batch = writeBatch(db);
      batch.update(cirurgiaRef, { 
        leitoReservado: leito.codigoLeito, 
        setorReservado: leito.setorNome,
        status: 'Agendada' 
      });
      batch.update(setorRef, { leitos: leitosAtualizados });
      await batch.commit();

      toast({ 
        title: "Sucesso!", 
        description: `Leito ${leito.codigoLeito} reservado para cirurgia.` 
      });
    } catch (error) {
      console.error('Erro ao reservar leito:', error);
      toast({
        title: "Erro",
        description: "Erro ao reservar leito. Tente novamente.",
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
    excluirSolicitacao,
    reservarLeitoParaCirurgia
  };
};
