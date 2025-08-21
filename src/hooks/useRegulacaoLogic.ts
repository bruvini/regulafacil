import { useState, useEffect, useMemo } from 'react';
import { usePacientes } from './usePacientes';
import { useLeitos } from './useLeitos';
import { useSetores } from './useSetores';
import { useSolicitacoesCirurgicas } from './useSolicitacoesCirurgicas';
import { Paciente } from '@/types/hospital';
import { Regulacao } from './useRegulacoes';
import { useToast } from "@/hooks/use-toast"
import {
  TipoFiltro,
  StatusRegulacao,
  useFiltrosRegulacao,
  ConfiguracaoOrdenacao,
} from './useFiltrosRegulacao';
import {
  addDays,
  isWithinInterval,
  isPast,
  isToday,
  isTomorrow,
  isAfter,
  isBefore,
  parseISO,
  format,
} from 'date-fns';

// Definição de tipos para melhor organização e clareza
type LeitoExtendido = {
  id: string;
  codigoLeito: string;
  statusLeito: string;
  setorId: string;
  nomeSetor: string;
  siglaSetor: string;
  tipoLeito: string;
  leitoIsolamento: boolean;
  leitoPCP: boolean;
  nomePaciente?: string;
  dataInternacao?: string;
};

type Alerta = {
  tipo: 'internacaoProlongada' | 'altaProvavel';
  pacienteId: string;
  mensagem: string;
};

