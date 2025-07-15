import { useState, useEffect, useCallback } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Setor, Leito, DadosPaciente, HistoricoTransferenciaItem } from '@/types/hospital';
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
      const setorComLeitos = {
        ...novoSetor,
        leitos: novoSetor.leitos || []
      };
      await addDoc(collection(db, 'setoresRegulaFacil'), setorComLeitos);
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
      const setorDoc = await getDoc(setorRef);

      if (!setorDoc.exists()) {
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

  const adicionarRegistroTransferencia = async (setorId: string, leitoId: string, etapa: string) => {
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      const setorDoc = await getDoc(setorRef);

      if (!setorDoc.exists()) {
        console.error("Setor não encontrado");
        return;
      }

      const setorData = setorDoc.data() as Setor;
      const leitosAtualizados = setorData.leitos.map(leito => {
        if (leito.id === leitoId && leito.dadosPaciente) {
          const novoRegistro: HistoricoTransferenciaItem = {
            etapa,
            data: new Date().toISOString(),
            usuario: 'Sistema' // Pode ser expandido para incluir usuário logado
          };
          
          const historicoAtual = leito.dadosPaciente.historicoTransferencia || [];
          
          return {
            ...leito,
            dadosPaciente: {
              ...leito.dadosPaciente,
              historicoTransferencia: [...historicoAtual, novoRegistro]
            }
          };
        }
        return leito;
      });

      await updateDoc(setorRef, { leitos: leitosAtualizados });
      toast({ title: "Etapa registrada", description: "Nova etapa adicionada ao histórico." });
    } catch (error) {
      console.error("Erro ao adicionar registro:", error);
      toast({ title: "Erro", description: "Erro ao registrar etapa. Tente novamente.", variant: "destructive" });
    }
  };

  const concluirTransferenciaExterna = async (setorId: string, leitoId: string) => {
    await updateLeitoInSetor(setorId, leitoId, {
      statusLeito: 'Higienizacao',
      dataAtualizacaoStatus: new Date().toISOString(),
      dadosPaciente: null,
      regulacao: null
    });
    toast({ title: "Transferência Concluída!", description: "O leito foi liberado para higienização." });
  };

  const atualizarStatusLeito = async (setorId: string, leitoId: string, novoStatus: string, motivo?: string) => {
    const atualizacoes: Partial<Leito> = {
      statusLeito: novoStatus as any,
      dataAtualizacaoStatus: new Date().toISOString()
    };
    
    if (motivo) {
      atualizacoes.motivoBloqueio = motivo;
    }

    await updateLeitoInSetor(setorId, leitoId, atualizacoes);
  };

  const desbloquearLeito = async (setorId: string, leitoId: string) => {
    await updateLeitoInSetor(setorId, leitoId, { 
      statusLeito: 'Vago', 
      motivoBloqueio: undefined,
      dataAtualizacaoStatus: new Date().toISOString()
    });
  };

  const finalizarHigienizacao = async (setorId: string, leitoId: string) => {
    await updateLeitoInSetor(setorId, leitoId, { 
      statusLeito: 'Vago',
      dataAtualizacaoStatus: new Date().toISOString()
    });
  };

  const liberarLeito = async (setorId: string, leitoId: string) => {
    await updateLeitoInSetor(setorId, leitoId, { 
      statusLeito: 'Higienizacao',
      dadosPaciente: null,
      dataAtualizacaoStatus: new Date().toISOString()
    });
  };

  const solicitarUTI = async (setorId: string, leitoId: string) => {
    const setorRef = doc(db, 'setoresRegulaFacil', setorId);
    const setorDoc = await getDoc(setorRef);

    if (!setorDoc.exists()) return;

    const setorData = setorDoc.data() as Setor;
    const leitosAtualizados = setorData.leitos.map(leito => {
      if (leito.id === leitoId && leito.dadosPaciente) {
        return { 
          ...leito, 
          dadosPaciente: { 
            ...leito.dadosPaciente, 
            aguardaUTI: true,
            dataPedidoUTI: new Date().toISOString()
          } 
        };
      }
      return leito;
    });

    await updateDoc(setorRef, { leitos: leitosAtualizados });
    toast({ title: "UTI solicitada", description: "Paciente adicionado à fila de UTI." });
  };

  const solicitarRemanejamento = async (setorId: string, leitoId: string, motivo: string) => {
    const setorRef = doc(db, 'setoresRegulaFacil', setorId);
    const setorDoc = await getDoc(setorRef);

    if (!setorDoc.exists()) return;

    const setorData = setorDoc.data() as Setor;
    const leitosAtualizados = setorData.leitos.map(leito => {
      if (leito.id === leitoId && leito.dadosPaciente) {
        return { 
          ...leito, 
          dadosPaciente: { 
            ...leito.dadosPaciente, 
            remanejarPaciente: true,
            motivoRemanejamento: motivo,
            dataPedidoRemanejamento: new Date().toISOString()
          } 
        };
      }
      return leito;
    });

    await updateDoc(setorRef, { leitos: leitosAtualizados });
    toast({ title: "Remanejamento solicitado", description: "Paciente marcado para remanejamento." });
  };

  const transferirPaciente = async (setorId: string, leitoId: string, destino: string, motivo: string) => {
    const setorRef = doc(db, 'setoresRegulaFacil', setorId);
    const setorDoc = await getDoc(setorRef);

    if (!setorDoc.exists()) return;

    const setorData = setorDoc.data() as Setor;
    const leitosAtualizados = setorData.leitos.map(leito => {
      if (leito.id === leitoId && leito.dadosPaciente) {
        return { 
          ...leito, 
          dadosPaciente: { 
            ...leito.dadosPaciente, 
            transferirPaciente: true,
            destinoTransferencia: destino,
            motivoTransferencia: motivo
          } 
        };
      }
      return leito;
    });

    await updateDoc(setorRef, { leitos: leitosAtualizados });
    toast({ title: "Transferência solicitada", description: "Paciente marcado para transferência." });
  };

  const cancelarReserva = async (setorId: string, leitoId: string) => {
    await updateLeitoInSetor(setorId, leitoId, { 
      statusLeito: 'Vago',
      dadosPaciente: null,
      dataAtualizacaoStatus: new Date().toISOString()
    });
  };

  const concluirTransferencia = async (leito: any, setorId: string) => {
    await updateLeitoInSetor(setorId, leito.id, { 
      statusLeito: 'Ocupado',
      dataAtualizacaoStatus: new Date().toISOString()
    });
  };

  const toggleProvavelAlta = async (setorId: string, leitoId: string) => {
    const setorRef = doc(db, 'setoresRegulaFacil', setorId);
    const setorDoc = await getDoc(setorRef);

    if (!setorDoc.exists()) return;

    const setorData = setorDoc.data() as Setor;
    const leitosAtualizados = setorData.leitos.map(leito => {
      if (leito.id === leitoId && leito.dadosPaciente) {
        return { 
          ...leito, 
          dadosPaciente: { 
            ...leito.dadosPaciente, 
            provavelAlta: !leito.dadosPaciente.provavelAlta
          } 
        };
      }
      return leito;
    });

    await updateDoc(setorRef, { leitos: leitosAtualizados });
    toast({ title: "Provável alta atualizada", description: "Status de provável alta foi alterado." });
  };

  const cancelarPedidoUTI = async (setorId: string, leitoId: string) => {
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      const setorDoc = await getDoc(setorRef);

      if (!setorDoc.exists()) {
        console.error("Setor não encontrado");
        return;
      }

      const setorData = setorDoc.data() as Setor;
      const leitosAtualizados = setorData.leitos.map(leito => {
        if (leito.id === leitoId && leito.dadosPaciente) {
          return { 
            ...leito, 
            dadosPaciente: { 
              ...leito.dadosPaciente, 
              aguardaUTI: false 
            } 
          };
        }
        return leito;
      });

      await updateDoc(setorRef, { leitos: leitosAtualizados });
      toast({ title: "Pedido de UTI cancelado", description: "Paciente removido da fila de espera da UTI." });
    } catch (error) {
      console.error("Erro ao cancelar pedido de UTI:", error);
      toast({ title: "Erro", description: "Erro ao cancelar pedido de UTI. Tente novamente.", variant: "destructive" });
    }
  };

  const cancelarTransferencia = async (setorId: string, leitoId: string) => {
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      const setorDoc = await getDoc(setorRef);

      if (!setorDoc.exists()) {
        console.error("Setor não encontrado");
        return;
      }

      const setorData = setorDoc.data() as Setor;
      const leitosAtualizados = setorData.leitos.map(leito => {
        if (leito.id === leitoId && leito.dadosPaciente) {
          const { transferirPaciente, destinoTransferencia, motivoTransferencia, dataTransferencia, statusTransferencia, historicoTransferencia, ...restoDados } = leito.dadosPaciente;
          
          return { 
            ...leito, 
            dadosPaciente: restoDados 
          };
        }
        return leito;
      });

      await updateDoc(setorRef, { leitos: leitosAtualizados });
      toast({ title: "Transferência cancelada", description: "Pedido de transferência cancelado." });
    } catch (error) {
      console.error("Erro ao cancelar transferência:", error);
      toast({ title: "Erro", description: "Erro ao cancelar transferência. Tente novamente.", variant: "destructive" });
    }
  };

  const cancelarPedidoRemanejamento = async (setorId: string, leitoId: string) => {
    const leito = setores.flatMap(s => s.leitos).find(l => l.id === leitoId);
    // VERIFICAÇÃO DE SEGURANÇA: Só continua se o paciente e o pedido de remanejamento existirem
    if (!leito?.dadosPaciente?.remanejarPaciente) return;

    try {
      const { remanejarPaciente, motivoRemanejamento, dataPedidoRemanejamento, ...restoDosDados } = leito.dadosPaciente;
      await updateLeitoInSetor(setorId, leitoId, { dadosPaciente: restoDosDados });
      toast({ title: "Solicitação Cancelada", description: "O pedido de remanejamento foi removido com sucesso." });
    } catch (error) {
      console.error('Erro ao cancelar remanejamento:', error);
      toast({ title: "Erro", description: "Não foi possível cancelar a solicitação.", variant: "destructive" });
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
      const setorDoc = await getDoc(setorRef);

      if (!setorDoc.exists()) {
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
      const setorDoc = await getDoc(setorRef);

      if (!setorDoc.exists()) {
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

      const setorOrigemDoc = await getDoc(setorOrigemRef);
      const setorDestinoDoc = await getDoc(setorDestinoRef);

      if (!setorOrigemDoc.exists() || !setorDestinoDoc.exists()) {
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
              data: new Date().toISOString(),
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

  // Mock functions for missing functionality
  const adicionarLeito = async (setorId: string, leito: Partial<Leito>) => {
    console.log("adicionarLeito not implemented");
  };

  const atualizarLeito = async (setorId: string, leitoId: string, dados: Partial<Leito>) => {
    console.log("atualizarLeito not implemented");
  };

  const excluirLeito = async (setorId: string, leitoId: string) => {
    console.log("excluirLeito not implemented");
  };

  const moverPaciente = async (origem: any, destino: any, paciente: any) => {
    console.log("moverPaciente not implemented");
  };

  const atualizarRegrasIsolamento = async (setorId: string, leitoId: string, isolamentoId: string, regras: string[]) => {
    console.log("atualizarRegrasIsolamento not implemented");
  };

  const finalizarIsolamentoPaciente = async (setorId: string, leitoId: string, isolamentoId: string) => {
    console.log("finalizarIsolamentoPaciente not implemented");
  };

  const adicionarIsolamentoPaciente = async (setorId: string, leitoId: string, novosIsolamentos: any[]) => {
    const leito = setores.flatMap(s => s.leitos).find(l => l.id === leitoId);
    if (!leito?.dadosPaciente) return;

    const isolamentosAtuais = leito.dadosPaciente.isolamentosVigentes || [];
    const dadosPacienteAtualizado = {
      ...leito.dadosPaciente,
      isolamentosVigentes: [...isolamentosAtuais, ...novosIsolamentos]
    };

    await updateLeitoInSetor(setorId, leitoId, { dadosPaciente: dadosPacienteAtualizado });
    toast({ title: "Sucesso!", description: `${novosIsolamentos.length} isolamento(s) adicionado(s) ao paciente.` });
  };

  const adicionarObservacaoPaciente = async (setorId: string, leitoId: string, observacao: string) => {
    const leito = setores.flatMap(s => s.leitos).find(l => l.id === leitoId);
    if (!leito?.dadosPaciente) return;

    const obsAtuais = leito.dadosPaciente.obsPaciente || [];
    const novosDados = {
      ...leito.dadosPaciente,
      obsPaciente: [...obsAtuais, observacao]
    };

    await updateLeitoInSetor(setorId, leitoId, { dadosPaciente: novosDados });
    toast({ title: "Observação Adicionada!" });
  };

  const cancelarRemanejamentoPendente = async (setorId: string, leitoId: string) => {
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      const setorDoc = await getDoc(setorRef);

      if (!setorDoc.exists()) {
        console.error("Setor não encontrado");
        return;
      }

      const setorData = setorDoc.data() as Setor;
      const leitosAtualizados = setorData.leitos.map(leito => {
        if (leito.id === leitoId && leito.dadosPaciente) {
          return { 
            ...leito, 
            dadosPaciente: { 
              ...leito.dadosPaciente, 
              remanejarPaciente: false,
              motivoRemanejamento: undefined,
              dataPedidoRemanejamento: undefined
            } 
          };
        }
        return leito;
      });

      await updateDoc(setorRef, { leitos: leitosAtualizados });
      toast({ title: "Remanejamento cancelado", description: "Pedido de remanejamento cancelado." });
    } catch (error) {
      console.error("Erro ao cancelar remanejamento:", error);
      toast({ title: "Erro", description: "Erro ao cancelar remanejamento. Tente novamente.", variant: "destructive" });
    }
  };

  return {
    setores,
    loading,
    criarSetor,
    atualizarSetor,
    excluirSetor,
    updateLeitoInSetor,
    atualizarStatusLeito,
    desbloquearLeito,
    finalizarHigienizacao,
    liberarLeito,
    solicitarUTI,
    solicitarRemanejamento,
    transferirPaciente,
    cancelarReserva,
    concluirTransferencia,
    toggleProvavelAlta,
    cancelarPedidoUTI,
    cancelarTransferencia,
    cancelarPedidoRemanejamento,
    altaAposRecuperacao,
    cancelarRegulacao,
    concluirRegulacao,
    confirmarRegulacao,
    iniciarTransferenciaExterna,
    adicionarLeito,
    atualizarLeito,
    excluirLeito,
    moverPaciente,
    atualizarRegrasIsolamento,
    finalizarIsolamentoPaciente,
    adicionarIsolamentoPaciente,
    adicionarRegistroTransferencia,
    concluirTransferenciaExterna,
    cancelarRemanejamentoPendente,
    adicionarObservacaoPaciente
  };
};
