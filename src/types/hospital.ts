export interface HistoricoLeito {
  statusLeito: 'Vago' | 'Ocupado' | 'Bloqueado' | 'Higienizacao';
  data: string;
  pacienteId?: string; // ID do paciente se o status for 'Ocupado'
  motivoBloqueio?: string;
}

export interface Leito {
  id: string;
  codigoLeito: string;
  leitoPCP: boolean;
  leitoIsolamento: boolean;
  statusLeito: 'Vago' | 'Ocupado' | 'Bloqueado' | 'Higienizacao';
  dataAtualizacaoStatus: string;
  motivoBloqueio?: string;
  // Novos campos:
  pacienteId?: string; // ID do paciente atualmente no leito
  historico: HistoricoLeito[]; // Log de todas as movimentações
}

export interface Paciente {
  id?: string; // ID será o nome do paciente normalizado
  nomeCompleto: string;
  dataNascimento: string;
  sexo: 'Masculino' | 'Feminino';
  dataInternacao: string;
  especialidade: string;
  leitoAtualId?: string; // ID do leito que ele ocupa
  setorAtualId?: string;
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
