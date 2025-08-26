import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { Paciente } from '@/types/hospital';
import { parseDateFromString } from '@/lib/utils';

export const useHuddleList = (pacientes: Paciente[]) => {
  const internacoesProlongadas = useMemo(() => {
    return pacientes.filter(paciente => {
      const dataInternacao = parseDateFromString(paciente.dataInternacao);
      if (!dataInternacao) return false;
      return differenceInDays(new Date(), dataInternacao) > 30;
    });
  }, [pacientes]);

  const altasPendentes = useMemo(() => {
    return pacientes
      .filter(p => p.altaPendente)
      .reduce((acc, paciente) => {
        const tipo = paciente.altaPendente!.tipo;
        if (!acc[tipo]) {
          acc[tipo] = [];
        }
        acc[tipo].push(paciente);
        return acc;
      }, {} as Record<string, Paciente[]>);
  }, [pacientes]);

  return { internacoesProlongadas, altasPendentes };
};
