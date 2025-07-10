import { ShieldAlert } from 'lucide-react';

interface Props {
  isolamentos: string[];
  sexo?: 'Masculino' | 'Feminino';
}

export const LeitoStatusIsolamento = ({ isolamentos, sexo }: Props) => {
  const motivo = `Apenas para pacientes ${sexo === 'Masculino' ? 'masculinos' : 'femininos'} com isolamento por ${isolamentos.join(', ')}.`;

  return (
    <div className="flex items-start space-x-2 p-2 bg-amber-50 border border-amber-200 rounded-md h-full">
      <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
      <div className="text-xs text-amber-800">
        <p className="font-medium">Leito bloqueado por coorte de isolamento.</p>
        <p>{motivo}</p>
      </div>
    </div>
  );
};