
import { RegraIsolamento } from '@/types/isolamento';
import { format, differenceInYears, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatarDescricaoRegra = (regra: RegraIsolamento): string => {
  if (!regra || !regra.tipo) return 'Regra inválida';

  const obterParam = (tipo: string) => regra.parametros.find(p => p.tipo === tipo)?.valor;

  switch (regra.tipo) {
    case 'EXAME_NEGATIVO':
      const exames = regra.parametros.map(p => p.valor).join(', ');
      return `Até resultado negativo de: ${exames || 'exame não especificado'}`;
    case 'DIAS_COM_SINTOMA':
      return `Após ${obterParam('quantidade_dias') || 'X'} dias com ${obterParam('nome_sintoma') || 'sintoma'}`;
    case 'DIAS_SEM_SINTOMA':
      return `Após ${obterParam('quantidade_dias') || 'X'} dias sem ${obterParam('nome_sintoma') || 'sintoma'}`;
    case 'CONDICAO_ESPECIFICA':
      const condicoes = {
        'alta_hospitalar': 'Alta Hospitalar',
        'fechamento_ferida': 'Fechamento da Ferida Operatória',
        'liberacao_medica': 'Liberação Médica'
      };
      const condicao = obterParam('condicao_especifica') as keyof typeof condicoes;
      return `Até ${condicoes[condicao] || 'condição não especificada'}`;
    case 'TRATAMENTO_COMPLETO':
      const atb = obterParam('nome_antimicrobiano');
      return atb ? `Até fim do tratamento com ${atb}` : 'Até fim do tratamento';
    default:
      return regra.descricao; // Fallback para a descrição genérica
  }
};

export const formatarDataHora = (data: string | Date): string => {
  try {
    let dataObj: Date;
    
    if (typeof data === 'string') {
      // Try parsing as ISO first, then as dd/MM/yyyy HH:mm
      dataObj = new Date(data);
      if (!isValid(dataObj)) {
        dataObj = parse(data, 'dd/MM/yyyy HH:mm', new Date());
      }
    } else {
      dataObj = data;
    }

    if (!isValid(dataObj)) {
      return 'Data inválida';
    }

    return format(dataObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return 'Data inválida';
  }
};

export const calcularIdade = (dataNascimento: string | Date): number => {
  try {
    let dataObj: Date;
    
    if (typeof dataNascimento === 'string') {
      // Try parsing as ISO first, then as dd/MM/yyyy
      dataObj = new Date(dataNascimento);
      if (!isValid(dataObj)) {
        dataObj = parse(dataNascimento, 'dd/MM/yyyy', new Date());
      }
    } else {
      dataObj = dataNascimento;
    }

    if (!isValid(dataObj)) {
      return 0;
    }

    return differenceInYears(new Date(), dataObj);
  } catch {
    return 0;
  }
};
