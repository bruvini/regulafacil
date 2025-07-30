
export interface Paciente {
  id: string;
  leitoId: string;
  setorId: string;
  nomeCompleto: string;
  dataNascimento: string;
  sexoPaciente: string;
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
  origem?: {
    deSetor: string;
    deLeito: string;
  };
  historicoTransferencia?: any[];
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
  statusLeito: string;
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
  sexo: string;
  especialidade: string;
  tipoLeitoNecessario: string;
  dataPrevistaInternacao: Date;
}

export interface SolicitacaoCirurgicaFormData {
  nomeCompleto: string;
  dataNascimento: string;
  sexo: string;
  especialidade: string;
  tipoLeitoNecessario: string;
  dataPrevistaInternacao: Date;
}

// Alias for backward compatibility
export interface DadosPaciente extends Paciente {}
export interface HistoricoMovimentacao extends HistoricoLeito {}
