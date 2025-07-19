// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { intervalToDuration, parse, isValid, differenceInMinutes } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatarDuracao = (dataInput: any): string => {
  if (!dataInput) return 'N/A';

  let dataEntrada: Date;

  // CORREÇÃO: Adiciona a capacidade de entender o objeto Timestamp do Firebase
  // Esta é a verificação mais importante:
  if (typeof dataInput === 'object' && dataInput !== null && typeof dataInput.toDate === 'function') {
    dataEntrada = dataInput.toDate();
  } 
  // O resto da lógica permanece como um fallback seguro
  else if (dataInput instanceof Date) {
    dataEntrada = dataInput;
  } else if (typeof dataInput === 'string') {
    // Tenta como ISO
    const dataPotencial = new Date(dataInput);
    if (isValid(dataPotencial)) {
      dataEntrada = dataPotencial;
    } else {
      // Tenta como formato brasileiro
      const dataParseada = parse(dataInput, 'dd/MM/yyyy HH:mm', new Date());
      if (isValid(dataParseada)) {
        dataEntrada = dataParseada;
      } else {
        return 'Data Inválida';
      }
    }
  } else {
    return 'Data Inválida';
  }

  if (!isValid(dataEntrada)) {
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
    console.error('Error calculating duration:', error, 'Input was:', dataInput);
    return 'Erro';
  }
};