export interface Leito {
  codigoLeito: string;
  leitoPCP: boolean;
  leitoIsolamento: boolean;
  statusLeito: 'Vago' | 'Ocupado' | 'Bloqueado' | 'Higienização';
  dataAtualizacaoStatus: string;
}

export interface Setor {
  id?: string;
  nomeSetor: string;
  siglaSetor: string;
  leitos: Leito[];
}

export interface SetorFormData {
  nomeSetor: string;
  siglaSetor: string;
}

export interface LeitoFormData {
  codigoLeito: string;
  leitoPCP: boolean;
  leitoIsolamento: boolean;
}