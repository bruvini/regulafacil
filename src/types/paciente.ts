
import { Timestamp } from 'firebase/firestore';

export interface Paciente {
  id: string;
  nomeCompleto: string;
  idade: number;
  dataNascimento: string;
  sexoPaciente: 'Masculino' | 'Feminino';
  especialidadePaciente: string;
  condicaoClinica: string;
  leitoNecessario: string;
  prioridade?: string;
  solicitadoPor: string;
  dataSolicitacao?: Timestamp;
  dataInternacao: string;
  leitoId?: string;
  setorId?: string;
  origem: {
    deSetor: string;
    deLeito: string;
  };
  obsPaciente?: Array<{
    id: string;
    texto: string;
    timestamp: string;
    usuario: string;
  }>;
  regulacao?: {
    paraSetor: string;
    timestamp: Timestamp;
  };
}
