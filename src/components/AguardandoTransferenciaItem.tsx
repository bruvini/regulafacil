
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ClipboardList, X, Clock } from 'lucide-react';
import { formatarDuracao } from '@/lib/utils';

interface Props {
  paciente: any;
  onCancel: () => void;
  onGerenciar?: () => void;
}

export const AguardandoTransferenciaItem = ({ paciente, onCancel, onGerenciar }: Props) => {
  const tempoAguardando = formatarDuracao(paciente.dataTransferencia);
  
  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
      <div>
        <p className="font-bold text-sm">{paciente.nomeCompleto} → {paciente.destinoTransferencia}</p>
        <div className="flex items-center gap-2 mt-1">
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
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onGerenciar}>
                  <ClipboardList className="h-4 w-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Gerenciar Status</p></TooltipContent>
            </Tooltip>
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <X className="h-4 w-4"/>
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Cancelar Transferência</p></TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar Transferência?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação removerá o paciente da fila de transferência externa.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={onCancel}>Confirmar Cancelamento</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </TooltipProvider>
      </div>
    </div>
  );
};
