
import { Observacao } from './observacao';

export type TipoRemanejamento =
  | 'priorizacao'
  | 'adequacao_perfil'
  | 'melhoria_assistencia'
  | 'contra_fluxo'
  | 'liberado_isolamento'
  | 'incompatibilidade_biologica'
  | 'reserva_oncologia'
  | 'alta_uti';

export interface DetalhesRemanejamento {
  tipo: TipoRemanejamento;
  justificativa?: string;
}

export interface AltaLeitoInfo {
  status: boolean;
  tipo: 'medicacao' | 'transporte' | 'familiar' | 'emad' | 'outros';
  detalhe?: string; // Detalhe adicional da pendência
  pendencia: string; // Texto completo para exibição rápida
  timestamp: string; // Data e hora no formato ISO
  usuario: string; // Nome do usuário que registrou
}

export interface InfoAltaPendente {
  tipo: 'medicacao' | 'transporte' | 'familiar' | 'emad' | 'outros';
  detalhe?: string;
  usuario: string;
  timestamp: string;
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
  motivoRemanejamento?: DetalhesRemanejamento | string | null;
  dataPedidoRemanejamento?: string;
  provavelAlta?: boolean;
  altaNoLeito?: AltaLeitoInfo;
  altaPendente?: InfoAltaPendente | null;
  origem?: {
    deSetor: string;
    deLeito: string;
  };
  historicoTransferencia?: any[];
  obsPaciente?: Observacao[];
  obsAltaProvavel?: Observacao[];
  obsInternacaoProlongada?: Observacao[];
  setorOrigem?: string;
  idade?: number | string;
  prioridade?: number;
  solicitadoPor?: string;
  leitoNecessario?: 'Enfermaria' | 'UTI';
  condicaoClinica?: string;
  dataSolicitacao?: string;
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
  prioridadeHigienizacao?: boolean;
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
  deSetor?: string;
  observacoes?: string;
  origemExterna?: string; // Novo campo para origem externa
  tipoReserva?: 'regulacao' | 'externo'; // Novo campo para tipo de reserva
}

export interface Setor {
  id: string;
  nomeSetor: string;
  siglaSetor: string;
}

// Tipo para leito enriquecido com dados do paciente
export type LeitoEnriquecido = Leito & {
  statusLeito: HistoricoLeito['statusLeito'];
  dataAtualizacaoStatus?: string;
  motivoBloqueio?: string;
  regulacao?: InfoRegulacao;
  dadosPaciente?: Paciente | null;
};

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

// Informações básicas das regulações para listagens e auditoria
export interface Regulacao {
  id: string;
  status: 'Pendente' | 'Concluída' | 'Cancelada';
  criadaEm: string; // ISO string
  concluidaEm?: string; // ISO string
  setorOrigemNome: string;
  setorDestinoNome: string;
  historicoEventos: Array<{ evento: string; timestamp: string }>;
  justificativaHomonimo?: string;
  pacienteId: string;
}

// Alias for backward compatibility
export interface DadosPaciente extends Paciente {}
export interface HistoricoMovimentacao extends HistoricoLeito {}
