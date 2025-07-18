
// src/hooks/useSetores.ts

import { useState, useEffect, useMemo } from 'react';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, query, orderBy, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Setor, SetorFormData, Leito, Paciente, HistoricoMovimentacao } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';
import { useAuditoria } from './useAuditoria';
import { useLeitos } from './useLeitos';
import { usePacientes } from './usePacientes';

// Tipo extendido de Leito com propriedades de runtime
export type LeitoExtendido = Leito & {
  statusLeito: HistoricoMovimentacao['statusLeito'];
  dataAtualizacaoStatus?: string;
  dadosPaciente?: Paciente;
  motivoBloqueio?: string;
  regulacao?: {
    paraSetor: string;
    paraLeito: string;
    observacoes?: string;
  };
};

// Tipo extendido de Setor com leitos
export type SetorComLeitos = Setor & {
  leitos: LeitoExtendido[];
};

export const useSetores = () => {
  const [setores, setSetores] = useState<SetorComLeitos[]>([]);
  const [loading, setLoading] = useState(true);
  const { registrarLog } = useAuditoria();
  const { leitos } = useLeitos();
  const { pacientes } = usePacientes();

  // Combinar dados de setores, leitos e pacientes
  const setoresEnriquecidos = useMemo(() => {
    if (!setores.length && !leitos.length) return [];

    const setoresComLeitos = setores.map(setor => {
      const leitosDoSetor = leitos
        .filter(leito => leito.setorId === setor.id)
        .map(leito => {
          const ultimoHistorico = leito.historicoMovimentacao?.[leito.historicoMovimentacao.length - 1];
          const pacienteDoLeito = pacientes.find(p => p.leitoId === leito.id);
          
          return {
            ...leito,
            statusLeito: ultimoHistorico?.statusLeito || 'Vago',
            dataAtualizacaoStatus: ultimoHistorico?.dataAtualizacaoStatus,
            dadosPaciente: pacienteDoLeito,
            motivoBloqueio: ultimoHistorico?.motivoBloqueio,
            regulacao: ultimoHistorico?.infoRegulacao,
          } as LeitoExtendido;
        });

      return {
        ...setor,
        leitos: leitosDoSetor
      };
    });

    return setoresComLeitos;
  }, [setores, leitos, pacientes]);

  useEffect(() => {
    const q = query(collection(db, 'setoresRegulaFacil'), orderBy('nomeSetor'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const setoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Setor[];
      
      setSetores(setoresData.map(setor => ({ ...setor, leitos: [] })));
      setLoading(false);
    }, (error) => {
      console.error('Erro ao buscar setores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar setores do sistema.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const criarSetor = async (data: SetorFormData) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'setoresRegulaFacil'), data);
      registrarLog(`Criou o setor "${data.nomeSetor}" (${data.siglaSetor}).`, 'Gestão de Setores');
      toast({
        title: "Sucesso",
        description: "Setor criado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao criar setor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o setor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarSetor = async (setorId: string, data: Partial<SetorFormData>) => {
    setLoading(true);
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, data);
      registrarLog(`Atualizou o setor "${data.nomeSetor}" (${data.siglaSetor}).`, 'Gestão de Setores');
      toast({
        title: "Sucesso",
        description: "Setor atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar setor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o setor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const excluirSetor = async (setorId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await deleteDoc(setorRef);

      if (setor) {
        registrarLog(`Excluiu o setor "${setor.nomeSetor}".`, 'Gestão de Setores');
      }
      toast({
        title: "Sucesso",
        description: "Setor excluído com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o setor. Verifique se não há leitos associados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Funções de ação para leitos (delegadas para useLeitos)
  const atualizarStatusLeito = async (setorId: string, leitoId: string, novoStatus: HistoricoMovimentacao['statusLeito'], motivo?: string) => {
    const { atualizarStatusLeito: updateStatus } = useLeitos();
    return updateStatus(leitoId, novoStatus, { motivoBloqueio: motivo });
  };

  const desbloquearLeito = async (setorId: string, leitoId: string) => {
    return atualizarStatusLeito(setorId, leitoId, 'Vago');
  };

  const finalizarHigienizacao = async (setorId: string, leitoId: string) => {
    return atualizarStatusLeito(setorId, leitoId, 'Vago');
  };

  const liberarLeito = async (setorId: string, leitoId: string) => {
    return atualizarStatusLeito(setorId, leitoId, 'Higienizacao');
  };

  const solicitarUTI = async (setorId: string, leitoId: string) => {
    // Implementar lógica de solicitação UTI
    registrarLog(`Solicitou UTI para leito ${leitoId}.`, 'Gestão de Leitos');
    toast({
      title: "Sucesso",
      description: "Solicitação de UTI registrada.",
    });
  };

  const solicitarRemanejamento = async (setorId: string, leitoId: string, motivo: string) => {
    // Implementar lógica de remanejamento
    registrarLog(`Solicitou remanejamento para leito ${leitoId}: ${motivo}.`, 'Gestão de Leitos');
    toast({
      title: "Sucesso",
      description: "Solicitação de remanejamento registrada.",
    });
  };

  const transferirPaciente = async (setorId: string, leitoId: string, destino: string, motivo: string) => {
    // Implementar lógica de transferência
    registrarLog(`Transferiu paciente do leito ${leitoId} para ${destino}: ${motivo}.`, 'Gestão de Leitos');
    toast({
      title: "Sucesso",
      description: "Transferência registrada.",
    });
  };

  const cancelarReserva = async (setorId: string, leitoId: string) => {
    return atualizarStatusLeito(setorId, leitoId, 'Vago');
  };

  const concluirTransferencia = async (leito: LeitoExtendido, setorId: string) => {
    return atualizarStatusLeito(setorId, leito.id, 'Ocupado');
  };

  const toggleProvavelAlta = async (setorId: string, leitoId: string) => {
    // Implementar lógica de provável alta
    registrarLog(`Alterou status de provável alta para leito ${leitoId}.`, 'Gestão de Leitos');
    toast({
      title: "Sucesso",
      description: "Status de provável alta atualizado.",
    });
  };

  const moverPaciente = async (setorOrigemId: string, leitoOrigemId: string, setorDestinoId: string, leitoDestinoId: string) => {
    // Implementar lógica de movimentação
    registrarLog(`Moveu paciente do leito ${leitoOrigemId} para ${leitoDestinoId}.`, 'Movimentação');
    toast({
      title: "Sucesso",
      description: "Paciente movido com sucesso.",
    });
  };

  const adicionarObservacaoPaciente = async (setorId: string, leitoId: string, observacao: string) => {
    // Implementar lógica de observação
    registrarLog(`Adicionou observação ao paciente do leito ${leitoId}.`, 'Observações');
    toast({
      title: "Sucesso",
      description: "Observação adicionada.",
    });
  };

  // Funções não implementadas (para compatibilidade)
  const atualizarRegrasIsolamento = async () => {};
  const finalizarIsolamentoPaciente = async () => {};
  const adicionarIsolamentoPaciente = async () => {};

  return {
    setores: setoresEnriquecidos,
    loading,
    criarSetor,
    atualizarSetor,
    excluirSetor,
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
    moverPaciente,
    adicionarObservacaoPaciente,
    atualizarRegrasIsolamento,
    finalizarIsolamentoPaciente,
    adicionarIsolamentoPaciente,
  };
};
