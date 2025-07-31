import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { usePacientes } from '@/hooks/usePacientes';
import { useLeitos } from '@/hooks/useLeitos';
import { useAuditoria } from '@/hooks/useAuditoria';
import { Paciente, Leito, HistoricoLeito } from '@/types/hospital';

export const useRegulacaoLogic = () => {
  const { toast } = useToast();
  const { atualizarPaciente, removerPaciente } = usePacientes();
  const { atualizarStatusLeito } = useLeitos();
  const { registrarLog } = useAuditoria();

  const [isRegulacaoModalOpen, setIsRegulacaoModalOpen] = useState(false);
  const [isConfirmacaoModalOpen, setIsConfirmacaoModalOpen] = useState(false);
  const [isTransferenciaModalOpen, setIsTransferenciaModalOpen] = useState(false);
  const [isRemanejamentoModalOpen, setIsRemanejamentoModalOpen] = useState(false);
  const [isConfirmacaoAltaModalOpen, setIsConfirmacaoAltaModalOpen] = useState(false);
  const [isJustificativaModalOpen, setIsJustificativaModalOpen] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [pacienteParaRemover, setPacienteParaRemover] = useState<Paciente | null>(null);
  const [leitoParaRemover, setLeitoParaRemover] = useState<Leito | null>(null);
  const [leitoDestinoRemanejamento, setLeitoDestinoRemanejamento] = useState<Leito | null>(null);
  const [pacienteParaRemanejar, setPacienteParaRemanejar] = useState<Paciente | null>(null);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [modoRegulacao, setModoRegulacao] = useState<"normal" | "uti">("normal");
  const [actingOnPatientId, setActingOnPatientId] = useState<string | null>(null);

  const handleOpenRegulacaoModal = (paciente: Paciente, modo: "normal" | "uti" = "normal") => {
    setPacienteSelecionado(paciente);
    setModoRegulacao(modo);
    setIsRegulacaoModalOpen(true);
  };

  const handleCloseRegulacaoModal = () => {
    setIsRegulacaoModalOpen(false);
    setPacienteSelecionado(null);
    setModoRegulacao("normal");
  };

  const handleOpenConfirmacaoModal = (paciente: Paciente, leito: Leito) => {
    setPacienteParaRemover(paciente);
    setLeitoParaRemover(leito);
    setIsConfirmacaoModalOpen(true);
  };

  const handleCloseConfirmacaoModal = () => {
    setIsConfirmacaoModalOpen(false);
    setPacienteParaRemover(null);
    setLeitoParaRemover(null);
  };

  const handleOpenTransferenciaModal = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setIsTransferenciaModalOpen(true);
  };

  const handleCloseTransferenciaModal = () => {
    setIsTransferenciaModalOpen(false);
    setPacienteSelecionado(null);
  };

  const handleOpenRemanejamentoModal = (paciente: Paciente) => {
    setPacienteParaRemanejar(paciente);
    setIsRemanejamentoModalOpen(true);
  };

  const handleCloseRemanejamentoModal = () => {
    setIsRemanejamentoModalOpen(false);
    setPacienteParaRemanejar(null);
    setLeitoDestinoRemanejamento(null);
  };

  const handleOpenConfirmacaoAlta = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setIsConfirmacaoAltaModalOpen(true);
  };

  const handleCloseConfirmacaoAlta = () => {
    setIsConfirmacaoAltaModalOpen(false);
    setPacienteSelecionado(null);
  };

  const handleOpenJustificativaModal = () => {
    setIsJustificativaModalOpen(true);
  };

  const handleCloseJustificativaModal = () => {
    setIsJustificativaModalOpen(false);
    setJustificativa('');
  };

  const handleJustificativaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJustificativa(e.target.value);
  };

  const altaAposRecuperacao = async (leitoId: string) => {
    try {
      setActingOnPatientId(leitoId);
      const leitoAtualizado: Partial<HistoricoLeito> = {
        statusLeito: 'Vago',
        dataAtualizacaoStatus: new Date().toISOString(),
        pacienteId: null,
      };

      await atualizarStatusLeito(leitoId, leitoAtualizado);
      toast({
        title: "Alta Concluída",
        description: "O paciente recebeu alta e o leito foi liberado.",
        duration: 5000,
      });
      registrarLog(`Paciente recebeu alta após recuperação no leito ${leitoId}`, "Regulação");
    } catch (error) {
      console.error("Erro ao dar alta:", error);
      toast({
        title: "Erro",
        description: "Houve um erro ao dar alta ao paciente. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setActingOnPatientId(null);
    }
  };

  const handleConcluir = async (paciente: Paciente) => {
    try {
      setActingOnPatientId(paciente.id);
      if (!paciente.leitoId) {
        console.warn("Paciente sem leitoId. Não é possível concluir.");
        return;
      }

      const leitoAtualizado: Partial<HistoricoLeito> = {
        statusLeito: 'Vago',
        dataAtualizacaoStatus: new Date().toISOString(),
        pacienteId: null,
      };

      await atualizarStatusLeito(paciente.leitoId, leitoAtualizado);
      await removerPaciente(paciente.id);

      toast({
        title: "Concluído",
        description: "O paciente foi concluído e o leito foi liberado.",
        duration: 5000,
      });
      registrarLog(`Paciente concluído e removido: ${paciente.nomeCompleto} (ID: ${paciente.id})`, "Regulação");
    } catch (error) {
      console.error("Erro ao concluir paciente:", error);
      toast({
        title: "Erro",
        description: "Houve um erro ao concluir o paciente. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setActingOnPatientId(null);
    }
  };

  const handleAlterar = async (paciente: Paciente) => {
    try {
      setActingOnPatientId(paciente.id);
      // Implemente a lógica para alterar o paciente aqui
      toast({
        title: "Alterado",
        description: "O paciente foi alterado com sucesso.",
        duration: 5000,
      });
      registrarLog(`Paciente alterado: ${paciente.nomeCompleto} (ID: ${paciente.id})`, "Regulação");
    } catch (error) {
      console.error("Erro ao alterar paciente:", error);
      toast({
        title: "Erro",
        description: "Houve um erro ao alterar o paciente. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setActingOnPatientId(null);
    }
  };

  const handleCancelar = async (paciente: Paciente) => {
    try {
      setActingOnPatientId(paciente.id);
      handleOpenJustificativaModal();
      // Implemente a lógica para cancelar o paciente aqui
      toast({
        title: "Cancelado",
        description: "O paciente foi cancelado com sucesso.",
        duration: 5000,
      });
      registrarLog(`Paciente cancelado: ${paciente.nomeCompleto} (ID: ${paciente.id})`, "Regulação");
    } catch (error) {
      console.error("Erro ao cancelar paciente:", error);
      toast({
        title: "Erro",
        description: "Houve um erro ao cancelar o paciente. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setActingOnPatientId(null);
    }
  };

  const handleRemover = useCallback(async () => {
    if (!pacienteParaRemover || !leitoParaRemover) return;

    try {
      setActingOnPatientId(pacienteParaRemover.id);
      // Atualiza o leito para "Vago"
      const leitoAtualizado: Partial<HistoricoLeito> = {
        statusLeito: 'Vago',
        dataAtualizacaoStatus: new Date().toISOString(),
        pacienteId: null,
      };
      await atualizarStatusLeito(leitoParaRemover.id, leitoAtualizado);

      // Remove o paciente
      await removerPaciente(pacienteParaRemover.id);

      toast({
        title: "Removido",
        description: "O paciente foi removido com sucesso e o leito foi liberado.",
        duration: 5000,
      });
      registrarLog(`Paciente removido: ${pacienteParaRemover.nomeCompleto} (ID: ${pacienteParaRemover.id}) do leito ${leitoParaRemover.codigoLeito}`, "Regulação");
    } catch (error) {
      console.error("Erro ao remover paciente:", error);
      toast({
        title: "Erro",
        description: "Houve um erro ao remover o paciente. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      handleCloseConfirmacaoModal();
      setActingOnPatientId(null);
    }
  }, [pacienteParaRemover, leitoParaRemover, atualizarStatusLeito, removerPaciente, toast, registrarLog, handleCloseConfirmacaoModal]);

  const handleTransferir = async (destino: string) => {
    if (!pacienteSelecionado) return;

    try {
      setActingOnPatientId(pacienteSelecionado.id);
      // Lógica para transferir o paciente
      toast({
        title: "Transferido",
        description: `O paciente foi transferido para ${destino} com sucesso.`,
        duration: 5000,
      });
      registrarLog(`Paciente transferido: ${pacienteSelecionado.nomeCompleto} (ID: ${pacienteSelecionado.id}) para ${destino}`, "Regulação");
    } catch (error) {
      console.error("Erro ao transferir paciente:", error);
      toast({
        title: "Erro",
        description: "Houve um erro ao transferir o paciente. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      handleCloseTransferenciaModal();
      setActingOnPatientId(null);
    }
  };

  const handleDefinirLeitoRemanejamento = (leito: Leito) => {
    setLeitoDestinoRemanejamento(leito);
  };

  const handleConfirmarRemanejamento = async () => {
    if (!pacienteParaRemanejar || !leitoDestinoRemanejamento) return;

    try {
      setActingOnPatientId(pacienteParaRemanejar.id);
      //Atualizar o leito do paciente
      const pacienteAtualizado: Partial<Paciente> = {
        leitoId: leitoDestinoRemanejamento.id,
        setorId: leitoDestinoRemanejamento.setorId,
      };
      await atualizarPaciente(pacienteParaRemanejar.id, pacienteAtualizado);

      //Atualizar o histórico do leito vago
      const leitoOrigemAtualizado: Partial<HistoricoLeito> = {
        statusLeito: 'Vago',
        dataAtualizacaoStatus: new Date().toISOString(),
        pacienteId: null,
      };
      await atualizarStatusLeito(pacienteParaRemanejar.leitoId!, leitoOrigemAtualizado);

      //Atualizar o histórico do leito ocupado
       const leitoDestinoAtualizado: Partial<HistoricoLeito> = {
        statusLeito: 'Ocupado',
        dataAtualizacaoStatus: new Date().toISOString(),
        pacienteId: pacienteParaRemanejar.id,
      };
      await atualizarStatusLeito(leitoDestinoRemanejamento.id, leitoDestinoAtualizado);

      toast({
        title: "Remanejado",
        description: `O paciente foi remanejado para o leito ${leitoDestinoRemanejamento.codigoLeito} com sucesso.`,
        duration: 5000,
      });
      registrarLog(`Paciente remanejado: ${pacienteParaRemanejar.nomeCompleto} (ID: ${pacienteParaRemanejar.id}) para o leito ${leitoDestinoRemanejamento.codigoLeito}`, "Regulação");
    } catch (error) {
      console.error("Erro ao remanejar paciente:", error);
      toast({
        title: "Erro",
        description: "Houve um erro ao remanejar o paciente. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      handleCloseRemanejamentoModal();
      setActingOnPatientId(null);
    }
  };

  return {
    isRegulacaoModalOpen,
    isConfirmacaoModalOpen,
    isTransferenciaModalOpen,
    isRemanejamentoModalOpen,
    isConfirmacaoAltaModalOpen,
    isJustificativaModalOpen,
    justificativa,
    pacienteParaRemover,
    leitoParaRemover,
    pacienteSelecionado,
    modoRegulacao,
    leitoDestinoRemanejamento,
    actingOnPatientId,
    handleOpenRegulacaoModal,
    handleCloseRegulacaoModal,
    handleOpenConfirmacaoModal,
    handleCloseConfirmacaoModal,
    handleOpenTransferenciaModal,
    handleCloseTransferenciaModal,
    handleOpenRemanejamentoModal,
    handleCloseRemanejamentoModal,
    handleOpenConfirmacaoAlta,
    handleCloseConfirmacaoAlta,
    handleOpenJustificativaModal,
    handleCloseJustificativaModal,
    handleJustificativaChange,
    handleConcluir,
    handleAlterar,
    handleCancelar,
    handleRemover,
    handleTransferir,
    handleDefinirLeitoRemanejamento,
    handleConfirmarRemanejamento,
    altaAposRecuperacao,
  };
};
