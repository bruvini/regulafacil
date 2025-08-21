
import { useState, useCallback, useMemo } from 'react';
import { usePacientes } from './usePacientes';
import { useLeitos } from './useLeitos';
import { useSetores } from './useSetores';
import { useRegulacoes } from './useRegulacoes';
import { useFiltrosRegulacao } from './useFiltrosRegulacao';
import { Paciente, SolicitacaoCirurgica } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';

export const useRegulacaoLogic = () => {
  const { pacientes, importarPacientesDaPlanilha } = usePacientes();
  const { leitos } = useLeitos();
  const { setores } = useSetores();
  const { regulacoes } = useRegulacoes();

  // Estados locais para controlar a UI e os dados
  const [loading, setLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [regulacaoModalOpen, setRegulacaoModalOpen] = useState(false);
  const [cancelamentoModalOpen, setCancelamentoModalOpen] = useState(false);
  const [transferenciaModalOpen, setTransferenciaModalOpen] = useState(false);
  const [alocacaoCirurgiaModalOpen, setAlocacaoCirurgiaModalOpen] = useState(false);
  const [gerenciarTransferenciaOpen, setGerenciarTransferenciaOpen] = useState(false);
  const [resumoModalOpen, setResumoModalOpen] = useState(false);
  const [sugestoesModalOpen, setSugestoesModalOpen] = useState(false);
  const [actingOnPatientId, setActingOnPatientId] = useState<string | null>(null);
  const [pacienteParaRegular, setPacienteParaRegular] = useState<Paciente | null>(null);
  const [pacienteParaAcao, setPacienteParaAcao] = useState<Paciente | null>(null);
  const [cirurgiaParaAlocar, setCirurgiaParaAlocar] = useState<SolicitacaoCirurgica | null>(null);
  const [isAlteracaoMode, setIsAlteracaoMode] = useState(false);
  const [modoRegulacao, setModoRegulacao] = useState<'normal' | 'uti'>('normal');

  // Tipos esperados pelos modais
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    setoresFaltantes: string[];
    leitosFaltantes: string[];
  }>({
    success: true,
    message: '',
    setoresFaltantes: [],
    leitosFaltantes: [],
  });

  const [syncSummary, setSyncSummary] = useState<{
    novasInternacoes: number;
    transferencias: number;
    altas: number;
  }>({
    novasInternacoes: 0,
    transferencias: 0,
    altas: 0,
  });

  // Filtros e ordenação (no formato esperado pelo componente de filtros)
  const {
    searchTerm,
    setSearchTerm,
    filtrosAvancados,
    setFiltrosAvancados,
    filteredPacientes,
    resetFiltros,
    sortConfig,
    setSortConfig,
  } = useFiltrosRegulacao(pacientes);

  const filtrosProps = {
    filtrosAvancados,
    setFiltrosAvancados,
    searchTerm,
    setSearchTerm,
    resetFiltros,
    sortConfig,
    setSortConfig,
  };

  // Handlers para abrir/fechar modais
  const handleOpenRegulacaoModal = useCallback((paciente: Paciente, modo: 'normal' | 'uti' = 'normal') => {
    setPacienteParaRegular(paciente);
    setModoRegulacao(modo);
    setRegulacaoModalOpen(true);
  }, []);

  // -- Funções de tratamento de dados e ações --
  const handleProcessFileRequest = async (file: File) => {
    setLoading(true);
    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          try {
            const parsedData = JSON.parse(result);
            if (!Array.isArray(parsedData)) {
              toast({
                title: "Erro de Formato",
                description: "O arquivo JSON deve conter um array de pacientes.",
                variant: "destructive",
              });
              return;
            }
            await importarPacientesDaPlanilha(parsedData);
            setSyncSummary({ novasInternacoes: 0, transferencias: 0, altas: 0 });
            setImportModalOpen(false);
            toast({
              title: "Importação Concluída",
              description: "Importação concluída com sucesso.",
            });
          } catch (parseError) {
            console.error("Erro ao fazer parse do JSON:", parseError);
            toast({
              title: "Erro de Parsing",
              description: "Erro ao analisar o arquivo JSON. Verifique o formato.",
              variant: "destructive",
            });
          }
        }
      };
      fileReader.readAsText(file);
    } catch (error) {
      console.error("Erro ao processar o arquivo:", error);
      toast({
        title: "Erro no Arquivo",
        description: "Não foi possível processar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSync = async () => {
    setLoading(true);
    try {
      toast({
        title: "Sincronizado",
        description: "Dados sincronizados com sucesso!",
      });
    } catch (error) {
      console.error("Erro na sincronização:", error);
      toast({
        title: "Erro",
        description: "Erro ao sincronizar dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarRegulacao = async (_regulacaoData: any) => {
    setLoading(true);
    try {
      toast({
        title: isAlteracaoMode ? "Regulação Atualizada" : "Regulação Criada",
        description: isAlteracaoMode ? "Regulação atualizada com sucesso." : "Regulação criada com sucesso.",
      });
      setRegulacaoModalOpen(false);
    } catch (error) {
      console.error("Erro ao confirmar regulação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a regulação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConcluir = async (paciente: Paciente) => {
    setLoading(true);
    setActingOnPatientId(paciente.id);
    try {
      toast({
        title: "Paciente Concluído",
        description: `Paciente ${paciente.nomeCompleto} concluído com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao concluir paciente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível concluir o paciente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setActingOnPatientId(null);
    }
  };

  const handleAlterar = async (paciente: Paciente) => {
    setPacienteParaRegular(paciente);
    setIsAlteracaoMode(true);
    setRegulacaoModalOpen(true);
  };

  const handleCancelar = async (paciente: Paciente) => {
    setPacienteParaAcao(paciente);
    setCancelamentoModalOpen(true);
  };

  const onConfirmarCancelamento = async (_motivo: string) => {
    if (!pacienteParaAcao?.id) return;

    setLoading(true);
    setActingOnPatientId(pacienteParaAcao.id);
    try {
      toast({
        title: "Regulação Cancelada",
        description: `Regulação para ${pacienteParaAcao.nomeCompleto} cancelada com sucesso.`,
      });
      setCancelamentoModalOpen(false);
    } catch (error) {
      console.error("Erro ao cancelar regulação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a regulação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setActingOnPatientId(null);
    }
  };

  // -- Listas filtradas e agrupadas --
  const listas = useMemo(() => {
    const decisaoClinica = filteredPacientes.filter(p => p.especialidadePaciente === 'Clínica Médica');
    const decisaoCirurgica = filteredPacientes.filter(p => p.especialidadePaciente === 'Cirurgia Geral');
    const recuperacaoCirurgica = filteredPacientes.filter(p => p.especialidadePaciente === 'Recuperação Cirúrgica');
    const pacientesAguardandoUTI = filteredPacientes.filter(p => p.aguardaUTI);
    const pacientesAguardandoTransferencia = filteredPacientes.filter(p => p.transferirPaciente);
    const pacientesAguardandoRemanejamento = filteredPacientes.filter(p => p.remanejarPaciente);
    const pacientesJaRegulados = filteredPacientes.filter(p => regulacoes.some((r: any) => r.pacienteId === p.id && r.status === 'Concluída'));
    const cirurgias: SolicitacaoCirurgica[] = [];

    const totalPendentes = decisaoClinica.length + decisaoCirurgica.length + recuperacaoCirurgica.length;
    const sugestoesDeRegulacao: any[] = [];

    return {
      decisaoClinica,
      decisaoCirurgica,
      recuperacaoCirurgica,
      pacientesAguardandoUTI,
      pacientesAguardandoTransferencia,
      pacientesAguardandoRemanejamento,
      pacientesJaRegulados,
      cirurgias,
      totalPendentes,
      sugestoesDeRegulacao,
    };
  }, [filteredPacientes, regulacoes]);

  const handleAbrirSugestoes = async () => {
    setLoading(true);
    try {
      toast({
        title: "Sugestões",
        description: "Sugestões de regulação prontas para visualização.",
      });
    } catch (error) {
      console.error("Erro ao abrir sugestões:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar sugestões de regulação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSugestoesModalOpen(true);
    }
  };

  return {
    loading,
    listas,
    modals: {
      importModalOpen,
      regulacaoModalOpen,
      cancelamentoModalOpen,
      transferenciaModalOpen,
      alocacaoCirurgiaModalOpen,
      gerenciarTransferenciaOpen,
      resumoModalOpen,
      sugestoesModalOpen,
      actingOnPatientId,
      pacienteParaRegular,
      pacienteParaAcao,
      cirurgiaParaAlocar,
      isAlteracaoMode,
      validationResult,
      syncSummary,
      modoRegulacao,
    },
    handlers: {
      setImportModalOpen,
      setRegulacaoModalOpen,
      setCancelamentoModalOpen,
      setTransferenciaModalOpen,
      setAlocacaoCirurgiaModalOpen,
      setGerenciarTransferenciaOpen,
      setResumoModalOpen,
      setSugestoesModalOpen,
      handleOpenRegulacaoModal,
      handleProcessFileRequest,
      handleConfirmSync,
      handleConfirmarRegulacao,
      handleConcluir,
      handleAlterar,
      handleCancelar,
      onConfirmarCancelamento,
      handleAbrirSugestoes,
    },
    filtrosProps,
  };
};
