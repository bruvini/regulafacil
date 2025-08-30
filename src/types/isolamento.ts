
export interface ParametroRegra {
  id: string;
  tipo: 'nome_exame' | 'quantidade_dias' | 'nome_sintoma' | 'condicao_especifica' | 'nome_antimicrobiano' | 'periodo_alerta' | 'cultura_referencia';
  valor: string | number;
}

export interface RegraIsolamento {
  id: string;
  tipo: 'EXAME_NEGATIVO' | 'DIAS_COM_SINTOMA' | 'DIAS_SEM_SINTOMA' | 'CONDICAO_ESPECIFICA' | 'TRATAMENTO_COMPLETO' | 'REINTERNACAO_ALERT';
  descricao: string;
  parametros: ParametroRegra[];
}

export interface GrupoRegras {
  logica: 'E' | 'OU';
  regras: RegraIsolamento[];
}

export interface RegrasPrecaucao {
  logica: 'E' | 'OU';
  grupos: GrupoRegras[];
}

export interface TipoIsolamento {
  id?: string;
  nomeMicroorganismo: string;
  sigla: string;
  perfilSensibilidade: string;
  cor: string;
  regrasPrecaucao: RegrasPrecaucao;
}

export interface TipoIsolamentoFormData {
  nomeMicroorganismo: string;
  sigla: string;
  perfilSensibilidade: string;
  cor: string;
  regrasPrecaucao: RegrasPrecaucao;
}

export interface PacienteIsolamento {
  isolamentoId?: string;
  sigla: string;
  status: 'suspeita' | 'confirmada';
  dataInicio: string;
  regrasCumpridas?: string[];
}
