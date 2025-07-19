
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { intervalToDuration, parse, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatarDuracao = (dataISOouString: string | Date | undefined | null): string => {
  if (!dataISOouString) return 'N/A';

  let dataEntrada: Date;

  // Se já é um objeto Date, usa diretamente
  if (dataISOouString instanceof Date) {
    if (isValid(dataISOouString)) {
      dataEntrada = dataISOouString;
    } else {
      return 'Data Inválida';
    }
  } else {
    // Se é string, tenta fazer o parse
    // Primeiro, tenta como ISO (formato padrão do JS)
    const dataPotencial = new Date(dataISOouString);
    if (isValid(dataPotencial)) {
      dataEntrada = dataPotencial;
    } else {
      // Tenta o formato brasileiro como fallback - mas só se for string
      if (typeof dataISOouString === 'string') {
        const dataParseada = parse(dataISOouString, 'dd/MM/yyyy HH:mm', new Date());
        if (isValid(dataParseada)) {
          dataEntrada = dataParseada;
        } else {
          return 'Data Inválida';
        }
      } else {
        return 'Data Inválida';
      }
    }
  }

  try {
    const duracao = intervalToDuration({ start: dataEntrada, end: new Date() });
    const partes = [];
    if (duracao.days && duracao.days > 0) partes.push(`${duracao.days}d`);
    if (duracao.hours && duracao.hours > 0) partes.push(`${duracao.hours}h`);
    if (duracao.minutes && duracao.minutes >= 0) partes.push(`${duracao.minutes}m`);

    if (partes.length === 0) return 'Recente';

    return partes.join(' ');
  } catch (error) {
    console.error('Error calculating duration:', error, 'Input was:', dataISOouString);
    return 'Erro de Cálculo';
  }
};
