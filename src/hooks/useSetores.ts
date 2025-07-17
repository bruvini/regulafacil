import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, updateDoc, writeBatch, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Setor, Leito, SetorFormData, LeitoFormData } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';
import { useAuditoria } from './useAuditoria';

export const useSetores = () => {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(false);
  const { registrarLog } = useAuditoria();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'setoresRegulaFacil'), (snapshot) => {
      const setoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Setor[];
      
      setSetores(setoresData);
      console.log('Setores atualizados:', setoresData);
    }, (error) => {
      console.error('Erro ao buscar setores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar setores",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, []);

  const atualizarStatusLeito = async (setorId: string, leitoId: string, novoStatus: string, motivo?: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId 
          ? { ...l, statusLeito: novoStatus, motivoBloqueio: motivo, dataAtualizacaoStatus: new Date().toISOString() }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      const leito = setor.leitos.find(l => l.id === leitoId);
      if (novoStatus === 'Bloqueado' && leito) {
        registrarLog(`Bloqueou o leito ${leito.codigoLeito}. Motivo: ${motivo}.`, 'Mapa de Leitos');
      }
    } catch (error) {
      console.error('Erro ao atualizar status do leito:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do leito",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const desbloquearLeito = async (setorId: string, leitoId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId 
          ? { ...l, statusLeito: 'Vago', motivoBloqueio: null, dataAtualizacaoStatus: new Date().toISOString() }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      const leito = setor.leitos.find(l => l.id === leitoId);
      if (leito) {
        registrarLog(`Desbloqueou o leito ${leito.codigoLeito}.`, 'Mapa de Leitos');
      }
    } catch (error) {
      console.error('Erro ao desbloquear leito:', error);
      toast({
        title: "Erro",
        description: "Erro ao desbloquear leito",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const finalizarHigienizacao = async (setorId: string, leitoId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId 
          ? { ...l, statusLeito: 'Vago', dataAtualizacaoStatus: new Date().toISOString() }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      const leito = setor.leitos.find(l => l.id === leitoId);
      if (leito) {
        registrarLog(`Finalizou a higienização do leito ${leito.codigoLeito}.`, 'Mapa de Leitos');
      }
    } catch (error) {
      console.error('Erro ao finalizar higienização:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar higienização",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const liberarLeito = async (setorId: string, leitoId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId 
          ? { ...l, statusLeito: 'Higienizacao', dadosPaciente: null, dataAtualizacaoStatus: new Date().toISOString() }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      const leito = setor.leitos.find(l => l.id === leitoId);
      if (leito) {
        registrarLog(`Liberou o leito ${leito.codigoLeito} (paciente: ${leito.dadosPaciente?.nomePaciente}).`, 'Mapa de Leitos');
      }
    } catch (error) {
      console.error('Erro ao liberar leito:', error);
      toast({
        title: "Erro",
        description: "Erro ao liberar leito",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const solicitarUTI = async (setorId: string, leitoId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId && l.dadosPaciente
          ? { ...l, dadosPaciente: { ...l.dadosPaciente, aguardaUTI: true, dataPedidoUTI: new Date().toISOString() } }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      const leito = setor.leitos.find(l => l.id === leitoId);
      if (leito?.dadosPaciente) {
        registrarLog(`Solicitou UTI para ${leito.dadosPaciente.nomePaciente} (leito: ${leito.codigoLeito}).`, 'Mapa de Leitos');
      }
    } catch (error) {
      console.error('Erro ao solicitar UTI:', error);
      toast({
        title: "Erro",
        description: "Erro ao solicitar UTI",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const solicitarRemanejamento = async (setorId: string, leitoId: string, motivo: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId && l.dadosPaciente
          ? { ...l, dadosPaciente: { ...l.dadosPaciente, remanejarPaciente: true, motivoRemanejamento: motivo } }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      const leito = setor.leitos.find(l => l.id === leitoId);
      if (leito?.dadosPaciente) {
        registrarLog(`Solicitou remanejamento para ${leito.dadosPaciente.nomePaciente} (leito: ${leito.codigoLeito}). Motivo: ${motivo}.`, 'Mapa de Leitos');
      }
    } catch (error) {
      console.error('Erro ao solicitar remanejamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao solicitar remanejamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const transferirPaciente = async (setorId: string, leitoId: string, destino: string, motivo: string, pacienteBase?: any) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId && l.dadosPaciente
          ? { ...l, dadosPaciente: { 
              ...(pacienteBase || l.dadosPaciente), 
              transferirPaciente: true, 
              destinoTransferencia: destino, 
              motivoTransferencia: motivo, 
              dataTransferencia: new Date().toISOString(),
              statusTransferencia: 'Organizar' 
            } }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      const leito = setor.leitos.find(l => l.id === leitoId);
      if (leito?.dadosPaciente) {
        registrarLog(`Iniciou transferência externa para ${leito.dadosPaciente.nomePaciente} (leito: ${leito.codigoLeito}). Destino: ${destino}. Motivo: ${motivo}.`, 'Mapa de Leitos');
      }
    } catch (error) {
      console.error('Erro ao transferir paciente:', error);
      toast({
        title: "Erro",
        description: "Erro ao transferir paciente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelarReserva = async (setorId: string, leitoId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leito = setor.leitos.find(l => l.id === leitoId);
      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId 
          ? { ...l, statusLeito: 'Vago', dadosPaciente: null, dataAtualizacaoStatus: new Date().toISOString() }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      if (leito?.dadosPaciente) {
        registrarLog(`Cancelou a reserva do leito ${leito.codigoLeito} para ${leito.dadosPaciente.nomePaciente}.`, 'Mapa de Leitos');
      }
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar reserva",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const concluirTransferencia = async (leito: Leito, setorId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leito.id 
          ? { ...l, statusLeito: 'Ocupado', dataAtualizacaoStatus: new Date().toISOString() }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      if (leito.dadosPaciente) {
        registrarLog(`Confirmou a transferência de ${leito.dadosPaciente.nomePaciente} para o leito ${leito.codigoLeito}.`, 'Mapa de Leitos');
      }
    } catch (error) {
      console.error('Erro ao concluir transferência:', error);
      toast({
        title: "Erro",
        description: "Erro ao concluir transferência",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProvavelAlta = async (setorId: string, leitoId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId && l.dadosPaciente
          ? { ...l, dadosPaciente: { ...l.dadosPaciente, provavelAlta: !l.dadosPaciente.provavelAlta } }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });
    } catch (error) {
      console.error('Erro ao toggle provável alta:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar provável alta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const criarSetor = async (data: Setor) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'setoresRegulaFacil'), data);
      toast({
        title: "Sucesso",
        description: "Setor criado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao criar setor:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar setor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarSetor = async (setorId: string, data: any) => {
    setLoading(true);
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, data);
      toast({
        title: "Sucesso",
        description: "Setor atualizado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar setor:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar setor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const excluirSetor = async (setorId: string) => {
    setLoading(true);
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await deleteDoc(setorRef);
      toast({
        title: "Sucesso",
        description: "Setor excluído com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir setor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarLeito = async (setorId: string, data: LeitoFormData) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const novoLeito: Leito = {
        id: Date.now().toString(),
        codigoLeito: data.codigoLeito,
        statusLeito: 'Vago',
        leitoPCP: data.leitoPCP || false,
        leitoIsolamento: data.leitoIsolamento || false,
        dataAtualizacaoStatus: new Date().toISOString(),
        dadosPaciente: null
      };

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: [...setor.leitos, novoLeito] });
      
      toast({
        title: "Sucesso",
        description: "Leito adicionado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao adicionar leito:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar leito",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarLeito = async (setorId: string, leitoIndex: string, data: LeitoFormData) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map((l, index) => 
        index === parseInt(leitoIndex) 
          ? { ...l, ...data }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });
      
      toast({
        title: "Sucesso",
        description: "Leito atualizado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar leito:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar leito",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const excluirLeito = async (setorId: string, leitoIndex: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.filter((l, index) => index !== parseInt(leitoIndex));

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });
      
      toast({
        title: "Sucesso",
        description: "Leito excluído com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir leito:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir leito",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const moverPaciente = async (origemSetorId: string, origemLeitoId: string, destinoSetorId: string, destinoLeitoId: string) => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      const setorOrigem = setores.find(s => s.id === origemSetorId);
      if (!setorOrigem) throw new Error('Setor de origem não encontrado');
      
      const leitoOrigem = setorOrigem.leitos.find(l => l.id === origemLeitoId);
      if (!leitoOrigem?.dadosPaciente) throw new Error('Paciente não encontrado');

      const leitosOrigemAtualizados = setorOrigem.leitos.map(l => 
        l.id === origemLeitoId 
          ? { ...l, statusLeito: 'Higienizacao', dadosPaciente: null, dataAtualizacaoStatus: new Date().toISOString() }
          : l
      );

      const setorOrigemRef = doc(db, 'setoresRegulaFacil', origemSetorId);
      batch.update(setorOrigemRef, { leitos: leitosOrigemAtualizados });

      const setorDestino = setores.find(s => s.id === destinoSetorId);
      if (!setorDestino) throw new Error('Setor de destino não encontrado');

      const leitoDestino = setorDestino.leitos.find(l => l.id === destinoLeitoId);
      const leitosDestinoAtualizados = setorDestino.leitos.map(l => 
        l.id === destinoLeitoId 
          ? { ...l, statusLeito: 'Ocupado', dadosPaciente: leitoOrigem.dadosPaciente, dataAtualizacaoStatus: new Date().toISOString() }
          : l
      );

      const setorDestinoRef = doc(db, 'setoresRegulaFacil', destinoSetorId);
      batch.update(setorDestinoRef, { leitos: leitosDestinoAtualizados });

      await batch.commit();

      toast({
        title: "Sucesso",
        description: "Paciente movido com sucesso",
      });

      if (leitoDestino) {
        registrarLog(`Moveu o paciente ${leitoOrigem.dadosPaciente.nomePaciente} do leito ${leitoOrigem.codigoLeito} para ${leitoDestino.codigoLeito}.`, 'Mapa de Leitos');
      }
    } catch (error) {
      console.error('Erro ao mover paciente:', error);
      toast({
        title: "Erro",
        description: "Erro ao mover paciente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarObservacaoPaciente = async (setorId: string, leitoId: string, observacao: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId && l.dadosPaciente
          ? { 
              ...l, 
              dadosPaciente: { 
                ...l.dadosPaciente, 
                obsPaciente: [...(l.dadosPaciente.obsPaciente || []), observacao]
              }
            }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      toast({
        title: "Sucesso",
        description: "Observação adicionada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao adicionar observação:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar observação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelarPedidoUTI = async (setorId: string, leitoId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId && l.dadosPaciente
          ? { ...l, dadosPaciente: { ...l.dadosPaciente, aguardaUTI: false } }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      toast({
        title: "Sucesso",
        description: "Pedido de UTI cancelado",
      });

      const leito = setor.leitos.find(l => l.id === leitoId);
      if (leito?.dadosPaciente) {
        registrarLog(`Cancelou o pedido de UTI para ${leito.dadosPaciente.nomePaciente} no leito ${leito.codigoLeito}.`, 'Regulação de Leitos');
      }
    } catch (error) {
      console.error('Erro ao cancelar pedido UTI:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar pedido UTI",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarRegistroTransferencia = async (setorId: string, leitoId: string, etapa: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId && l.dadosPaciente
          ? { 
              ...l, 
              dadosPaciente: { 
                ...l.dadosPaciente, 
                historicoTransferencia: [...(l.dadosPaciente.historicoTransferencia || []), {
                  data: new Date().toISOString(),
                  etapa
                }]
              }
            }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      const leito = setor.leitos.find(l => l.id === leitoId);
      if (leito?.dadosPaciente) {
        registrarLog(`Adicionou a etapa de transferência "${etapa}" para o paciente ${leito.dadosPaciente.nomePaciente}.`, 'Regulação de Leitos');
      }

      toast({
        title: "Sucesso",
        description: "Etapa registrada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao registrar etapa:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar etapa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const concluirTransferenciaExterna = async (setorId: string, leitoId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leito = setor.leitos.find(l => l.id === leitoId);
      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId 
          ? { ...l, statusLeito: 'Higienizacao', dadosPaciente: null, dataAtualizacaoStatus: new Date().toISOString() }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      if (leito?.dadosPaciente) {
        registrarLog(`Concluiu a transferência externa do paciente ${leito.dadosPaciente.nomePaciente} (leito: ${leito.codigoLeito}). O leito foi liberado.`, 'Regulação de Leitos');
      }

      toast({
        title: "Sucesso",
        description: "Transferência externa concluída",
      });
    } catch (error) {
      console.error('Erro ao concluir transferência externa:', error);
      toast({
        title: "Erro",
        description: "Erro ao concluir transferência externa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelarTransferencia = async (setorId: string, leitoId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leito = setor.leitos.find(l => l.id === leitoId);
      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId && l.dadosPaciente
          ? { ...l, dadosPaciente: { ...l.dadosPaciente, transferirPaciente: false, historicoTransferencia: [] } }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      if (leito?.dadosPaciente) {
        registrarLog(`Cancelou a transferência externa do paciente ${leito.dadosPaciente.nomePaciente} (leito: ${leito.codigoLeito}).`, 'Regulação de Leitos');
      }

      toast({
        title: "Sucesso",
        description: "Transferência cancelada",
      });
    } catch (error) {
      console.error('Erro ao cancelar transferência:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar transferência",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const altaAposRecuperacao = async (setorId: string, leitoId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leito = setor.leitos.find(l => l.id === leitoId);
      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId 
          ? { ...l, statusLeito: 'Higienizacao', dadosPaciente: null, dataAtualizacaoStatus: new Date().toISOString() }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      toast({
        title: "Sucesso",
        description: "Alta registrada com sucesso",
      });

      if (leito?.dadosPaciente) {
        registrarLog(`Informou alta para ${leito.dadosPaciente.nomePaciente} no leito ${leito.codigoLeito}.`, 'Regulação de Leitos');
      }
    } catch (error) {
      console.error('Erro ao registrar alta:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar alta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarRegulacao = async (paciente: any, leitoOrigem: any, leitoDestino: any, observacoes: string) => {
    try {
      setLoading(true);
      const agora = new Date().toISOString();
      const batch = writeBatch(db);

      const setorOrigemRef = doc(db, 'setoresRegulaFacil', leitoOrigem.setorId);
      const setorDestinoRef = doc(db, 'setoresRegulaFacil', leitoDestino.setorId);

      const dadosPacienteParaDestino = { ...(paciente || {}) };
      delete dadosPacienteParaDestino.regulacao;
      delete dadosPacienteParaDestino.aguardaUTI;
      delete dadosPacienteParaDestino.dataPedidoUTI;

      const setorOrigemData = setores.find(s => s.id === leitoOrigem.setorId)!;
      const leitosOrigemAtualizado = setorOrigemData.leitos.map(l => {
          if (l.id === leitoOrigem.leitoId) {
              return {
                  ...l,
                  statusLeito: 'Regulado' as const,
                  dataAtualizacaoStatus: agora,
                  regulacao: {
                      paraSetor: leitoDestino.setorNome || '',
                      paraLeito: leitoDestino.codigoLeito || '',
                      data: agora,
                      observacoes: observacoes || ''
                  }
              };
          }
          return l;
      });
      batch.update(setorOrigemRef, { leitos: leitosOrigemAtualizado });

      const setorDestinoData = setores.find(s => s.id === leitoDestino.setorId)!;
      const leitosDestinoAtualizado = setorDestinoData.leitos.map(l => {
          if (l.id === leitoDestino.id) {
              return {
                  ...l,
                  statusLeito: 'Reservado' as const,
                  dataAtualizacaoStatus: agora,
                  dadosPaciente: {
                      ...dadosPacienteParaDestino,
                      origem: { deSetor: leitoOrigem.setorOrigem || '', deLeito: leitoOrigem.leitoCodigo || '' }
                  }
              };
          }
          return l;
      });

      if (setorOrigemRef.path === setorDestinoRef.path) {
          const leitosCombinados = leitosOrigemAtualizado.map(l => leitosDestinoAtualizado.find(ld => ld.id === l.id) || l);
          batch.update(setorOrigemRef, { leitos: leitosCombinados });
      } else {
          batch.update(setorDestinoRef, { leitos: leitosDestinoAtualizado });
      }

      await batch.commit();
      toast({ title: 'Regulação Confirmada', description: `Leito ${leitoDestino.codigoLeito} regulado com sucesso!` });
      
      registrarLog(`Regulou ${paciente.nomePaciente} do leito ${leitoOrigem.leitoCodigo} para ${leitoDestino.codigoLeito}.`, 'Regulação de Leitos');
    } catch (error) {
      console.error('Erro ao confirmar regulação:', error);
      toast({ title: 'Erro', description: 'Não foi possível confirmar a regulação.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const concluirRegulacao = async (paciente: any) => {
    setLoading(true);
    try {
      const setorOrigem = setores.find(s => s.id === paciente.setorId);
      if (!setorOrigem) throw new Error('Setor de origem não encontrado');

      const leitoOrigem = setorOrigem.leitos.find(l => l.id === paciente.leitoId);
      if (!leitoOrigem?.dadosPaciente || !leitoOrigem.regulacao) throw new Error('Dados de regulação não encontrados');

      const setorDestino = setores.find(s => s.nomeSetor === leitoOrigem.regulacao.paraSetor);
      if (!setorDestino) throw new Error('Setor de destino não encontrado');

      const leitoDestino = setorDestino.leitos.find(l => l.codigoLeito === leitoOrigem.regulacao.paraLeito);
      if (!leitoDestino) throw new Error('Leito de destino não encontrado');

      await moverPaciente(paciente.setorId, paciente.leitoId, setorDestino.id!, leitoDestino.id);

      toast({
        title: "Sucesso",
        description: "Regulação concluída com sucesso",
      });

      registrarLog(`Concluiu a regulação de ${paciente.nomePaciente} para o leito ${leitoOrigem.regulacao.paraLeito}.`, 'Regulação de Leitos');
    } catch (error) {
      console.error('Erro ao concluir regulação:', error);
      toast({
        title: "Erro",
        description: "Erro ao concluir regulação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelarRegulacao = async (paciente: any, motivo: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === paciente.setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === paciente.leitoId 
          ? { ...l, statusLeito: 'Ocupado', regulacao: null }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', paciente.setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      toast({
        title: "Sucesso",
        description: "Regulação cancelada",
      });

      const leito = setor.leitos.find(l => l.id === paciente.leitoId);
      if (leito?.regulacao) {
        registrarLog(`Cancelou a regulação de ${paciente.nomePaciente} para o leito ${leito.regulacao.paraLeito}. Motivo: ${motivo}.`, 'Regulação de Leitos');
      }
    } catch (error) {
      console.error('Erro ao cancelar regulação:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar regulação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelarPedidoRemanejamento = async (setorId: string, leitoId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId && l.dadosPaciente
          ? { ...l, dadosPaciente: { ...l.dadosPaciente, remanejarPaciente: false, motivoRemanejamento: null } }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      toast({
        title: "Sucesso",
        description: "Pedido de remanejamento cancelado",
      });

      const leito = setor.leitos.find(l => l.id === leitoId);
      if (leito?.dadosPaciente) {
        registrarLog(`Cancelou a solicitação de remanejamento para ${leito.dadosPaciente.nomePaciente} no leito ${leito.codigoLeito}.`, 'Regulação de Leitos');
      }
    } catch (error) {
      console.error('Erro ao cancelar pedido de remanejamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar pedido de remanejamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const iniciarTransferenciaExterna = async (setorId: string, leitoId: string, destino: string, motivo: string) => {
    const leito = setores.flatMap(s => s.leitos).find(l => l.id === leitoId);
    if (!leito?.dadosPaciente) return;

    const { aguardaUTI, dataPedidoUTI, ...pacienteSemUTI } = leito.dadosPaciente;

    await transferirPaciente(setorId, leitoId, destino, motivo, pacienteSemUTI);
  };

  const cancelarRemanejamentoPendente = async (setorId: string, leitoId: string) => {
    await cancelarPedidoRemanejamento(setorId, leitoId);
  };

  const atualizarRegrasIsolamento = async (setorId: string, leitoId: string, isolamentoId: string, regrasCumpridas: string[]) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => {
        if (l.id === leitoId && l.dadosPaciente?.isolamentosVigentes) {
          const isolamentosAtualizados = l.dadosPaciente.isolamentosVigentes.map(iso => 
            iso.isolamentoId === isolamentoId 
              ? { ...iso, regrasCumpridas }
              : iso
          );
          return { 
            ...l, 
            dadosPaciente: { 
              ...l.dadosPaciente, 
              isolamentosVigentes: isolamentosAtualizados 
            } 
          };
        }
        return l;
      });

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      console.log('Regras de isolamento atualizadas');
    } catch (error) {
      console.error('Erro ao atualizar regras de isolamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar regras de isolamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const finalizarIsolamentoPaciente = async (setorId: string, leitoId: string, isolamentoId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => {
        if (l.id === leitoId && l.dadosPaciente?.isolamentosVigentes) {
          const isolamentosAtualizados = l.dadosPaciente.isolamentosVigentes.filter(iso => 
            iso.isolamentoId !== isolamentoId
          );
          return { 
            ...l, 
            dadosPaciente: { 
              ...l.dadosPaciente, 
              isolamentosVigentes: isolamentosAtualizados 
            } 
          };
        }
        return l;
      });

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      toast({
        title: "Isolamento Finalizado",
        description: "O isolamento foi finalizado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao finalizar isolamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar isolamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarIsolamentoPaciente = async (setorId: string, leitoId: string, novosIsolamentos: any[]) => {
    if (!novosIsolamentos || novosIsolamentos.length === 0) {
      toast({ title: "Aviso", description: "Nenhum isolamento selecionado.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      let leitoFoiAtualizado = false;

      const leitosAtualizados = setor.leitos.map(l => {
        if (l.id === leitoId && l.dadosPaciente) {
          const isolamentosAtuais = l.dadosPaciente.isolamentosVigentes || [];
          const isolamentosCombinados = [...isolamentosAtuais, ...novosIsolamentos];

          const dadosPacienteAtualizado = {
            ...l.dadosPaciente,
            isolamentosVigentes: isolamentosCombinados
          };

          leitoFoiAtualizado = true;
          return { ...l, dadosPaciente: dadosPacienteAtualizado };
        }
        return l;
      });

      if (leitoFoiAtualizado) {
          const setorRef = doc(db, 'setoresRegulaFacil', setorId);
          await updateDoc(setorRef, { leitos: leitosAtualizados });
          toast({ title: "Sucesso!", description: `${novosIsolamentos.length} isolamento(s) adicionado(s) com sucesso.` });
      } else {
          throw new Error('Paciente ou leito não encontrado para atualização.');
      }

    } catch (error) {
      console.error('Erro ao adicionar isolamento:', error);
      toast({ title: "Erro", description: "Não foi possível adicionar o(s) isolamento(s).", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return {
    setores,
    loading,
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
    criarSetor,
    atualizarSetor,
    excluirSetor,
    adicionarLeito,
    atualizarLeito,
    excluirLeito,
    moverPaciente,
    adicionarObservacaoPaciente,
    cancelarPedidoUTI,
    adicionarRegistroTransferencia,
    concluirTransferenciaExterna,
    cancelarTransferencia,
    altaAposRecuperacao,
    confirmarRegulacao,
    concluirRegulacao,
    cancelarRegulacao,
    cancelarPedidoRemanejamento,
    iniciarTransferenciaExterna,
    cancelarRemanejamentoPendente,
    atualizarRegrasIsolamento,
    finalizarIsolamentoPaciente,
    adicionarIsolamentoPaciente
  };
};
