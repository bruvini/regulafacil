
import { useState, useCallback, useMemo } from 'react';
import { usePacientes } from './usePacientes';
import { useRegulacoes } from './useRegulacoes';
import { useFiltrosRegulacao } from './useFiltrosRegulacao';
import { useCirurgias } from './useCirurgias';
import { useAuditoria } from './useAuditoria';
import { useToast } from '@/hooks/use-toast';
import { Paciente } from '@/types/hospital';

export const useRegulacaoLogic = () => {
  const { pacientes, loading: loadingPacientes } = usePacientes();
  const { regulacoes, criarRegulacao, loading: loadingRegulacoes } = useRegulacoes();
  const { cirurgias } = useCirurgias();
  const { registrarLog } = useAuditoria();
  const { toast } = useToast();
  const { filtros } = useFiltrosRegulacao();

  // Estados dos modais
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [regulacaoModalOpen, setRegulacaoModalOpen] = useState(false);
  const [cancelamentoModalOpen, setCancelamentoModalOpen] = useState(false);
  const [transferenciaModalOpen, setTransferenciaModalOpen] = useState(false);
  const [alocacaoCirurgiaModalOpen, setAlocacaoCirurgiaModalOpen] = useState(false);
  const [gerenciarTransferenciaOpen, setGerenciarTransferenciaOpen] = useState(false);
  const [resumoModalOpen, setResumoModalOpen] = useState(false);
  const [sugestoesModalOpen, setSugestoesModalOpen] = useState(false);
  const [justificativaHomonimoOpen, setJustificativaHomonimoOpen] = useState(false);

  // Dados dos modais
  const [pacienteParaRegular, setPacienteParaRegular] = useState<Paciente | null>(null);
  const [pacienteParaAcao, setPacienteParaAcao] = useState<any>(null);
  const [cirurgiaParaAlocar, setCirurgiaParaAlocar] = useState<any>(null);
  const [isAlteracaoMode, setIsAlteracaoMode] = useState(false);
  const [modoRegulacao, setModoRegulacao] = useState<'normal' | 'uti'>('normal');
  const [leitoComHomonimo, setLeitoComHomonimo] = useState<any>(null);

  // Estados de processamento
  const [processing, setProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [syncSummary, setSyncSummary] = useState<any>(null);

  // Estados de resultados
  const [pacientesRegulados, setPacientesRegulados] = useState<any[]>([]);
  const [sugestoes, setSugestoes] = useState<any[]>([]);

  // Listas derivadas
  const listas = useMemo(() => {
    const aguardandoUTI = pacientes.filter(p => p.aguardaUTI);
    
    const aguardandoTransferencia = pacientes.filter(p => 
      p.transferirPaciente && p.destinoTransferencia && p.motivoTransferencia
    );
    
    const pendentesRemanejamento = pacientes.filter(p => 
      p.remanejarPaciente && p.motivoRemanejamento
    );
    
    const decisaoCirurgica = pacientes.filter(p => 
      (p as any).setorOrigem === 'PS DECISÃO CIRURGICA' ||
      (p as any).setorOrigem === 'PS DECISÃO CLINICA'
    );
    
    const aguardandoRegulacao = pacientes.filter(p => !p.aguardaUTI);

    return {
      aguardandoUTI,
      aguardandoTransferencia,
      pendentesRemanejamento,
      decisaoCirurgica,
      aguardandoRegulacao
    };
  }, [pacientes]);

  const totalPendentes = listas.aguardandoRegulacao.length;

  // Handlers
  const onProcessFileRequest = useCallback((file: File) => {
    // Implementação da importação
    console.log('Processing file:', file);
  }, []);

  const onConfirmSync = useCallback(() => {
    // Implementação da sincronização
    console.log('Confirming sync');
  }, []);

  const onConfirmarRegulacao = useCallback(async (leitoDestino: any, observacoes: string, motivoAlteracao?: string, justificativaHomonimo?: string) => {
    if (!pacienteParaRegular) return;

    try {
      await criarRegulacao?.({
        pacienteId: pacienteParaRegular.id,
        leitoDestinoId: leitoDestino.id,
        observacoes,
        motivoAlteracao,
        justificativaHomonimo
      });

      // Registrar auditoria
      let acaoLog = `Regulação confirmada - Paciente: ${pacienteParaRegular.nomeCompleto} para ${leitoDestino.setorNome} - ${leitoDestino.codigoLeito}`;
      
      if (justificativaHomonimo) {
        acaoLog += ` | ALERTA HOMÔNIMO - Justificativa: ${justificativaHomonimo}`;
      }
      
      await registrarLog(acaoLog, 'Regulação de Leitos');

      toast({
        title: "Regulação confirmada",
        description: "O paciente foi regulado com sucesso."
      });

      setRegulacaoModalOpen(false);
      setPacienteParaRegular(null);
    } catch (error) {
      console.error('Erro ao confirmar regulação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a regulação.",
        variant: "destructive"
      });
    }
  }, [pacienteParaRegular, criarRegulacao, registrarLog, toast]);

  const onConfirmarCancelamento = useCallback((motivo: string) => {
    console.log('Confirmar cancelamento:', motivo);
    setCancelamentoModalOpen(false);
  }, []);

  const onConfirmarTransferenciaExterna = useCallback((destino: string, motivo: string) => {
    console.log('Confirmar transferência:', destino, motivo);
    setTransferenciaModalOpen(false);
  }, []);

  const onConfirmarAlocacaoCirurgia = useCallback((cirurgia: any, leito: any) => {
    console.log('Confirmar alocação cirurgia:', cirurgia, leito);
    setAlocacaoCirurgiaModalOpen(false);
  }, []);

  const onConfirmarJustificativaHomonimo = useCallback((justificativa: string) => {
    if (leitoComHomonimo && pacienteParaRegular) {
      onConfirmarRegulacao(leitoComHomonimo, '', undefined, justificativa);
    }
    setJustificativaHomonimoOpen(false);
    setLeitoComHomonimo(null);
  }, [leitoComHomonimo, pacienteParaRegular, onConfirmarRegulacao]);

  // Função para iniciar regulação com verificação de homônimo
  const iniciarRegulacao = useCallback((leito: any, observacoes: string, motivoAlteracao?: string) => {
    if (leito.temHomonimo) {
      setLeitoComHomonimo(leito);
      setJustificativaHomonimoOpen(true);
    } else {
      onConfirmarRegulacao(leito, observacoes, motivoAlteracao);
    }
  }, [onConfirmarRegulacao]);

  const filtrosProps = useMemo(() => ({
    ...filtros,
    totalPacientes: pacientes.length,
    totalAguardandoUTI: listas.aguardandoUTI.length,
    totalTransferencias: listas.aguardandoTransferencia.length
  }), [filtros, pacientes.length, listas]);

  return {
    // Estados
    loading: loadingPacientes || loadingRegulacoes,
    processing,
    isSyncing,
    
    // Dados
    listas,
    regulacoes,
    solicitacoesCirurgicas: cirurgias,
    pacientesRegulados,
    sugestoes,
    totalPendentes,
    validationResult,
    syncSummary,
    
    // Estados dos modais
    modals: {
      importModalOpen,
      regulacaoModalOpen,
      cancelamentoModalOpen,
      transferenciaModalOpen,
      alocacaoCirurgiaModalOpen,
      gerenciarTransferenciaOpen,
      resumoModalOpen,
      sugestoesModalOpen,
      justificativaHomonimoOpen
    },
    
    // Dados dos modais
    pacienteParaRegular,
    pacienteParaAcao,
    cirurgiaParaAlocar,
    isAlteracaoMode,
    modoRegulacao,
    leitoComHomonimo,
    
    // Handlers
    handlers: {
      onProcessFileRequest,
      onConfirmSync,
      onConfirmarRegulacao: iniciarRegulacao,
      onConfirmarCancelamento,
      onConfirmarTransferenciaExterna,
      onConfirmarAlocacaoCirurgia,
      onConfirmarJustificativaHomonimo
    },
    
    // Setters
    setImportModalOpen,
    setRegulacaoModalOpen,
    setCancelamentoModalOpen,
    setTransferenciaModalOpen,
    setAlocacaoCirurgiaModalOpen,
    setGerenciarTransferenciaOpen,
    setResumoModalOpen,
    setSugestoesModalOpen,
    setJustificativaHomonimoOpen,
    setPacienteParaRegular,
    setPacienteParaAcao,
    setCirurgiaParaAlocar,
    setIsAlteracaoMode,
    setModoRegulacao,
    
    // Props derivadas
    filtrosProps
  };
};
