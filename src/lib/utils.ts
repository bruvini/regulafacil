
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { intervalToDuration, parse, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatarDuracao = (dataISOouString: string | undefined | null): string => {
  // Retorna 'N/A' imediatamente se a entrada for nula, indefinida ou vazia
  if (!dataISOouString) return 'N/A';

  let dataEntrada: Date;

  // Tenta interpretar a data, primeiro como ISO, depois como formato customizado
  const dataPotencial = new Date(dataISOouString);
  if (isValid(dataPotencial)) {
    dataEntrada = dataPotencial;
  } else {
    // Tenta o formato customizado como último recurso
    const dataParseada = parse(dataISOouString, 'dd/MM/yyyy HH:mm', new Date());
    if (isValid(dataParseada)) {
      dataEntrada = dataParseada;
    } else {
      // Se tudo falhar, retorna um erro amigável sem quebrar a aplicação
      return 'Data Inválida';
    }
  }

  // Se a dataEntrada for válida, calcula a duração
  try {
    const duracao = intervalToDuration({ start: dataEntrada, end: new Date() });
    const partes = [];
    if (duracao.days && duracao.days > 0) partes.push(`${duracao.days}d`);
    if (duracao.hours && duracao.hours > 0) partes.push(`${duracao.hours}h`);
    if (duracao.minutes && duracao.minutes >= 0) partes.push(`${duracao.minutes}m`);

    // Se a duração for muito curta, mostra 'Recente'
    if (partes.length === 0) return 'Recente';

    return partes.join(' ');
  } catch (error) {
    // Captura qualquer erro inesperado do intervalToDuration
    return 'Erro de Cálculo';
  }
};
