import { Observacao } from './observacao';

export interface AltaLeitoInfo {
  status: boolean;
  pendencia: string;
  timestamp: string; // Data e hora no formato ISO
  usuario: string; // Nome do usuário que registrou
}

export interface Paciente {
  id: string;
  leitoId: string;
  setorId: string;
  nomeCompleto: string;
  dataNascimento: string;
  sexoPaciente: 'Masculino' | 'Feminino';
  dataInternacao: string;
  especialidadePaciente: string;
  isolamentosVigentes?: IsolamentoVigente[];
  aguardaUTI?: boolean;
  dataPedidoUTI?: string;
  transferirPaciente?: boolean;
  destinoTransferencia?: string;
  motivoTransferencia?: string;
  dataTransferencia?: string;
  remanejarPaciente?: boolean;
  motivoRemanejamento?: string;
  dataPedidoRemanejamento?: string;
  provavelAlta?: boolean;
  altaNoLeito?: AltaLeitoInfo;
  origem?: {
    deSetor: string;
    deLeito: string;
  };
  historicoTransferencia?: any[];
  obsPaciente?: Observacao[];
  obsAltaProvavel?: Observacao[];
  obsInternacaoProlongada?: Observacao[];
  setorOrigem?: string;
}

export interface IsolamentoVigente {
  sigla: string;
  dataInicioVigilancia?: string;
  isolamentoId?: string;
}

export interface Leito {
  id: string;
  setorId: string;
  codigoLeito: string;
  tipoLeito: string;
  leitoIsolamento: boolean;
  leitoPCP: boolean;
  historicoMovimentacao: HistoricoLeito[];
}

export interface HistoricoLeito {
  statusLeito: 'Vago' | 'Higienizacao' | 'Ocupado' | 'Reservado' | 'Regulado' | 'Bloqueado';
  dataAtualizacaoStatus: string;
  pacienteId?: string;
  infoRegulacao?: InfoRegulacao;
  motivoBloqueio?: string;
}

export interface InfoRegulacao {
  regulacaoId?: string;
  paraSetor: string;
  paraLeito: string;
  observacoes?: string;
}

export interface Setor {
  id: string;
  nomeSetor: string;
  siglaSetor: string;
}

// Form Data Types
export interface LeitoFormData {
  codigoLeito: string;
  tipoLeito: string;
  leitoPCP: boolean;
  leitoIsolamento: boolean;
}

export interface SetorFormData {
  nomeSetor: string;
  siglaSetor: string;
}

export interface SolicitacaoCirurgica {
  id: string;
  nomeCompleto: string;
  dataNascimento: string;
  sexo: 'Masculino' | 'Feminino';
  especialidade: string;
  medicoSolicitante: string;
  tipoPreparo?: string;
  tipoLeitoNecessario: 'Enfermaria' | 'UTI';
  dataPrevistaInternacao: Date;
  dataPrevisaCirurgia: Date;
  dataCriacao?: Date;
  status?: string;
  leitoReservado?: string;
  setorReservado?: string;
}

export interface SolicitacaoCirurgicaFormData {
  nomeCompleto: string;
  dataNascimento: string;
  sexo: 'Masculino' | 'Feminino';
  especialidade: string;
  medicoSolicitante: string;
  tipoPreparo?: string;
  tipoLeitoNecessario: 'Enfermaria' | 'UTI';
  dataPrevistaInternacao: Date;
  dataPrevisaCirurgia: Date;
}

// Alias for backward compatibility
export interface DadosPaciente extends Paciente {}
export interface HistoricoMovimentacao extends HistoricoLeito {}

export interface LeitoEnriquecido extends Leito {
  statusLeito: 'Vago' | 'Higienizacao' | 'Ocupado' | 'Reservado' | 'Regulado' | 'Bloqueado';
  dadosPaciente?: Paciente;
}
