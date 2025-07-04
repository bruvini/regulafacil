
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

export interface SolicitacaoCirurgica {
  id?: string;
  nomeCompleto: string;
  dataNascimento: string; // Mudando para string para facilitar input
  sexo: 'Masculino' | 'Feminino';
  especialidade: string;
  medicoSolicitante: string;
  tipoPreparo?: string;
  dataPrevistaInternacao: Date;
  dataPrevisaCirurgia: Date;
  tipoLeitoNecessario: 'Enfermaria' | 'UTI';
  dataCriacao: Date;
  status: 'Pendente' | 'Agendada' | 'Realizada' | 'Cancelada';
  leitoReservado?: string; // Novo campo para armazenar código do leito
}

export interface SolicitacaoCirurgicaFormData {
  nomeCompleto: string;
  dataNascimento: string; // Mudando para string
  sexo: 'Masculino' | 'Feminino';
  especialidade: string;
  medicoSolicitante: string;
  tipoPreparo?: string;
  dataPrevistaInternacao: Date;
  dataPrevisaCirurgia: Date;
  tipoLeitoNecessario: 'Enfermaria' | 'UTI';
}
