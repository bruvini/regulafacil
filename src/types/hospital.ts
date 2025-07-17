
// src/types/hospital.ts

/**
 * Representa um único evento na linha do tempo de um leito.
 */
export interface HistoricoMovimentacao {
  statusLeito: 'Vago' | 'Ocupado' | 'Bloqueado' | 'Higienizacao' | 'Regulado' | 'Reservado';
  dataAtualizacaoStatus: string; // ISO String
  motivoBloqueio?: string;
  pacienteId?: string; // ID do paciente se o status for Ocupado, Regulado ou Reservado
  infoRegulacao?: {
    paraSetor: string;
    paraLeito: string;
    observacoes?: string;
  };
}

/**
 * Representa a coleção `setoresRegulaFacil`.
 */
export interface Setor {
  id?: string;
  nomeSetor: string;
  siglaSetor: string;
}

/**
 * Dados do paciente para uso em componentes
 */
export interface DadosPaciente {
  nomePaciente: string;
  dataNascimento: string;
  sexoPaciente: 'Masculino' | 'Feminino';
  dataInternacao: string;
  especialidadePaciente: string;
  aguardaUTI?: boolean;
  dataPedidoUTI?: string;
  remanejarPaciente?: boolean;
  motivoRemanejamento?: string;
  dataPedidoRemanejamento?: string;
  transferirPaciente?: boolean;
  destinoTransferencia?: string;
  motivoTransferencia?: string;
  dataTransferencia?: string;
  statusTransferencia?: 'Organizar' | 'Pendente' | 'Concluída';
  historicoTransferencia?: { etapa: string; data: string; usuario?: string; }[];
  provavelAlta?: boolean;
  obsPaciente?: string[];
  isolamentosVigentes?: {
    isolamentoId: string;
    sigla: string;
    dataInicioVigilancia: string;
    regrasCumpridas: string[];
  }[];
  origem?: {
    deSetor: string;
    deLeito: string;
  };
}

/**
 * Representa a coleção `leitosRegulaFacil` - versão base do Firestore.
 */
export interface LeitoBase {
  id: string; // O ID do documento no Firestore
  setorId: string;
  codigoLeito: string;
  leitoPCP: boolean;
  leitoIsolamento: boolean;
  historicoMovimentacao: HistoricoMovimentacao[];
}

/**
 * Representa um leito com propriedades computadas para uso em componentes.
 */
export interface Leito extends LeitoBase {
  statusLeito: 'Vago' | 'Ocupado' | 'Bloqueado' | 'Higienizacao' | 'Regulado' | 'Reservado';
  dataAtualizacaoStatus: string;
  dadosPaciente?: DadosPaciente;
  motivoBloqueio?: string;
  regulacao?: {
    paraSetor: string;
    paraLeito: string;
    observacoes?: string;
  };
}

/**
 * Representa a coleção `pacientesRegulaFacil`.
 */
export interface Paciente {
  id: string; // O ID do documento no Firestore
  leitoId: string;
  setorId: string;
  nomeCompleto: string;
  dataNascimento: string;
  sexoPaciente: 'Masculino' | 'Feminino';
  dataInternacao: string;
  especialidadePaciente: string;
  aguardaUTI?: boolean;
  dataPedidoUTI?: string;
  remanejarPaciente?: boolean;
  motivoRemanejamento?: string;
  dataPedidoRemanejamento?: string;
  transferirPaciente?: boolean;
  destinoTransferencia?: string;
  motivoTransferencia?: string;
  dataTransferencia?: string;
  statusTransferencia?: 'Organizar' | 'Pendente' | 'Concluída';
  historicoTransferencia?: { etapa: string; data: string; usuario?: string; }[];
  provavelAlta?: boolean;
  obsPaciente?: string[];
  isolamentosVigentes?: {
    isolamentoId: string;
    sigla: string;
    dataInicioVigilancia: string;
    regrasCumpridas: string[];
  }[];
  origem?: {
    deSetor: string;
    deLeito: string;
  };
}

// ... outros tipos (FormData, SolicitacaoCirurgica, etc.) permanecem os mesmos
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
  dataNascimento: string;
  sexo: 'Masculino' | 'Feminino';
  especialidade: string;
  medicoSolicitante: string;
  tipoPreparo?: string;
  dataPrevistaInternacao: Date;
  dataPrevisaCirurgia: Date;
  tipoLeitoNecessario: 'Enfermaria' | 'UTI';
  dataCriacao: Date;
  status: 'Pendente' | 'Agendada' | 'Realizada' | 'Cancelada';
  leitoReservado?: string;
}

export interface SolicitacaoCirurgicaFormData {
  nomeCompleto: string;
  dataNascimento: string;
  sexo: 'Masculino' | 'Feminino';
  especialidade: string;
  medicoSolicitante: string;
  tipoPreparo?: string;
  dataPrevistaInternacao: Date;
  dataPrevisaCirurgia: Date;
  tipoLeitoNecessario: 'Enfermaria' | 'UTI';
}
