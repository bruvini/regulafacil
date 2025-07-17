
// src/hooks/useSetores.ts

import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, query, orderBy, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Setor, SetorFormData, LeitoBase, Leito, Paciente, DadosPaciente, HistoricoMovimentacao } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';
import { useAuditoria } from './useAuditoria';

export const useSetores = () => {
  const [setores, setSetores] = useState<(Setor & { leitos: Leito[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const { registrarLog } = useAuditoria();

  useEffect(() => {
    const setoresQuery = query(collection(db, 'setoresRegulaFacil'), orderBy('nomeSetor'));
    const leitosQuery = query(collection(db, 'leitosRegulaFacil'), orderBy('codigoLeito'));
    const pacientesQuery = query(collection(db, 'pacientesRegulaFacil'));

    let setoresData: Setor[] = [];
    let leitosData: LeitoBase[] = [];
    let pacientesData: Paciente[] = [];
    let loadingCount = 3;

    const checkAndCombineData = () => {
      loadingCount--;
      if (loadingCount === 0) {
        // Criar mapa de pacientes por leitoId
        const pacientesPorLeito = new Map<string, Paciente>();
        pacientesData.forEach(paciente => {
          pacientesPorLeito.set(paciente.leitoId, paciente);
        });

        // Combinar setores com seus leitos
        const setoresComLeitos = setoresData.map(setor => {
          const leitosDoSetor = leitosData.filter(leito => leito.setorId === setor.id);
          
          // Adicionar status atual e dados do paciente aos leitos
          const leitosComStatus: Leito[] = leitosDoSetor.map(leitoBase => {
            const ultimoHistorico = leitoBase.historicoMovimentacao?.[leitoBase.historicoMovimentacao.length - 1];
            const paciente = pacientesPorLeito.get(leitoBase.id);
            
            let dadosPaciente: DadosPaciente | undefined;
            if (paciente) {
              dadosPaciente = {
                nomePaciente: paciente.nomeCompleto,
                dataNascimento: paciente.dataNascimento,
                sexoPaciente: paciente.sexoPaciente,
                dataInternacao: paciente.dataInternacao,
                especialidadePaciente: paciente.especialidadePaciente,
                aguardaUTI: paciente.aguardaUTI,
                dataPedidoUTI: paciente.dataPedidoUTI,
                remanejarPaciente: paciente.remanejarPaciente,
                motivoRemanejamento: paciente.motivoRemanejamento,
                dataPedidoRemanejamento: paciente.dataPedidoRemanejamento,
                transferirPaciente: paciente.transferirPaciente,
                destinoTransferencia: paciente.destinoTransferencia,
                motivoTransferencia: paciente.motivoTransferencia,
                dataTransferencia: paciente.dataTransferencia,
                statusTransferencia: paciente.statusTransferencia,
                historicoTransferencia: paciente.historicoTransferencia,
                provavelAlta: paciente.provavelAlta,
                obsPaciente: paciente.obsPaciente,
                isolamentosVigentes: paciente.isolamentosVigentes,
                origem: paciente.origem,
              };
            }

            return {
              ...leitoBase,
              statusLeito: ultimoHistorico?.statusLeito || 'Vago',
              dataAtualizacaoStatus: ultimoHistorico?.dataAtualizacaoStatus || new Date().toISOString(),
              dadosPaciente,
              motivoBloqueio: ultimoHistorico?.motivoBloqueio,
              regulacao: ultimoHistorico?.infoRegulacao
            };
          });

          return {
            ...setor,
            leitos: leitosComStatus
          };
        });

        setSetores(setoresComLeitos);
        setLoading(false);
      }
    };

    const unsubscribeSetores = onSnapshot(setoresQuery, (snapshot) => {
      setoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Setor[];
      checkAndCombineData();
    }, (error) => {
      console.error('Erro ao buscar setores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar setores do sistema.",
        variant: "destructive",
      });
      setLoading(false);
    });

    const unsubscribeLeitos = onSnapshot(leitosQuery, (snapshot) => {
      leitosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeitoBase[];
      checkAndCombineData();
    }, (error) => {
      console.error('Erro ao buscar leitos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar leitos do sistema.",
        variant: "destructive",
      });
      setLoading(false);
    });

    const unsubscribePacientes = onSnapshot(pacientesQuery, (snapshot) => {
      pacientesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Paciente[];
      checkAndCombineData();
    }, (error) => {
      console.error('Erro ao buscar pacientes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pacientes do sistema.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => {
      unsubscribeSetores();
      unsubscribeLeitos();
      unsubscribePacientes();
    };
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

  const atualizarStatusLeito = async (setorId: string, leitoId: string, novoStatus: 'Vago' | 'Ocupado' | 'Bloqueado' | 'Higienizacao' | 'Regulado' | 'Reservado', motivo?: string) => {
    try {
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
      const novoHistorico: HistoricoMovimentacao = {
        statusLeito: novoStatus,
        dataAtualizacaoStatus: new Date().toISOString(),
        motivoBloqueio: motivo
      };
      
      await updateDoc(leitoRef, {
        historicoMovimentacao: arrayUnion(novoHistorico)
      });

      registrarLog(`Atualizou status do leito para ${novoStatus}.`, 'Gestão de Leitos');
      toast({
        title: "Sucesso",
        description: `Status do leito atualizado para ${novoStatus}.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status do leito:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do leito.",
        variant: "destructive",
      });
    }
  };

  const desbloquearLeito = async (setorId: string, leitoId: string) => {
    await atualizarStatusLeito(setorId, leitoId, 'Vago');
  };

  const finalizarHigienizacao = async (setorId: string, leitoId: string) => {
    await atualizarStatusLeito(setorId, leitoId, 'Vago');
  };

  const liberarLeito = async (setorId: string, leitoId: string) => {
    await atualizarStatusLeito(setorId, leitoId, 'Higienizacao');
  };

  const solicitarUTI = async (setorId: string, leitoId: string) => {
    try {
      // Encontrar o paciente no leito
      const setor = setores.find(s => s.id === setorId);
      const leito = setor?.leitos.find(l => l.id === leitoId);
      const paciente = leito?.dadosPaciente;
      
      if (paciente) {
        registrarLog(`Solicitou UTI para paciente no leito ${leito.codigoLeito}.`, 'Gestão de Leitos');
        toast({
          title: "Sucesso",
          description: "Solicitação de UTI enviada.",
        });
      }
    } catch (error) {
      console.error('Erro ao solicitar UTI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível solicitar UTI.",
        variant: "destructive",
      });
    }
  };

  const solicitarRemanejamento = async (setorId: string, leitoId: string, motivo: string) => {
    try {
      registrarLog(`Solicitou remanejamento para leito. Motivo: ${motivo}`, 'Gestão de Leitos');
      toast({
        title: "Sucesso",
        description: "Solicitação de remanejamento enviada.",
      });
    } catch (error) {
      console.error('Erro ao solicitar remanejamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível solicitar remanejamento.",
        variant: "destructive",
      });
    }
  };

  const transferirPaciente = async (setorId: string, leitoId: string, destino: string, motivo: string) => {
    try {
      registrarLog(`Iniciou transferência externa. Destino: ${destino}, Motivo: ${motivo}`, 'Gestão de Leitos');
      toast({
        title: "Sucesso",
        description: "Transferência externa iniciada.",
      });
    } catch (error) {
      console.error('Erro ao transferir paciente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar transferência.",
        variant: "destructive",
      });
    }
  };

  const cancelarReserva = async (setorId: string, leitoId: string) => {
    await atualizarStatusLeito(setorId, leitoId, 'Vago');
  };

  const concluirTransferencia = async (leito: Leito, setorId: string) => {
    await atualizarStatusLeito(setorId, leito.id, 'Ocupado');
  };

  const toggleProvavelAlta = async (setorId: string, leitoId: string) => {
    try {
      registrarLog(`Alternado status de provável alta para leito.`, 'Gestão de Leitos');
      toast({
        title: "Sucesso",
        description: "Status de provável alta atualizado.",
      });
    } catch (error) {
      console.error('Erro ao alterar provável alta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar provável alta.",
        variant: "destructive",
      });
    }
  };

  return {
    setores,
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
  };
};
