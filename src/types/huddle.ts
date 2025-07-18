
export interface Huddle {
  id: string;
  data: Date;
  turno: 'Manhã' | 'Tarde';
  responsavelAbertura: {
    uid: string;
    nome: string;
  };
  indicadoresDoDia: {
    taxaOcupacao: number;
    totalPendentes: number;
    vagasUTI: number;
    altasPlaneadas: number;
  };
  status: 'Aberto' | 'Finalizado';
}

export interface Pendencia {
  id: string;
  titulo: string;
  categoria: 'ALTA_PROLONGADA' | 'VAGA_UTI' | 'SISREG' | 'INTERNACAO_PROLONGADA' | 'OUTROS';
  descricao: string;
  pacienteId?: string;
  responsavel: {
    uid: string;
    nome: string;
  };
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'RESOLVIDO';
  dataCriacao: Date;
  comentarios?: Comentario[];
}

export interface Comentario {
  id: string;
  texto: string;
  autor: {
    uid: string;
    nome: string;
  };
  data: Date;
}

export interface NovaPendencia {
  titulo: string;
  categoria: 'ALTA_PROLONGADA' | 'VAGA_UTI' | 'SISREG' | 'INTERNACAO_PROLONGADA' | 'OUTROS';
  descricao: string;
  pacienteId?: string;
  responsavel: {
    uid: string;
    nome: string;
  };
}
