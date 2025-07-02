
export interface Paciente {
  id: string;
  nomePaciente: string;
  nomeNormalizado: string; // Nome em maiúsculas e sem acentos, para busca
  dataNascimento: string;
  sexo: 'Masculino' | 'Feminino';
  setorAtual?: string;
  leitoAtual?: string;
  especialidade?: string;
  dataInternacao?: string;
}

export interface HistoricoStatus {
  status: 'Vago' | 'Ocupado' | 'Bloqueado' | 'Higienizacao';
  timestamp: string; // ISO 8601
  pacienteId?: string | null; // ID do paciente que ocupou/liberou
  motivo?: string; // Para bloqueios, etc.
}

export interface Leito {
  id: string;
  codigoLeito: string;
  leitoPCP: boolean;
  leitoIsolamento: boolean;
  statusLeito: 'Vago' | 'Ocupado' | 'Bloqueado' | 'Higienizacao';
  dataAtualizacaoStatus: string;
  motivoBloqueio?: string;
  pacienteId: string | null; // ID do paciente atualmente no leito, ou null se vago
  historicoStatus: HistoricoStatus[];
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

// Interfaces para o Motor de Reconciliação
export interface PacienteImportado {
  nomePaciente: string;
  dataNascimento: string;
  sexo: string;
  dataInternacao: string;
  setor: string;
  leito: string;
  especialidade: string;
}

export interface NovaAdmissao {
  tipo: 'nova_admissao';
  paciente: Paciente;
  setorId: string;
  leitoId: string;
}

export interface MovimentacaoLeito {
  tipo: 'movimentacao';
  pacienteId: string;
  nomePaciente: string;
  leitoOrigemId: string;
  leitoDestinoId: string;
  setorOrigemId: string;
  setorDestinoId: string;
}

export interface AguardandoRegulacao {
  tipo: 'aguardando_regulacao';
  paciente: Paciente;
  motivo: 'ps_decisao' | 'cc_recuperacao' | 'outro';
}

export interface PendenciaAlta {
  tipo: 'pendencia_alta';
  pacienteId: string;
  nomePaciente: string;
  setorAtual: string;
  leitoAtual: string;
}

export type AcaoReconciliacao = NovaAdmissao | MovimentacaoLeito | AguardandoRegulacao | PendenciaAlta;

export interface PlanoDeMudancas {
  novasAdmissoes: NovaAdmissao[];
  movimentacoes: MovimentacaoLeito[];
  aguardandoRegulacao: AguardandoRegulacao[];
  pendenciasAlta: PendenciaAlta[];
  totalAcoes: number;
}

export interface ResultadoValidacao {
  pacientesValidados: number;
  discrepancias: Record<string, string[]>;
  validacaoCompleta: boolean;
}
