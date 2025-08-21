
import { useState, useCallback, useMemo } from 'react';
import { usePacientes } from './usePacientes';
import { useLeitos } from './useLeitos';
import { useSetores } from './useSetores';
import { useLeitoFinder } from './useLeitoFinder';
import { useRegulacoes } from './useRegulacoes';
import { useFiltrosRegulacao } from './useFiltrosRegulacao';
import { toast } from '@/hooks/use-toast';
import { Paciente, DadosPaciente } from '@/types/hospital';

export const useRegulacaoLogic = () => {
  const { pacientes, loading: loadingPacientes, importarPacientesDaPlanilha } = usePacientes();
  const { leitos, loading: loadingLeitos } = useLeitos();
  const { setores, loading: loadingSetores } = useSetores();
  const { findAvailableLeitos, generateSugestoes } = useLeitoFinder();
  const { regulacoes } = useRegulacoes();
  const filtrosProps = useFiltrosRegulacao(pacientes);

  // Modal states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [regulacaoModalOpen, setRegulacaoModalOpen] = useState(false);
  const [cancelamentoModalOpen, setCancelamentoModalOpen] = useState(false);
  const [transferenciaModalOpen, setTransferenciaModalOpen] = useState(false);
  const [alocacaoCirurgiaModalOpen, setAlocacaoCirurgiaModalOpen] = useState(false);
  const [gerenciarTransferenciaOpen, setGerenciarTransferenciaOpen] = useState(false);
  const [resumoModalOpen, setResumoModalOpen] = useState(false);
  const [sugestoesModalOpen, setSugestoesModalOpen] = useState(false);
  
  // Selected data states
  const [pacienteParaRegular, setPacienteParaRegular] = useState<Paciente | null>(null);
  const [pacienteParaAcao, setPacienteParaAcao] = useState<Paciente | null>(null);
  const [cirurgiaParaAlocar, setCirurgiaParaAlocar] = useState<any>(null);
  const [isAlteracaoMode, setIsAlteracaoMode] = useState(false);
  const [modoRegulacao, setModoRegulacao] = useState<'normal' | 'uti'>('normal');
  const [actingOnPatientId, setActingOnPatientId] = useState<string | null>(null);

  // Validation and sync states
  const [validationResult, setValidationResult] = useState<any>(null);
  const [syncSummary, setSyncSummary] = useState<any>(null);

  const loading = loadingPacientes || loadingLeitos || loadingSetores;

  // Computed lists based on pacientes data
  const listas = useMemo(() => {
    const decisaoCirurgica = pacientes.filter(p => 
      p.setorAtual === 'PS DECISÃO CIRURGICA' && !p.leitoId
    );
    
    const decisaoClinica = pacientes.filter(p => 
      p.setorAtual === 'PS DECISÃO CLINICA' && !p.leitoId
    );
    
    const recuperacaoCirurgica = pacientes.filter(p => 
      p.setorAtual === 'CC - RECUPERAÇÃO' && !p.leitoId
    );
    
    const pacientesJaRegulados = pacientes.filter(p => 
      p.leitoId && p.regulacao
    );
    
    const pacientesAguardandoUTI = pacientes.filter(p => 
      p.aguardaUTI
    );
    
    const pacientesAguardandoTransferencia = pacientes.filter(p => 
      p.transferirPaciente
    );
    
    const pacientesAguardandoRemanejamento = pacientes.filter(p => 
      p.remanejarPaciente
    );
    
    const cirurgias = []; // TODO: Implement cirurgias logic
    
    const sugestoesDeRegulacao = generateSugestoes(
      [...decisaoCirurgica, ...decisaoClinica, ...recuperacaoCirurgica]
    );
    
    const totalPendentes = decisaoCirurgica.length + decisaoClinica.length + recuperacaoCirurgica.length;

    return {
      decisaoCirurgica,
      decisaoClinica,
      recuperacaoCirurgica,
      pacientesJaRegulados,
      pacientesAguardandoUTI,
      pacientesAguardandoTransferencia,
      pacientesAguardandoRemanejamento,
      cirurgias,
      sugestoesDeRegulacao,
      totalPendentes
    };
  }, [pacientes, generateSugestoes]);

  // Handlers
  const handleOpenRegulacaoModal = useCallback((paciente: Paciente, modo: 'normal' | 'uti' = 'normal') => {
    setPacienteParaRegular(paciente);
    setModoRegulacao(modo);
    setRegulacaoModalOpen(true);
  }, []);

  const handleConcluir = useCallback((paciente: Paciente) => {
    setPacienteParaAcao(paciente);
    setActingOnPatientId(paciente.id);
    // TODO: Implement conclude logic
  }, []);

  const handleAlterar = useCallback((paciente: Paciente) => {
    setPacienteParaRegular(paciente);
    setIsAlteracaoMode(true);
    setRegulacaoModalOpen(true);
  }, []);

  const handleCancelar = useCallback((paciente: Paciente) => {
    setPacienteParaAcao(paciente);
    setCancelamentoModalOpen(true);
  }, []);

  const altaAposRecuperacao = useCallback((leitoId: string) => {
    // TODO: Implement alta logic
    console.log('Alta após recuperação:', leitoId);
  }, []);

  const handleAltaDireta = useCallback((paciente: Paciente) => {
    // TODO: Implement alta direta logic
    console.log('Alta direta:', paciente.id);
  }, []);

  const cancelarPedidoUTI = useCallback((paciente: Paciente) => {
    // TODO: Implement cancel UTI request
    console.log('Cancelar UTI:', paciente.id);
  }, []);

  const handleIniciarTransferenciaExterna = useCallback((paciente: Paciente) => {
    setPacienteParaAcao(paciente);
    setTransferenciaModalOpen(true);
  }, []);

  const handleGerenciarTransferencia = useCallback((paciente: Paciente) => {
    setPacienteParaAcao(paciente);
    setGerenciarTransferenciaOpen(true);
  }, []);

  const handleAlocarLeitoCirurgia = useCallback((cirurgia: any) => {
    setCirurgiaParaAlocar(cirurgia);
    setAlocacaoCirurgiaModalOpen(true);
  }, []);

  const handleCancelarRemanejamento = useCallback((paciente: Paciente) => {
    // TODO: Implement cancel remanejamento
    console.log('Cancelar remanejamento:', paciente.id);
  }, []);

  const handleAbrirSugestoes = useCallback(() => {
    setSugestoesModalOpen(true);
  }, []);

  const handleProcessFileRequest = useCallback(async (file: File) => {
    try {
      // TODO: Process file and convert to appropriate format
      const dadosImportacao = []; // Convert file to data array
      const resumo = await importarPacientesDaPlanilha(dadosImportacao);
      
      const totalProcessados = resumo.pacientesProcessados || 0;
      const totalErros = resumo.pacientesComErro || 0;
      
      toast({
        title: "Importação Concluída",
        description: `${totalProcessados} registros processados com sucesso. ${totalErros} erros encontrados.`,
      });
      
      setValidationResult({ success: true, message: "Importação realizada com sucesso" });
      setSyncSummary({ created: totalProcessados, updated: totalErros });
      
      return resumo;
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na Importação",
        description: "Não foi possível processar os dados importados.",
        variant: "destructive",
      });
      throw error;
    }
  }, [importarPacientesDaPlanilha]);

  const handleConfirmSync = useCallback(() => {
    // TODO: Implement sync confirmation logic
    console.log('Sync confirmed');
  }, []);

  const handleConfirmarRegulacao = useCallback(() => {
    // TODO: Implement regulation confirmation logic
    console.log('Regulação confirmada');
    setRegulacaoModalOpen(false);
  }, []);

  const onConfirmarCancelamento = useCallback(() => {
    // TODO: Implement cancellation confirmation logic
    console.log('Cancelamento confirmado');
    setCancelamentoModalOpen(false);
  }, []);

  const handleConfirmarTransferenciaExterna = useCallback(() => {
    // TODO: Implement external transfer confirmation logic
    console.log('Transferência externa confirmada');
    setTransferenciaModalOpen(false);
  }, []);

  const handleConfirmarAlocacaoCirurgia = useCallback(() => {
    // TODO: Implement surgery allocation confirmation logic
    console.log('Alocação de cirurgia confirmada');
    setAlocacaoCirurgiaModalOpen(false);
  }, []);

  const modals = {
    importModalOpen,
    regulacaoModalOpen,
    cancelamentoModalOpen,
    transferenciaModalOpen,
    alocacaoCirurgiaModalOpen,
    gerenciarTransferenciaOpen,
    resumoModalOpen,
    sugestoesModalOpen,
    pacienteParaRegular,
    pacienteParaAcao,
    cirurgiaParaAlocar,
    isAlteracaoMode,
    validationResult,
    syncSummary,
    modoRegulacao,
    actingOnPatientId
  };

  const handlers = {
    handleOpenRegulacaoModal,
    handleConcluir,
    handleAlterar,
    handleCancelar,
    altaAposRecuperacao,
    handleAltaDireta,
    cancelarPedidoUTI,
    handleIniciarTransferenciaExterna,
    handleGerenciarTransferencia,
    handleAlocarLeitoCirurgia,
    handleCancelarRemanejamento,
    handleAbrirSugestoes,
    handleProcessFileRequest,
    handleConfirmSync,
    handleConfirmarRegulacao,
    onConfirmarCancelamento,
    handleConfirmarTransferenciaExterna,
    handleConfirmarAlocacaoCirurgia,
    setImportModalOpen,
    setRegulacaoModalOpen,
    setCancelamentoModalOpen,
    setTransferenciaModalOpen,
    setAlocacaoCirurgiaModalOpen,
    setGerenciarTransferenciaOpen,
    setResumoModalOpen,
    setSugestoesModalOpen
  };

  return {
    loading,
    listas,
    modals,
    handlers,
    filtrosProps
  };
};
