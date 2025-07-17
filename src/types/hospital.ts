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
 * Representa a nova coleção `setoresRegulaFacil`.
 * Armazena apenas informações sobre o setor em si.
 */
export interface Setor {
  id?: string;
  nomeSetor: string;
  siglaSetor: string;
}

/**
 * Representa a nova coleção `leitosRegulaFacil`.
 * Contém os dados estáticos e o histórico de movimentação de cada leito.
 */
export interface Leito {
  id?: string;
  setorId: string; // ID do setor ao qual pertence
  codigoLeito: string;
  leitoPCP: boolean;
  leitoIsolamento: boolean;
  historicoMovimentacao: HistoricoMovimentacao[];
  // O status atual é o último item do array historicoMovimentacao.
}

/**
 * Representa a nova coleção `pacientesRegulaFacil`.
 * Armazena todos os dados dinâmicos dos pacientes.
 */
export interface Paciente {
  id?: string;
  leitoId: string; // ID do leito que o paciente ocupa atualmente
  setorId: string; // ID do setor onde o leito está
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

// --- Tipos para Formulários ---

export interface SetorFormData {
  nomeSetor: string;
  siglaSetor: string;
}

export interface LeitoFormData {
  codigoLeito: string;
  leitoPCP: boolean;
  leitoIsolamento: boolean;
}

// --- Outros Tipos (mantidos para outras funcionalidades) ---

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