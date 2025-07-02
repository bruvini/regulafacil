
export interface Leito {
  id: string;
  codigoLeito: string;
  leitoPCP: boolean;
  leitoIsolamento: boolean;
  statusLeito: 'Vago' | 'Ocupado' | 'Bloqueado' | 'Higienizacao';
  dataAtualizacaoStatus: string;
  motivoBloqueio?: string;
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
