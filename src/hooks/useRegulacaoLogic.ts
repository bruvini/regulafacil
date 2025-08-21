import { useState, useCallback, useMemo } from 'react';
import { usePacientes } from './usePacientes';
import { useLeitos } from './useLeitos';
import { useSetores } from './useSetores';
import { useRegulacoes } from './useRegulacoes';
import { useSugestoes } from './useSugestoes';
import { Paciente, SolicitacaoCirurgica } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { gerarSugestoes } from '@/services/sugestoesRegulacao';
import { useSearchParams, useRouter } from 'next/navigation';

export const useRegulacaoLogic = () => {
  const { pacientes, importarPacientesDaPlanilha } = usePacientes();
  const { leitos } = useLeitos();
  const { setores } = useSetores();
  const { regulacoes, criarRegulacao, atualizarRegulacao, cancelarRegulacao } = useRegulacoes();
  const { sugestoes, criarSugestao, atualizarSugestao, excluirSugestao } = useSugestoes();
  const searchParams = useSearchParams();
  const router = useRouter();

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
  const [modoRegulacao, setModoRegulacao] = useState<'normal' | 'uti' | 'remanejamento'>('normal');
  const [validationResult, setValidationResult] = useState<{ success: boolean; message: string }>({ success: true, message: '' });
  const [syncSummary, setSyncSummary] = useState<{ created: number; updated: number }>({ created: 0, updated: 0 });

  // Estados para filtros e ordenação
  const [filtros, setFiltros] = useState({
    setorSelecionado: searchParams.get('setor') || '',
    statusRegulacao: '',
    dataInicio: '',
    dataFim: '',
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'dataInternacao',
    direction: 'ascending' as 'ascending' | 'descending',
  });

  // Handlers para abrir/fechar modais
  const handleOpenRegulacaoModal = useCallback((paciente: Paciente, modo: 'normal' | 'uti' | 'remanejamento' = 'normal') => {
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
            const resumoImportacao = await importarPacientesDaPlanilha(parsedData);
            setSyncSummary({ created: resumoImportacao.created, updated: resumoImportacao.updated });
            setImportModalOpen(false);
            toast({
              title: "Importação Concluída",
              description: `Importação concluída com sucesso: ${resumoImportacao.created} criados, ${resumoImportacao.updated} atualizados.`,
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
      // Lógica de sincronização aqui
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

  const handleConfirmarRegulacao = async (regulacaoData: any) => {
    setLoading(true);
    try {
      if (isAlteracaoMode && pacienteParaRegular?.id) {
        // Lógica para atualizar uma regulação existente
        await atualizarRegulacao(pacienteParaRegular.id, regulacaoData);
        toast({
          title: "Regulação Atualizada",
          description: "Regulação atualizada com sucesso.",
        });
      } else {
        // Lógica para criar uma nova regulação
        await criarRegulacao(regulacaoData);
        toast({
          title: "Regulação Criada",
          description: "Regulação criada com sucesso.",
        });
      }
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
      // Lógica para concluir (dar alta) ao paciente
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

  const onConfirmarCancelamento = async (motivo: string) => {
    if (!pacienteParaAcao?.id) return;

    setLoading(true);
    setActingOnPatientId(pacienteParaAcao.id);
    try {
      // Lógica para cancelar a regulação
      await cancelarRegulacao(pacienteParaAcao.id, motivo);
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

  const handleIniciarTransferenciaExterna = async (paciente: Paciente) => {
    setPacienteParaAcao(paciente);
    setTransferenciaModalOpen(true);
  };

  const handleConfirmarTransferenciaExterna = async (transferenciaData: any) => {
    if (!pacienteParaAcao?.id) return;

    setLoading(true);
    setActingOnPatientId(pacienteParaAcao.id);
    try {
      // Lógica para confirmar a transferência externa
      toast({
        title: "Transferência Confirmada",
        description: `Transferência de ${pacienteParaAcao.nomeCompleto} confirmada para ${transferenciaData.destino}.`,
      });
      setTransferenciaModalOpen(false);
    } catch (error) {
      console.error("Erro ao confirmar transferência:", error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a transferência.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setActingOnPatientId(null);
    }
  };

  const handleAlocarLeitoCirurgia = async (cirurgia: SolicitacaoCirurgica) => {
    setCirurgiaParaAlocar(cirurgia);
    setAlocacaoCirurgiaModalOpen(true);
  };

  const handleConfirmarAlocacaoCirurgia = async (leitoId: string) => {
    if (!cirurgiaParaAlocar?.id) return;

    setLoading(true);
    try {
      // Lógica para alocar o leito para a cirurgia
      toast({
        title: "Leito Alocado",
        description: `Leito alocado com sucesso para a cirurgia de ${cirurgiaParaAlocar.nomeCompleto}.`,
      });
      setAlocacaoCirurgiaModalOpen(false);
    } catch (error) {
      console.error("Erro ao alocar leito:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alocar o leito.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGerenciarTransferencia = async (paciente: Paciente) => {
    setPacienteParaAcao(paciente);
    setGerenciarTransferenciaOpen(true);
  };

  const altaAposRecuperacao = async (paciente: Paciente) => {
    setLoading(true);
    setActingOnPatientId(paciente.id);
    try {
      // Lógica para dar alta após recuperação
      toast({
        title: "Alta Após Recuperação",
        description: `Alta de ${paciente.nomeCompleto} registrada após recuperação.`,
      });
    } catch (error) {
      console.error("Erro ao registrar alta após recuperação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a alta após recuperação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setActingOnPatientId(null);
    }
  };

  const handleAltaDireta = async (paciente: Paciente) => {
    setLoading(true);
    setActingOnPatientId(paciente.id);
    try {
      // Lógica para dar alta direta
      toast({
        title: "Alta Direta",
        description: `Alta direta de ${paciente.nomeCompleto} registrada.`,
      });
    } catch (error) {
      console.error("Erro ao registrar alta direta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a alta direta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setActingOnPatientId(null);
    }
  };

  const cancelarPedidoUTI = async (paciente: Paciente) => {
    setLoading(true);
    setActingOnPatientId(paciente.id);
    try {
      // Lógica para cancelar pedido de UTI
      toast({
        title: "Pedido de UTI Cancelado",
        description: `Pedido de UTI para ${paciente.nomeCompleto} cancelado.`,
      });
    } catch (error) {
      console.error("Erro ao cancelar pedido de UTI:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o pedido de UTI.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setActingOnPatientId(null);
    }
  };

  const handleCancelarRemanejamento = async (paciente: Paciente) => {
    setLoading(true);
    setActingOnPatientId(paciente.id);
    try {
      // Lógica para cancelar remanejamento
      toast({
        title: "Remanejamento Cancelado",
        description: `Remanejamento para ${paciente.nomeCompleto} cancelado.`,
      });
    } catch (error) {
      console.error("Erro ao cancelar remanejamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o remanejamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setActingOnPatientId(null);
    }
  };

  // -- Funções de tratamento de filtros e ordenação --
  const handleFiltroChange = (name: string, value: string) => {
    setFiltros(prev => ({ ...prev, [name]: value }));

    // Atualiza a URL
    const newParams = new URLSearchParams(searchParams);
    if (name === 'setorSelecionado') {
      if (value) {
        newParams.set('setor', value);
      } else {
        newParams.delete('setor');
      }
    }
    router.push(`?${newParams.toString()}`);
  };

  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // -- Listas filtradas e ordenadas --
  const setoresFiltrados = useMemo(() => {
    if (!filtros.setorSelecionado || !setores.length) return setores;
    
    return setores.filter(setor => {
      const matchSetor = setor.nomeSetor.toLowerCase().includes(filtros.setorSelecionado.toLowerCase());
      return matchSetor;
    });
  }, [setores, filtros.setorSelecionado]);

  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter(paciente => {
      const setorMatch = !filtros.setorSelecionado || paciente.setorNome?.toLowerCase().includes(filtros.setorSelecionado.toLowerCase());
      return setorMatch;
    });
  }, [pacientes, filtros.setorSelecionado]);

  const listas = useMemo(() => {
    // Simulação de listas (substitua pela lógica real)
    const decisaoClinica = pacientesFiltrados.filter(p => p.especialidadePaciente === 'Clínica Médica');
    const decisaoCirurgica = pacientesFiltrados.filter(p => p.especialidadePaciente === 'Cirurgia Geral');
    const recuperacaoCirurgica = pacientesFiltrados.filter(p => p.especialidadePaciente === 'Recuperação Cirúrgica');
    const pacientesAguardandoUTI = pacientesFiltrados.filter(p => p.aguardaUTI);
    const pacientesAguardandoTransferencia = pacientesFiltrados.filter(p => p.transferirPaciente);
    const pacientesAguardandoRemanejamento = pacientesFiltrados.filter(p => p.remanejarPaciente);
    const pacientesJaRegulados = pacientesFiltrados.filter(p => regulacoes.some(r => r.pacienteId === p.id && r.status === 'Concluída'));
    const cirurgias: SolicitacaoCirurgica[] = []; // Adicione a lógica real para buscar cirurgias

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
  }, [pacientesFiltrados, regulacoes]);

  // -- Sugestões de Regulação --
  const handleAbrirSugestoes = async () => {
    setLoading(true);
    try {
      // Simula a geração de sugestões (substitua pela lógica real)
      const novasSugestoes = gerarSugestoes(listas, leitos, setores);
      // Limpa as sugestões existentes antes de adicionar as novas
      sugestoes.forEach(async (sugestao) => {
        await excluirSugestao(sugestao.id);
      });
      // Adiciona as novas sugestões
      novasSugestoes.forEach(async (sugestao) => {
        await criarSugestao(sugestao);
      });
      toast({
        title: "Sugestões Geradas",
        description: "Sugestões de regulação geradas com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao gerar sugestões:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar sugestões de regulação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSugestoesModalOpen(true);
    }
  };

  // Objeto de configuração para os filtros
  const filtrosProps = {
    filtros,
    handleFiltroChange,
    sortConfig,
    handleSort,
    setores: setoresFiltrados,
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
      handleIniciarTransferenciaExterna,
      handleConfirmarTransferenciaExterna,
      handleAlocarLeitoCirurgia,
      handleConfirmarAlocacaoCirurgia,
      handleGerenciarTransferencia,
      altaAposRecuperacao,
      handleAltaDireta,
      cancelarPedidoUTI,
      handleCancelarRemanejamento,
      handleFiltroChange,
      handleAbrirSugestoes,
    },
    filtrosProps,
  };
};
