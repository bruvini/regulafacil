import { useState, useEffect } from 'react';
import { useLeitos } from './useLeitos';
import { toast } from 'sonner';
import { api } from '@/lib/axios';

interface EstatisticasBoletim {
  totalLeitos: number;
  totalOcupados: number;
  totalDisponiveis: number;
  ocupadosDCL: number;
  observadosDCL: number;
  ocupadosDCX: number;
  observadosDCX: number;
  ocupadosNeurologicos: number;
  observadosNeurologicos: number;
  ocupadosSalaLaranja: number;
  observadosSalaLaranja: number;
  ocupadosSalaEmergencia: number;
  observadosSalaEmergencia: number;
  totalSalasCC: number;
  salasAtivasCC: number;
  salasBloqueadasCC: number;
  salasTravadasCC: number;
}

export const useBoletimDiario = () => {
  const { leitos, getLeitos } = useLeitos();
  const [estatisticas, setEstatisticas] = useState<EstatisticasBoletim>({
    totalLeitos: 0,
    totalOcupados: 0,
    totalDisponiveis: 0,
    ocupadosDCL: 0,
    observadosDCL: 0,
    ocupadosDCX: 0,
    observadosDCX: 0,
    ocupadosNeurologicos: 0,
    observadosNeurologicos: 0,
    ocupadosSalaLaranja: 0,
    observadosSalaLaranja: 0,
    ocupadosSalaEmergencia: 0,
    observadosSalaEmergencia: 0,
    totalSalasCC: 0,
    salasAtivasCC: 0,
    salasBloqueadasCC: 0,
    salasTravadasCC: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calcularEstatisticas();
  }, [leitos]);

  const gerarBoletim = async (dadosManuais: Partial<EstatisticasBoletim>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/boletim-diario', {
        ...estatisticas,
        ...dadosManuais,
      });
      console.log('Boletim gerado:', response.data);
      toast.success('Boletim diário gerado com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar boletim diário');
      toast.error('Erro ao gerar boletim diário');
    } finally {
      setLoading(false);
      getLeitos();
    }
  };

  const calcularEstatisticas = () => {
    const totalLeitos = leitos.length;
    const totalOcupados = leitos.filter(leito => leito.status === 'Ocupado' || leito.status === 'Regulado').length;
    const totalDisponiveis = leitos.filter(leito => leito.status === 'Disponível').length;

    const ocupadosDCL = leitos.filter(leito => 
      leito.siglaSetor === 'DCL' && (leito.status === 'Ocupado' || leito.status === 'Regulado')
    ).length;

    const ocupadosDCX = leitos.filter(leito => 
      leito.siglaSetor === 'DCX' && (leito.status === 'Ocupado' || leito.status === 'Regulado')
    ).length;

    const ocupadosNeurologicos = leitos.filter(leito => 
      leito.siglaSetor === 'NEU' && (leito.status === 'Ocupado' || leito.status === 'Regulado')
    ).length;

    const ocupadosSalaLaranja = leitos.filter(leito => 
      leito.siglaSetor === 'SLJ' && (leito.status === 'Ocupado' || leito.status === 'Regulado')
    ).length;

    const ocupadosSalaEmergencia = leitos.filter(leito => 
      leito.siglaSetor === 'SE' && (leito.status === 'Ocupado' || leito.status === 'Regulado')
    ).length;

    const totalSalasCC = leitos.filter(leito => leito.siglaSetor === 'CC').length;
    const salasAtivasCC = leitos.filter(leito => leito.siglaSetor === 'CC' && leito.status === 'Ocupado').length;
    const salasBloqueadasCC = leitos.filter(leito => leito.siglaSetor === 'CC' && leito.status === 'Bloqueado').length;
    const salasTravadasCC = leitos.filter(leito => leito.siglaSetor === 'CC' && leito.status === 'Higienização').length;

    setEstatisticas({
      totalLeitos,
      totalOcupados,
      totalDisponiveis,
      ocupadosDCL,
      observadosDCL: estatisticas.observadosDCL,
      ocupadosDCX,
      observadosDCX: estatisticas.observadosDCX,
      ocupadosNeurologicos,
      observadosNeurologicos: estatisticas.observadosNeurologicos,
      ocupadosSalaLaranja,
      observadosSalaLaranja: estatisticas.observadosSalaLaranja,
      ocupadosSalaEmergencia,
      observadosSalaEmergencia: estatisticas.observadosSalaEmergencia,
      totalSalasCC,
      salasAtivasCC,
      salasBloqueadasCC,
      salasTravadasCC,
    });
  };

  return {
    estatisticas,
    loading,
    error,
    gerarBoletim,
  };
};
