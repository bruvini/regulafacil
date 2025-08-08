
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { intervalToDuration, parse, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatarDuracao = (dataISOouString: string | Date | undefined | null): string => {
  if (!dataISOouString) return 'N/A';

  let dataEntrada: Date;

  if (dataISOouString instanceof Date) {
    dataEntrada = dataISOouString;
  } else if (typeof dataISOouString === 'string' && dataISOouString.includes('/')) {
    // Tenta parsear o formato 'dd/MM/yyyy HH:mm' primeiro
    dataEntrada = parse(dataISOouString, 'dd/MM/yyyy HH:mm', new Date());
  } else {
    // Tenta como uma string ISO padrão
    dataEntrada = new Date(dataISOouString);
  }

  if (!isValid(dataEntrada)) {
    console.error('Data de entrada inválida para formatarDuracao:', dataISOouString);
    return 'Data Inválida';
  }

  try {
    const duracao = intervalToDuration({ start: dataEntrada, end: new Date() });
    const partes = [];
    if (duracao.days && duracao.days > 0) partes.push(`${duracao.days}d`);
    if (duracao.hours && duracao.hours > 0) partes.push(`${duracao.hours}h`);
    if (duracao.minutes !== undefined && duracao.minutes >= 0) partes.push(`${duracao.minutes}m`);

    if (partes.length === 0) return 'Recente';

    return partes.join(' ');
  } catch (error) {
    console.error('Erro ao calcular duração:', error, 'Input:', dataISOouString);
    return 'Erro';
  }
};
