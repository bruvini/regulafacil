import { RegraIsolamento } from '@/types/isolamento';

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