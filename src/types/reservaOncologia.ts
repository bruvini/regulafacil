export interface TentativaContato {
  data: string; // ISO format
  sucesso: boolean;
  motivoFalha?:
    | 'CAIXA POSTAL'
    | 'NÃO RESPONDEU'
    | 'SINTOMAS RESPIRATÓRIOS'
    | 'RECUSA PARA INTERNAÇÃO'
    | 'ÓBITO'
    | 'SEM MEDICAÇÃO'
    | 'JÁ INTERNADO';
}

export interface ReservaOncologia {
  id: string;
  nomeCompleto: string;
  dataNascimento: string;
  sexo: 'Masculino' | 'Feminino';
  telefone: string;
  dataPrevistaInternacao: string;
  especialidade: 'HEMATOLOGIA' | 'ONCOLOGIA';
  status: 'aguardando' | 'internado';
  tentativasContato?: TentativaContato[];
}
