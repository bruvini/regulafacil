import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { Paciente } from '@/types/hospital';
import { parseDateFromString } from '@/lib/utils';

export const useHuddleList = (pacientes: Paciente[]) => {
  const internacoesProlongadas = useMemo(() => {
    return pacientes.filter(paciente => {
      const dataInternacao = parseDateFromString(paciente.dataInternacao);
      if (!dataInternacao) return false;
      return differenceInDays(new Date(), dataInternacao) > 60;
    });
  }, [pacientes]);
  const altasNoLeito = useMemo(() => {
    return pacientes.filter(
      paciente => paciente.altaNoLeito && paciente.altaNoLeito.status === true
    );
  }, [pacientes]);

  return { internacoesProlongadas, altasNoLeito };
};
