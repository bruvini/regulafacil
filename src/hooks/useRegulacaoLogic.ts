
import { useState, useCallback, useMemo } from 'react';
import { usePacientes } from './usePacientes';
import { useLeitos } from './useLeitos';
import { useSetores } from './useSetores';
import { useLeitoFinder } from './useLeitoFinder';
import { toast } from '@/hooks/use-toast';
import { Paciente, DadosPaciente } from '@/types/hospital';

export const useRegulacaoLogic = () => {
  const { pacientes, loading: loadingPacientes, importarPacientesDaPlanilha } = usePacientes();
  const { leitos, loading: loadingLeitos } = useLeitos();
  const { setores, loading: loadingSetores } = useSetores();
  const { findAvailableLeitos, generateSugestoes } = useLeitoFinder();

  const [selectedLeitoId, setSelectedLeitoId] = useState<string>('');
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [selectedPacienteUTI, setSelectedPacienteUTI] = useState<Paciente | null>(null);
  const [filtros, setFiltros] = useState({
    setorSelecionado: '',
    statusRegulacao: '',
    dataInicio: '',
    dataFim: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: '',
    direction: 'ascending' as 'ascending' | 'descending'
  });

  const loading = loadingPacientes || loadingLeitos || loadingSetores;

  // Pacientes pendentes de regulação
  const pacientesPendentes = useMemo(() => {
    return pacientes.filter(p => !p.leitoId);
  }, [pacientes]);

  // Pacientes já regulados
  const pacientesRegulados = useMemo(() => {
    return pacientes.filter(p => p.leitoId && p.regulacao);
  }, [pacientes]);

  // Função para aplicar filtros
  const handleFiltroChange = useCallback((name: string, value: string) => {
    setFiltros(prev => ({ ...prev, [name]: value }));
  }, []);

  // Função para ordenação
  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  }, []);

  // Função para regular paciente
  const regularPaciente = useCallback(async (paciente: Paciente, leitoId: string) => {
    try {
      // Implementar lógica de regulação
      toast({
        title: "Sucesso",
        description: `Paciente ${paciente.nomeCompleto} regulado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao regular paciente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível regular o paciente.",
        variant: "destructive",
      });
    }
  }, []);

  // Função para importar dados
  const handleImportacao = useCallback(async (dadosImportacao: any[]) => {
    try {
      const resumo = await importarPacientesDaPlanilha(dadosImportacao);
      
      const totalProcessados = resumo.processados || 0;
      const totalErros = resumo.erros || 0;
      
      toast({
        title: "Importação Concluída",
        description: `${totalProcessados} registros processados com sucesso. ${totalErros} erros encontrados.`,
      });
      
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

  return {
    // Estados
    pacientes,
    pacientesPendentes,
    pacientesRegulados,
    leitos,
    setores,
    loading,
    selectedLeitoId,
    selectedPaciente,
    selectedPacienteUTI,
    filtros,
    sortConfig,

    // Funções de estado
    setSelectedLeitoId,
    setSelectedPaciente,
    setSelectedPacienteUTI,
    setFiltros,
    setSortConfig,

    // Funções de negócio
    handleFiltroChange,
    handleSort,
    regularPaciente,
    handleImportacao,
    findAvailableLeitos,
    generateSugestoes,
  };
};
