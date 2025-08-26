
// Representa uma pendência para a alta do paciente
export interface KanbanPendencia {
  id: string; // UUID para identificação única
  texto: string;
  criadaEm: string; // ISO Timestamp
  criadaPor: string; // Nome do usuário
  resolvida: boolean;
  resolvidaEm?: string;
  resolvidaPor?: string;
}

// Representa uma nota ou encaminhamento sobre o paciente
export interface KanbanTratativa {
  id: string; // UUID
  texto: string;
  criadaEm: string; // ISO Timestamp
  criadaPor: string;
}

// O documento principal na coleção kanbanRegulaFacil
export interface KanbanEntry {
  id: string; // Cópia do pacienteId
  pacienteId: string;
  monitoradoDesde: string;
  monitoradoPor: string;
  ultimaAtualizacao: string;
  previsaoAlta?: string; // Data no formato 'AAAA-MM-DD'
  pendencias: KanbanPendencia[];
  tratativas: KanbanTratativa[];
  finalizado: boolean; // Para "arquivar" o monitoramento
  finalizadoEm?: string;
  finalizadoPor?: string;
}

// Tipo enriquecido com dados do paciente para exibição
export interface KanbanEntryEnriquecida extends KanbanEntry {
  dadosPaciente?: {
    nomeCompleto: string;
    dataInternacao: string;
    especialidadePaciente: string;
    leitoAtual?: string;
    setorAtual?: string;
    tempoInternacao?: string;
  };
}
