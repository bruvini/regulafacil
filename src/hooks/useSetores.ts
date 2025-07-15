
import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, updateDoc, writeBatch, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Setor, Leito, SetorFormData, LeitoFormData } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';

export const useSetores = () => {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(false);

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
          ? { ...l, dadosPaciente: { ...l.dadosPaciente, aguardaUTI: true } }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });
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
          ? { ...l, dadosPaciente: { ...l.dadosPaciente, remanejarPaciente: true } }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });
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

  const transferirPaciente = async (setorId: string, leitoId: string, destino: string, motivo: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId && l.dadosPaciente
          ? { ...l, dadosPaciente: { ...l.dadosPaciente, transferirPaciente: true } }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });
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

      const leitosAtualizados = setor.leitos.map(l => 
        l.id === leitoId 
          ? { ...l, statusLeito: 'Vago', dadosPaciente: null, dataAtualizacaoStatus: new Date().toISOString() }
          : l
      );

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });
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

  const atualizarSetor = async (setorId: string, data: SetorFormData) => {
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
      
      // Find source sector and bed
      const setorOrigem = setores.find(s => s.id === origemSetorId);
      if (!setorOrigem) throw new Error('Setor de origem não encontrado');
      
      const leitoOrigem = setorOrigem.leitos.find(l => l.id === origemLeitoId);
      if (!leitoOrigem?.dadosPaciente) throw new Error('Paciente não encontrado');

      // Update source bed
      const leitosOrigemAtualizados = setorOrigem.leitos.map(l => 
        l.id === origemLeitoId 
          ? { ...l, statusLeito: 'Higienizacao', dadosPaciente: null, dataAtualizacaoStatus: new Date().toISOString() }
          : l
      );

      const setorOrigemRef = doc(db, 'setoresRegulaFacil', origemSetorId);
      batch.update(setorOrigemRef, { leitos: leitosOrigemAtualizados });

      // Update destination bed
      const setorDestino = setores.find(s => s.id === destinoSetorId);
      if (!setorDestino) throw new Error('Setor de destino não encontrado');

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
                observacoes: [...(l.dadosPaciente.observacoes || []), {
                  id: Date.now().toString(),
                  texto: observacao,
                  dataHora: new Date().toISOString(),
                  autor: 'Sistema'
                }]
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

  const adicionarRegistroTransferencia = async (data: any) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'transferencias'), data);
      toast({
        title: "Sucesso",
        description: "Transferência registrada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao registrar transferência:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar transferência",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const concluirTransferenciaExterna = async (transferId: string) => {
    setLoading(true);
    try {
      const transferRef = doc(db, 'transferencias', transferId);
      await updateDoc(transferRef, { status: 'concluida' });
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

  const cancelarTransferencia = async (transferId: string) => {
    setLoading(true);
    try {
      const transferRef = doc(db, 'transferencias', transferId);
      await updateDoc(transferRef, { status: 'cancelada' });
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

  const adicionarIsolamentoPaciente = async (setorId: string, leitoId: string, novoIsolamento: any) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => {
        if (l.id === leitoId && l.dadosPaciente) {
          const isolamentosAtuais = l.dadosPaciente.isolamentosVigentes || [];
          const dadosPacienteAtualizado = {
            ...l.dadosPaciente,
            isolamentosVigentes: [...isolamentosAtuais, novoIsolamento]
          };
          return { ...l, dadosPaciente: dadosPacienteAtualizado };
        }
        return l;
      });

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      toast({ 
        title: "Vigilância Iniciada", 
        description: `Isolamento ${novoIsolamento.sigla} adicionado ao paciente.` 
      });
    } catch (error) {
      console.error('Erro ao adicionar isolamento:', error);
      toast({ 
        title: "Erro", 
        description: "Não foi possível adicionar o isolamento.", 
        variant: "destructive" 
      });
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
    atualizarRegrasIsolamento,
    finalizarIsolamentoPaciente,
    adicionarIsolamentoPaciente
  };
};
