
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, ExternalLink } from 'lucide-react';
import { formatarDuracao } from '@/lib/utils';

interface Props {
  paciente: any;
}

export const TransferenciaPendenteItem = ({ paciente }: Props) => {
  const tempoAguardando = formatarDuracao(paciente.dadosPaciente?.dataTransferencia);
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
      <div>
        <p className="font-bold text-sm">
          {paciente.dadosPaciente?.nomePaciente} 
          <Badge variant="outline">{paciente.dadosPaciente?.sexoPaciente?.charAt(0)}</Badge>
        </p>
        <p className="text-xs text-muted-foreground">
          {paciente.siglaSetor} - {paciente.codigoLeito}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Destino: {paciente.dadosPaciente?.destinoTransferencia}
        </p>
        <p className="text-xs text-blue-600">
          Motivo: {paciente.dadosPaciente?.motivoTransferencia}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs font-mono text-blue-600">
          <Clock className="h-3 w-3"/>
          {tempoAguardando}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-8 w-8 flex items-center justify-center">
                <ExternalLink className="h-4 w-4 text-blue-600"/>
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Transferência Externa</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
