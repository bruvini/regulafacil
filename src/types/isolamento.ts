
export interface ParametroRegra {
  dias?: number;
  sintoma?: string;
  exame?: string;
}

export interface RegraIsolamento {
  tipo: 'ATE_ALTA' | 'ATE_FECHAMENTO_FERIDA' | 'ATE_FINALIZAR_TRATAMENTO' | 'ATE_RESULTADO_EXAME_NEGATIVO' | 'APOS_X_DIAS_SINTOMA' | 'APOS_X_DIAS_SEM_SINTOMA' | 'LIBERACAO_MEDICA';
  parametro: ParametroRegra | null;
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
