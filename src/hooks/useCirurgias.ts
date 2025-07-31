
import { useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SolicitacaoCirurgica, SolicitacaoCirurgicaFormData } from '@/types/hospital';
import { useToast } from '@/hooks/use-toast';
import { useAuditoria } from './useAuditoria';

export const useCirurgias = () => {
  const [loading, setLoading] = useState(false);
  const [cirurgias, setCirurgias] = useState<SolicitacaoCirurgica[]>([]);
  const { toast } = useToast();
  const { registrarLog } = useAuditoria();

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

      registrarLog(`Criou solicitação cirúrgica para ${dados.nomeCompleto} (Especialidade: ${dados.especialidade}).`, 'Marcação Cirúrgica');
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
      console.log('Iniciando reserva de leito para cirurgia:', { cirurgiaId, leito });

      // Validação de dados de entrada
      if (!cirurgiaId || !leito || !leito.id) {
        throw new Error('Dados incompletos: cirurgiaId ou informações do leito estão faltando');
      }

      const cirurgiaRef = doc(db, 'cirurgiasRegulaFacil', cirurgiaId);
      const leitoRef = doc(db, 'leitosRegulaFacil', leito.id);

      // Buscar dados da cirurgia para incluir no histórico
      const cirurgiaDoc = await getDoc(cirurgiaRef);
      if (!cirurgiaDoc.exists()) {
        throw new Error('Cirurgia não encontrada no banco de dados');
      }

      const cirurgiaData = cirurgiaDoc.data() as SolicitacaoCirurgica;
      console.log('Dados da cirurgia encontrados:', cirurgiaData);

      // Buscar dados atuais do leito
      const leitoDoc = await getDoc(leitoRef);
      if (!leitoDoc.exists()) {
        throw new Error('Leito não encontrado no banco de dados');
      }

      const leitoData = leitoDoc.data();
      const historicoAtual = leitoData.historicoMovimentacao || [];
      
      console.log('Histórico atual do leito:', historicoAtual);

      // Criar novo registro no histórico do leito
      const novoHistorico = {
        statusLeito: 'Reservado' as const,
        dataAtualizacaoStatus: new Date().toISOString(),
        infoCirurgia: {
          cirurgiaId: cirurgiaId,
          nomePaciente: cirurgiaData.nomeCompleto,
          especialidade: cirurgiaData.especialidade,
          dataPrevisaCirurgia: cirurgiaData.dataPrevisaCirurgia,
          dataPrevistaInternacao: cirurgiaData.dataPrevistaInternacao
        }
      };

      console.log('Novo registro de histórico:', novoHistorico);

      // Usar writeBatch para garantir atomicidade
      const batch = writeBatch(db);

      // Atualizar cirurgia com informações do leito reservado
      batch.update(cirurgiaRef, { 
        leitoReservado: leito.codigoLeito, 
        setorReservado: leito.setorNome,
        status: 'Agendada',
        leitoReservadoId: leito.id
      });

      // Atualizar leito com novo histórico
      batch.update(leitoRef, { 
        historicoMovimentacao: [...historicoAtual, novoHistorico]
      });

      console.log('Executando batch commit...');
      await batch.commit();

      console.log('Reserva concluída com sucesso');

      // Log de auditoria
      const logMessage = `Leito ${leito.codigoLeito} reservado para cirurgia de ${cirurgiaData.nomeCompleto} (${cirurgiaData.especialidade}).`;
      await registrarLog(logMessage, 'Cirurgias Eletivas');

      toast({ 
        title: "Sucesso!", 
        description: `Leito ${leito.codigoLeito} reservado para cirurgia.`,
        variant: "default"
      });

    } catch (error) {
      console.error('Erro detalhado ao reservar leito:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      
      let errorMessage = "Erro ao reservar leito. Tente novamente.";
      
      if (error instanceof Error) {
        errorMessage = `Erro ao reservar leito: ${error.message}`;
      }

      toast({
        title: "Erro",
        description: errorMessage,
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
