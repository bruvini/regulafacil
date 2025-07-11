
import { DadosPaciente } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ClipboardList, X, Clock } from 'lucide-react';
import { formatarDuracao } from '@/lib/utils';

interface Props {
  paciente: any;
  onCancel: () => void;
}

export const AguardandoTransferenciaItem = ({ paciente, onCancel }: Props) => {
  const tempoAguardando = formatarDuracao(paciente.dataTransferencia);
  
  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
      <div>
        <p className="font-bold text-sm">{paciente.nomePaciente} → {paciente.destinoTransferencia}</p>
        <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{paciente.statusTransferencia}</Badge>
            <p className="text-xs text-muted-foreground">Motivo: {paciente.motivoTransferencia}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs font-mono text-orange-600">
          <Clock className="h-3 w-3"/>
          {tempoAguardando}
        </div>
        <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ClipboardList className="h-4 w-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Gerenciar Status</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onCancel}>
                  <X className="h-4 w-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Cancelar Transferência</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
