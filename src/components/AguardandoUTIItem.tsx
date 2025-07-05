
import { DadosPaciente } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BedDouble, Ambulance, X, Clock } from 'lucide-react';
import { intervalToDuration, parseISO } from 'date-fns';

const calcularDuracao = (dataISO?: string): string => {
    if (!dataISO) return 'N/A';
    const duracao = intervalToDuration({ start: parseISO(dataISO), end: new Date() });
    const partes = [];
    if (duracao.days && duracao.days > 0) partes.push(`${duracao.days}d`);
    if (duracao.hours && duracao.hours > 0) partes.push(`${duracao.hours}h`);
    if (duracao.minutes) partes.push(`${duracao.minutes}m`);
    return partes.length > 0 ? partes.join(' ') : 'Recente';
};

interface Props {
  paciente: any;
  onCancel: () => void;
  onTransfer: () => void;
}

export const AguardandoUTIItem = ({ paciente, onCancel, onTransfer }: Props) => {
  const tempoAguardando = calcularDuracao(paciente.dataPedidoUTI);
  
  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
      <div>
        <p className="font-bold text-sm">{paciente.nomePaciente}</p>
        <p className="text-xs text-muted-foreground">
          {paciente.setorOrigem} - {paciente.especialidadePaciente}
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
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <BedDouble className="h-4 w-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Regular Leito de UTI</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onTransfer}>
                <Ambulance className="h-4 w-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Transferência Externa</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onCancel}>
                <X className="h-4 w-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Cancelar Pedido de UTI</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
