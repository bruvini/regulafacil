
import { useMemo } from 'react';
import { Setor } from '@/types/hospital';

export const useIndicadoresHospital = (setores: Setor[]) => {
  const todosLeitos = useMemo(() => setores.flatMap(s => s.leitos), [setores]);

  // 1. Contagem de Leitos por Status
  const contagemPorStatus = useMemo(() => {
    const contagem: Record<string, number> = {
      Ocupado: 0, 
      Vago: 0, 
      Bloqueado: 0, 
      Higienizacao: 0, 
      Regulado: 0, 
      Reservado: 0,
    };
    
    todosLeitos.forEach(leito => {
      if (leito.statusLeito in contagem) {
        contagem[leito.statusLeito]++;
      }
    });
    
    return contagem;
  }, [todosLeitos]);

  // 2. Taxa de Ocupação
  const taxaOcupacao = useMemo(() => {
    const leitosOperacionais = contagemPorStatus.Ocupado + contagemPorStatus.Vago + contagemPorStatus.Higienizacao + contagemPorStatus.Regulado + contagemPorStatus.Reservado;
    if (leitosOperacionais === 0) return 0;
    const ocupadosEregulados = contagemPorStatus.Ocupado + contagemPorStatus.Regulado + contagemPorStatus.Reservado;
    return Math.round((ocupadosEregulados / leitosOperacionais) * 100);
  }, [contagemPorStatus]);

  // 3. Tempo Médio por Status (Cálculo Simplificado)
  const tempoMedioStatus = useMemo(() => {
    const duracoesPorStatus: Record<string, number[]> = {
      Ocupado: [],
      Vago: [],
      Bloqueado: [],
      Higienizacao: []
    };
    
    todosLeitos.forEach(leito => {
      if (leito.dataAtualizacaoStatus && duracoesPorStatus[leito.statusLeito]) {
        const inicio = new Date(leito.dataAtualizacaoStatus);
        const duracaoTotalMinutos = (new Date().getTime() - inicio.getTime()) / (1000 * 60);
        duracoesPorStatus[leito.statusLeito].push(duracaoTotalMinutos);
      }
    });

    const formatarMedia = (temposEmMinutos: number[]) => {
      if (temposEmMinutos.length === 0) return 'N/A';
      const mediaMinutos = temposEmMinutos.reduce((a, b) => a + b, 0) / temposEmMinutos.length;
      const dias = Math.floor(mediaMinutos / 1440);
      const horas = Math.floor((mediaMinutos % 1440) / 60);
      if (dias > 0) return `${dias.toFixed(0)}d ${horas.toFixed(0)}h`;
      return `${horas.toFixed(0)}h`;
    };
    
    return {
      Ocupado: formatarMedia(duracoesPorStatus.Ocupado),
      Vago: formatarMedia(duracoesPorStatus.Vago),
      Bloqueado: formatarMedia(duracoesPorStatus.Bloqueado),
      Higienizacao: formatarMedia(duracoesPorStatus.Higienizacao),
    };
  }, [todosLeitos]);

  return { contagemPorStatus, taxaOcupacao, tempoMedioStatus };
};
