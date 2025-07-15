import { useState, useEffect, useCallback } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Setor, Leito, DadosPaciente } from '@/types/hospital';
import { useToast } from '@/hooks/use-toast';

export const useSetores = () => {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'setoresRegulaFacil'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const setoresCarregados: Setor[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        leitos: (doc.data().leitos || []).map((leito: any) => ({
          ...leito,
          dataAtualizacaoStatus: leito.dataAtualizacaoStatus ? new Date(leito.dataAtualizacaoStatus) : null,
        }))
      } as Setor));
      setSetores(setoresCarregados);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const criarSetor = async (novoSetor: Omit<Setor, 'id'>) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'setoresRegulaFacil'), novoSetor);
      toast({ title: "Sucesso!", description: "Setor criado com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao criar setor. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const atualizarSetor = async (id: string, dados: Partial<Setor>) => {
    setLoading(true);
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', id);
      await updateDoc(setorRef, dados);
      toast({ title: "Sucesso!", description: "Setor atualizado com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao atualizar setor. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const excluirSetor = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'setoresRegulaFacil', id));
      toast({ title: "Sucesso!", description: "Setor excluído com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao excluir setor. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateLeitoInSetor = async (setorId: string, leitoId: string, leitoAtualizacoes: Partial<Leito>) => {
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      const setorDoc = await db.collection('setoresRegulaFacil').doc(setorId).get();

      if (!setorDoc.exists) {
        console.error("Setor não encontrado");
        return;
      }

      const setorData = setorDoc.data() as Setor;
      const leitosAtualizados = setorData.leitos.map(leito => {
        if (leito.id === leitoId) {
          return { ...leito, ...leitoAtualizacoes };
        }
        return leito;
      });

      await updateDoc(setorRef, { leitos: leitosAtualizados });
      toast({ title: "Leito atualizado", description: "Dados do leito foram atualizados." });
    } catch (error) {
      console.error("Erro ao atualizar leito:", error);
      toast({ title: "Erro", description: "Erro ao atualizar leito. Tente novamente.", variant: "destructive" });
    }
  };

  const cancelarPedidoUTI = async (setorId: string, leitoId: string) => {
    try {
      await updateLeitoInSetor(setorId, leitoId, { dadosPaciente: { aguardaUTI: false } });
      toast({ title: "Pedido de UTI cancelado", description: "Paciente removido da fila de espera da UTI." });
    } catch (error) {
      console.error("Erro ao cancelar pedido de UTI:", error);
      toast({ title: "Erro", description: "Erro ao cancelar pedido de UTI. Tente novamente.", variant: "destructive" });
    }
  };

  const cancelarTransferencia = async (setorId: string, leitoId: string) => {
    try {
      await updateLeitoInSetor(setorId, leitoId, { dadosPaciente: { transferirPaciente: false } });
      toast({ title: "Transferência cancelada", description: "Pedido de transferência cancelado." });
    } catch (error) {
      console.error("Erro ao cancelar transferência:", error);
      toast({ title: "Erro", description: "Erro ao cancelar transferência. Tente novamente.", variant: "destructive" });
    }
  };

  const cancelarPedidoRemanejamento = async (setorId: string, leitoId: string) => {
    try {
      await updateLeitoInSetor(setorId, leitoId, { dadosPaciente: { remanejarPaciente: false } });
      toast({ title: "Remanejamento cancelado", description: "Pedido de remanejamento cancelado." });
    } catch (error) {
      console.error("Erro ao cancelar remanejamento:", error);
      toast({ title: "Erro", description: "Erro ao cancelar remanejamento. Tente novamente.", variant: "destructive" });
    }
  };

  const altaAposRecuperacao = async (setorId: string, leitoId: string) => {
    try {
      await updateLeitoInSetor(setorId, leitoId, { dadosPaciente: null, statusLeito: 'Vago' });
      toast({ title: "Alta após recuperação", description: "Paciente liberado para alta após recuperação." });
    } catch (error) {
      console.error("Erro ao dar alta após recuperação:", error);
      toast({ title: "Erro", description: "Erro ao dar alta após recuperação. Tente novamente.", variant: "destructive" });
    }
  };

  const cancelarRegulacao = async (paciente: any, motivo: string) => {
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', paciente.setorId);
      const setorDoc = await db.collection('setoresRegulaFacil').doc(paciente.setorId).get();

      if (!setorDoc.exists) {
        console.error("Setor não encontrado");
        return;
      }

      const setorData = setorDoc.data() as Setor;
      const leitosAtualizados = setorData.leitos.map(leito => {
        if (leito.id === paciente.leitoId) {
          return { 
            ...leito, 
            statusLeito: 'Ocupado' as const,
            regulacao: null,
            dataAtualizacaoStatus: new Date().toISOString(),
            observacoes: `Regulação cancelada: ${motivo}`
          };
        }
        return leito;
      });

      await updateDoc(setorRef, { leitos: leitosAtualizados });
      toast({ title: "Regulação cancelada", description: "A regulação do paciente foi cancelada." });
    } catch (error) {
      console.error("Erro ao cancelar regulação:", error);
      toast({ title: "Erro", description: "Erro ao cancelar regulação. Tente novamente.", variant: "destructive" });
    }
  };

  const concluirRegulacao = async (paciente: any) => {
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', paciente.setorId);
      const setorDoc = await db.collection('setoresRegulaFacil').doc(paciente.setorId).get();

      if (!setorDoc.exists) {
        console.error("Setor não encontrado");
        return;
      }

      const setorData = setorDoc.data() as Setor;
      const leitosAtualizados = setorData.leitos.map(leito => {
        if (leito.id === paciente.leitoId) {
          return { 
            ...leito, 
            statusLeito: 'Vago' as const,
            dadosPaciente: null,
            regulacao: null,
            dataAtualizacaoStatus: new Date().toISOString(),
            observacoes: `Alta por regulação`
          };
        }
        return leito;
      });

      await updateDoc(setorRef, { leitos: leitosAtualizados });
      toast({ title: "Regulação concluída", description: "O leito foi liberado." });
    } catch (error) {
      console.error("Erro ao concluir regulação:", error);
      toast({ title: "Erro", description: "Erro ao concluir regulação. Tente novamente.", variant: "destructive" });
    }
  };

  const confirmarRegulacao = async (paciente: any, pacienteParaLeito: any, leitoDestino: any, observacoes: string) => {
    try {
      const setorOrigemRef = doc(db, 'setoresRegulaFacil', paciente.setorId);
      const setorDestinoRef = doc(db, 'setoresRegulaFacil', leitoDestino.setorId);

      const setorOrigemDoc = await db.collection('setoresRegulaFacil').doc(paciente.setorId).get();
      const setorDestinoDoc = await db.collection('setoresRegulaFacil').doc(leitoDestino.setorId).get();

      if (!setorOrigemDoc.exists || !setorDestinoDoc.exists) {
        console.error("Setor não encontrado");
        return;
      }

      const setorOrigemData = setorOrigemDoc.data() as Setor;
      const setorDestinoData = setorDestinoDoc.data() as Setor;

      // Atualiza o leito de origem
      const leitosOrigemAtualizados = setorOrigemData.leitos.map(leito => {
        if (leito.id === paciente.leitoId) {
          return {
            ...leito,
            statusLeito: 'Regulado' as const,
            regulacao: {
              paraSetor: leitoDestino.setorNome,
              paraLeito: leitoDestino.codigoLeito,
              dataRegulacao: new Date().toISOString(),
              observacoes: observacoes
            },
            dataAtualizacaoStatus: new Date().toISOString(),
            observacoes: `Regulado para ${leitoDestino.setorNome} - ${leitoDestino.codigoLeito}`
          };
        }
        return leito;
      });

      // Atualiza o leito de destino
      const leitosDestinoAtualizados = setorDestinoData.leitos.map(leito => {
        if (leito.id === leitoDestino.id) {
          return {
            ...leito,
            statusLeito: 'Ocupado' as const,
            dadosPaciente: {
              ...pacienteParaLeito,
              dataRegulacao: new Date().toISOString()
            },
            dataAtualizacaoStatus: new Date().toISOString(),
          };
        }
        return leito;
      });

      const batch = writeBatch(db);
      batch.update(setorOrigemRef, { leitos: leitosOrigemAtualizados });
      batch.update(setorDestinoRef, { leitos: leitosDestinoAtualizados });
      await batch.commit();

      toast({ title: "Leito regulado", description: `Paciente regulado para ${leitoDestino.setorNome} - ${leitoDestino.codigoLeito}.` });
    } catch (error) {
      console.error("Erro ao confirmar regulação:", error);
      toast({ title: "Erro", description: "Erro ao confirmar regulação. Tente novamente.", variant: "destructive" });
    }
  };

  const iniciarTransferenciaExterna = async (setorId: string, leitoId: string, destino: string, motivo: string) => {
    const leito = setores.flatMap(s => s.leitos).find(l => l.id === leitoId);
    if (!leito?.dadosPaciente) return;

    const { aguardaUTI, dataPedidoUTI, ...pacienteSemUTI } = leito.dadosPaciente;

    const pacienteParaTransferir = {
      ...pacienteSemUTI,
      transferirPaciente: true,
      destinoTransferencia: destino,
      motivoTransferencia: motivo,
      dataTransferencia: new Date().toISOString(),
      statusTransferencia: 'Organizar' as const
    };

    await updateLeitoInSetor(setorId, leitoId, { dadosPaciente: pacienteParaTransferir });
    toast({ title: "Transferência Externa Iniciada", description: "Paciente adicionado à fila de transferência externa." });
  };

  return {
    setores,
    loading,
    criarSetor,
    atualizarSetor,
    excluirSetor,
    updateLeitoInSetor,
    cancelarPedidoUTI,
    cancelarTransferencia,
    cancelarPedidoRemanejamento,
    altaAposRecuperacao,
    cancelarRegulacao,
    concluirRegulacao,
    confirmarRegulacao,
    iniciarTransferenciaExterna
  };
};
