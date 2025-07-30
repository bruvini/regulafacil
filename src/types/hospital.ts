export interface Paciente {
  id: string;
  leitoId: string;
  setorId: string;
  nomeCompleto: string;
  dataNascimento: string;
  sexoPaciente: string;
  dataInternacao: string;
  especialidadePaciente: string;
  isolamentosVigentes?: string[];
  aguardaUTI?: boolean;
  dataPedidoUTI?: string;
  transferirPaciente?: boolean;
  destinoTransferencia?: string;
  motivoTransferencia?: string;
  dataTransferencia?: string;
  remanejarPaciente?: boolean;
  motivoRemanejamento?: string;
  dataPedidoRemanejamento?: string;
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