export const useRegulacaoLogic = () => {
  const { pacientes, loading: pacientesLoading } = usePacientes();
  const { leitos, loading: leitosLoading } = useLeitos();
  const { setores, loading: setoresLoading } = useSetores();
  const { solicitacoesCirurgicas, loading: cirurgiasLoading } = useSolicitacoesCirurgicas();
  const { toast } = useToast();

  // Estados locais para controlar a abertura dos modais
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [regulacaoModalOpen, setRegulacaoModalOpen] = useState(false);
  const [cancelamentoModalOpen, setCancelamentoModalOpen] = useState(false);
  const [transferenciaModalOpen, setTransferenciaModalOpen] = useState(false);
  const [alocacaoCirurgiaModalOpen, setAlocacaoCirurgiaModalOpen] = useState(false);
  const [gerenciarTransferenciaOpen, setGerenciarTransferenciaOpen] = useState(false);
  const [resumoModalOpen, setResumoModalOpen] = useState(false);
  const [sugestoesModalOpen, setSugestoesModalOpen] = useState(false);
  const [passagemPlantaoModalOpen, setPassagemPlantaoModalOpen] = useState(false);

  // Estado para armazenar o paciente que será regulado
  const [pacienteParaRegular, setPacienteParaRegular] = useState<Paciente | null>(null);
  const [pacienteParaAcao, setPacienteParaAcao] = useState<Paciente | null>(null);
  const [cirurgiaParaAlocar, setCirurgiaParaAlocar] = useState<any | null>(null);
  const [isAlteracaoMode, setIsAlteracaoMode] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [syncSummary, setSyncSummary] = useState<any | null>(null);
  const [modoRegulacao, setModoRegulacao] = useState<"normal" | "uti">("normal");
  const [actingOnPatientId, setActingOnPatientId] = useState<string | null>(null);

  const handleProcessFileRequest = (file: File) => {
    console.log('Arquivo recebido para processamento:', file);
    setImportModalOpen(false);
  };

  const handleConfirmSync = () => {
    console.log('Sincronização confirmada!');
    setImportModalOpen(false);
  };

  // Handlers para abrir os modais e passar os dados necessários
  const handleOpenRegulacaoModal = (paciente: Paciente, modo: "normal" | "uti" = "normal", isAlteracao = false) => {
    setPacienteParaRegular(paciente);
    setIsAlteracaoMode(isAlteracao);
    setModoRegulacao(modo);
    setRegulacaoModalOpen(true);
  };

  const handleConfirmarRegulacao = (leitoDestino: any, observacoes: string, motivoAlteracao?: string) => {
    console.log('Regulação confirmada para o leito:', leitoDestino, 'com observações:', observacoes, 'e motivo de alteração:', motivoAlteracao);
    setRegulacaoModalOpen(false);
  };

  const onConfirmarCancelamento = (motivo: string) => {
    console.log('Cancelamento confirmado com motivo:', motivo);
    setCancelamentoModalOpen(false);
  };

  const handleConcluir = (paciente: Paciente) => {
    console.log('Concluir para o paciente:', paciente);
    setActingOnPatientId(paciente.id);
    setTimeout(() => setActingOnPatientId(null), 3000);
  };

  const handleAlterar = (paciente: Paciente) => {
    console.log('Alterar para o paciente:', paciente);
    setActingOnPatientId(paciente.id);
    setTimeout(() => setActingOnPatientId(null), 3000);
  };

  const handleCancelar = (paciente: Paciente) => {
    console.log('Cancelar para o paciente:', paciente);
    setPacienteParaAcao(paciente);
    setCancelamentoModalOpen(true);
  };

  const handleIniciarTransferenciaExterna = (paciente: Paciente) => {
    console.log('Transferir externamente o paciente:', paciente);
    setPacienteParaAcao(paciente);
    setTransferenciaModalOpen(true);
  };

  const handleConfirmarTransferenciaExterna = (destino: string, motivo: string) => {
    console.log('Transferência externa confirmada para:', destino, 'com motivo:', motivo);
    setTransferenciaModalOpen(false);
  };

  const handleAlocarLeitoCirurgia = (cirurgia: any) => {
    console.log('Alocar leito para cirurgia:', cirurgia);
    setCirurgiaParaAlocar(cirurgia);
    setAlocacaoCirurgiaModalOpen(true);
  };

  const handleConfirmarAlocacaoCirurgia = (cirurgia: any, leito: any) => {
    console.log('Leito alocado para cirurgia:', cirurgia, 'no leito:', leito);
    setAlocacaoCirurgiaModalOpen(false);
  };

  const cancelarPedidoUTI = (paciente: Paciente) => {
     toast({
      title: "Sucesso",
      description: `Pedido de UTI cancelado para ${paciente.nomeCompleto}.`,
    })
  };

  const handleGerenciarTransferencia = (paciente: Paciente) => {
    console.log('Gerenciar transferência para o paciente:', paciente);
    setPacienteParaAcao(paciente);
    setGerenciarTransferenciaOpen(true);
  };

  const altaAposRecuperacao = (paciente: Paciente) => {
    console.log('Alta após recuperação para o paciente:', paciente);
    setActingOnPatientId(paciente.id);
    setTimeout(() => setActingOnPatientId(null), 3000);
  };

  const handleAbrirSugestoes = () => {
    console.log('Abrir sugestões de regulação');
    setSugestoesModalOpen(true);
  };

  const handlePassagemPlantao = () => {
    console.log('Abrir passagem de plantão');
    setPassagemPlantaoModalOpen(true);
  };

   const handleAltaDireta = (paciente: Paciente) => {
    console.log('Alta direta para o paciente:', paciente);
    setActingOnPatientId(paciente.id);
    setTimeout(() => setActingOnPatientId(null), 3000);
  };

  const handleCancelarRemanejamento = (paciente: Paciente) => {
    toast({
      title: "Sucesso",
      description: `Remanejamento cancelado para ${paciente.nomeCompleto}.`,
    })
  };

  const loading = pacientesLoading || leitosLoading || setoresLoading || cirurgiasLoading;

  const pacientesAtivos = useMemo(() => {
    return pacientes.filter(p => p.leitoId);
  }, [pacientes]);

  const leitosComDadosCompletos = useMemo(() => {
    if (!leitos.length || !setores.length) return [];

    const mapaSetores = new Map(setores.map(s => [s.id, s]));

    return leitos.map(l => {
      const setor = mapaSetores.get(l.setorId);
      return {
        ...l,
        nomeSetor: setor?.nomeSetor || 'N/A',
        siglaSetor: setor?.siglaSetor || 'N/A',
      };
    });
  }, [leitos, setores]);

  const leitosDisponiveis = useMemo(() => {
    return leitosComDadosCompletos.filter(leito => {
      const pacienteNoLeito = pacientesAtivos.find(paciente => paciente.leitoId === leito.id);
      return !pacienteNoLeito;
    });
  }, [leitosComDadosCompletos, pacientesAtivos]);

  const pacientesNoPS = useMemo(() => {
    return pacientesAtivos.filter(paciente => {
      const leitoDoPaciente = leitos.find(leito => leito.id === paciente.leitoId);
      return leitoDoPaciente && leitoDoPaciente.tipoLeito === 'PS';
    });
  }, [pacientesAtivos, leitos]);

  const pacientesAguardandoUTI = useMemo(() => {
    return pacientesAtivos.filter(paciente => paciente.aguardaUTI);
  }, [pacientesAtivos]);

  const pacientesAguardandoTransferencia = useMemo(() => {
    return pacientesAtivos.filter(paciente => paciente.transferirPaciente);
  }, [pacientesAtivos]);

  const pacientesAguardandoRemanejamento = useMemo(() => {
    return pacientesAtivos.filter(paciente => paciente.remanejarPaciente);
  }, [pacientesAtivos);

  const pacientesJaRegulados = useMemo(() => {
    return pacientesAtivos.filter(paciente => {
      const leito = leitos.find(l => l.id === paciente.leitoId);
      return leito && leito.historicoMovimentacao && leito.historicoMovimentacao.some(h => h.statusLeito === 'Regulado');
    });
  }, [pacientesAtivos, leitos]);

  const decisaoCirurgica = useMemo(() => {
    return pacientesNoPS.filter(paciente => paciente.especialidadePaciente === 'Cirúrgica');
  }, [pacientesNoPS]);

  const decisaoClinica = useMemo(() => {
    return pacientesNoPS.filter(paciente => paciente.especialidadePaciente !== 'Cirúrgica');
  }, [pacientesNoPS]);

  const recuperacaoCirurgica = useMemo(() => {
    return pacientesAtivos.filter(paciente => {
      const leito = leitos.find(l => l.id === paciente.leitoId);
      return leito && leito.tipoLeito === 'RECUPERACAO CIRURGICA';
    });
  }, [pacientesAtivos, leitos]);

  const totalPendentes = useMemo(() => {
    return decisaoCirurgica.length + decisaoClinica.length + recuperacaoCirurgica.length;
  }, [decisaoCirurgica, decisaoClinica, recuperacaoCirurgica]);

  const alertas: Alerta[] = useMemo(() => {
    const alertasInternacaoProlongada: Alerta[] = pacientesAtivos
      .filter(paciente => {
        const dataInternacao = paciente.dataInternacao ? parseISO(paciente.dataInternacao) : null;
        if (!dataInternacao) return false;
        const diasInternado = addDays(dataInternacao, 7);
        return isPast(diasInternado);
      })
      .map(paciente => ({
        tipo: 'internacaoProlongada',
        pacienteId: paciente.id,
        mensagem: `Paciente ${paciente.nomeCompleto} está internado há mais de 7 dias.`,
      }));

    const alertasAltaProvavel: Alerta[] = pacientesAtivos
      .filter(paciente => paciente.provavelAlta)
      .map(paciente => ({
        tipo: 'altaProvavel',
        pacienteId: paciente.id,
        mensagem: `Paciente ${paciente.nomeCompleto} tem alta provável.`,
      }));

    return [...alertasInternacaoProlongada, ...alertasAltaProvavel];
  }, [pacientesAtivos]);

  const sugestoesDeRegulacao = useMemo(() => {
    return pacientesAtivos.map(paciente => ({
      pacienteId: paciente.id,
      mensagem: `Sugestão de regulação para o paciente ${paciente.nomeCompleto}.`,
    }));
  }, [pacientesAtivos]);

  const cirurgias = useMemo(() => {
    return solicitacoesCirurgicas.filter(cirurgia => !cirurgia.leitoReservado);
  }, [solicitacoesCirurgicas]);

  const filtrosProps = useFiltrosRegulacao();

  const setoresComContadores = useMemo(() => {
    if (!setores.length || !pacientesAtivos.length) return [];

    return setores.map(setor => {
      const pacientesDoSetor = pacientesAtivos.filter(p => {
        const leitoAtual = leitos.find(l => l.id === p.leitoId);
        return leitoAtual?.setorId === setor.id;
      });

      const leitosDoSetor = leitos.filter(l => l.setorId === setor.id);

      return {
        ...setor,
        contadorPacientes: pacientesDoSetor.length,
        contadorLeitos: leitosDoSetor.length,
      };
    });
  }, [setores, pacientesAtivos, leitos]);

  return {
    loading,
    listas: {
      decisaoCirurgica,
      decisaoClinica,
      recuperacaoCirurgica,
      totalPendentes,
      pacientesJaRegulados,
      pacientesAguardandoUTI,
      pacientesAguardandoTransferencia,
      cirurgias,
      pacientesAguardandoRemanejamento,
      sugestoesDeRegulacao,
      alertas,
    },
    modals: {
      importModalOpen,
      regulacaoModalOpen,
      cancelamentoModalOpen,
      transferenciaModalOpen,
      alocacaoCirurgiaModalOpen,
      gerenciarTransferenciaOpen,
      resumoModalOpen,
      sugestoesModalOpen,
      passagemPlantaoModalOpen,
      pacienteParaRegular,
      pacienteParaAcao,
      cirurgiaParaAlocar,
      isAlteracaoMode,
      validationResult,
      syncSummary,
      modoRegulacao,
      actingOnPatientId,
    },
    handlers: {
      handleProcessFileRequest,
      handleConfirmSync,
      handleOpenRegulacaoModal,
      handleConfirmarRegulacao,
      onConfirmarCancelamento,
      handleConcluir,
      handleAlterar,
      handleCancelar,
      handleIniciarTransferenciaExterna,
      handleConfirmarTransferenciaExterna,
      handleAlocarLeitoCirurgia,
      handleConfirmarAlocacaoCirurgia,
      cancelarPedidoUTI,
      handleGerenciarTransferencia,
      altaAposRecuperacao,
      handleAbrirSugestoes,
      handlePassagemPlantao,
      handleAltaDireta,
      handleCancelarRemanejamento,
      setImportModalOpen,
      setRegulacaoModalOpen,
      setCancelamentoModalOpen,
      setTransferenciaModalOpen,
      setAlocacaoCirurgiaModalOpen,
      setGerenciarTransferenciaOpen,
      setResumoModalOpen,
      setSugestoesModalOpen,
      setPassagemPlantaoModalOpen,
    },
    filtrosProps,
  };
};
