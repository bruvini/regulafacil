
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { intervalToDuration, parse, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converte uma string de data no formato 'dd/MM/yyyy HH:mm' para um objeto Date.
 * Retorna null se a data for inválida.
 * @param dateString A data em formato de string.
 */
export const parseDateFromString = (dateString: string): Date | null => {
  if (!dateString) return null;

  // O 'dd/MM/yyyy HH:mm' é o formato exato que vem do Firestore e da planilha.
  const parsedDate = parse(dateString, 'dd/MM/yyyy HH:mm', new Date());

  return isValid(parsedDate) ? parsedDate : null;
};

export const formatarDataSemFuso = (dataString: string): string => {
  if (!dataString) return 'N/A';
  const data = new Date(`${dataString}T00:00:00`);
  return data.toLocaleDateString('pt-BR');
};

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

import type { DetalhesRemanejamento } from '@/types/hospital';

export const descreverMotivoRemanejamento = (
  detalhes?: DetalhesRemanejamento | string | null
): string => {
  if (!detalhes) return '';
  if (typeof detalhes === 'string') return detalhes;
  switch (detalhes.tipo) {
    case 'priorizacao':
      return detalhes.justificativa
        ? `Pedido de Priorização: ${detalhes.justificativa}`
        : 'Pedido de Priorização';
    case 'adequacao_perfil':
      return detalhes.justificativa
        ? `Adequação de Perfil Clínico: ${detalhes.justificativa}`
        : 'Adequação de Perfil Clínico';
    case 'melhoria_assistencia':
      return detalhes.justificativa
        ? `Melhoria na Assistência: ${detalhes.justificativa}`
        : 'Melhoria na Assistência';
    case 'contra_fluxo':
      return detalhes.justificativa
        ? `Contra-fluxo: ${detalhes.justificativa}`
        : 'Contra-fluxo';
    case 'liberado_isolamento':
      return 'Liberado de Isolamento';
    case 'incompatibilidade_biologica':
      return 'Incompatibilidade Biológica';
    case 'reserva_oncologia':
      return 'Reserva para Oncologia';
    case 'alta_uti':
      return 'Alta da UTI';
    case 'alta_avc_agudo':
      return 'Alta da Unidade de AVC Agudo';
    default:
      return '';
  }
};
export const formatarInputData = (valor: string): string => {
  const digitos = valor.replace(/\D/g, '');
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4, 8)}`;
};

/**
 * Extrai o identificador do quarto a partir do código de um leito.
 * Lida com padrões regulares ("320 1") e irregulares ("200 07 P", "318-3PCP").
 * @param codigoLeito O código completo do leito.
 * @returns O identificador do quarto (ex: "200", "318").
 */
export const getQuartoId = (codigoLeito: string): string => {
  // A expressão regular busca pela primeira sequência de dígitos no início da string.
  const match = codigoLeito.match(/^\d+/);
  if (match) {
    return match[0];
  }
  // Fallback para casos onde o código não começa com número.
  return codigoLeito;
};

export const isQuartoUTQ = (leito: { setorNome: string; codigoLeito: string }): boolean => {
  return (
    leito.setorNome === 'UNID. CLINICA MEDICA' &&
    getQuartoId(leito.codigoLeito).startsWith('504')
  );
};

export const determinarSexoLeito = (
  leito: any,
  todosLeitosComSetor: any[]
): 'Masculino' | 'Feminino' | 'Ambos' => {
  if (isQuartoUTQ(leito)) return 'Ambos';
  const quartoId = getQuartoId(leito.codigoLeito);
  const companheirosDeQuarto = todosLeitosComSetor.filter(
    l =>
      getQuartoId(l.codigoLeito) === quartoId &&
      l.statusLeito === 'Ocupado' &&
      l.dadosPaciente
  );

  if (companheirosDeQuarto.length === 0) {
    return 'Ambos';
  }

  const sexoQuarto = companheirosDeQuarto[0].dadosPaciente?.sexoPaciente;
  return sexoQuarto === 'Masculino' ? 'Masculino' : 'Feminino';
};
