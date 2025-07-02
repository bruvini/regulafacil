
import { useState } from 'react';
import { collection, addDoc, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SolicitacaoCirurgica, SolicitacaoCirurgicaFormData } from '@/types/hospital';
import { useToast } from '@/hooks/use-toast';

export const useCirurgias = () => {
  const [loading, setLoading] = useState(false);
  const [cirurgias, setCirurgias] = useState<SolicitacaoCirurgica[]>([]);
  const { toast } = useToast();

  const criarSolicitacao = async (dados: SolicitacaoCirurgicaFormData) => {
    setLoading(true);
    try {
      const novaSolicitacao: Omit<SolicitacaoCirurgica, 'id'> = {
        ...dados,
        dataCriacao: new Date(),
        status: 'Pendente'
      };

      const docRef = await addDoc(collection(db, 'cirurgiasRegulaFacil'), novaSolicitacao);
      
      const solicitacaoComId: SolicitacaoCirurgica = {
        ...novaSolicitacao,
        id: docRef.id
      };

      setCirurgias(prev => [solicitacaoComId, ...prev]);

      toast({
        title: "Sucesso!",
        description: "Solicitação cirúrgica criada com sucesso.",
        variant: "default"
      });

      return solicitacaoComId;
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

  const carregarCirurgias = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'cirurgiasRegulaFacil'), 
        orderBy('dataCriacao', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const cirurgiasCarregadas: SolicitacaoCirurgica[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataNascimento: doc.data().dataNascimento?.toDate() || new Date(),
        dataPrevistaInternacao: doc.data().dataPrevistaInternacao?.toDate() || new Date(),
        dataPrevisaCirurgia: doc.data().dataPrevisaCirurgia?.toDate() || new Date(),
        dataCriacao: doc.data().dataCriacao?.toDate() || new Date(),
      } as SolicitacaoCirurgica));

      setCirurgias(cirurgiasCarregadas);
    } catch (error) {
      console.error('Erro ao carregar cirurgias:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar solicitações cirúrgicas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    cirurgias,
    loading,
    criarSolicitacao,
    carregarCirurgias
  };
};
