// src/components/RemanejamentoPendenteItem.tsx

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRightLeft, Clock, XCircle } from 'lucide-react';
import { formatarDuracao, descreverMotivoRemanejamento } from '@/lib/utils';
import type { Paciente } from '@/types/hospital';

interface Props {
  paciente: Paciente;
  onRemanejar: (paciente: Paciente) => void;
  onCancelar: (paciente: Paciente) => void;
}

export const RemanejamentoPendenteItem = ({ paciente, onRemanejar, onCancelar }: Props) => {
  const tempoAguardando = formatarDuracao(paciente.dataPedidoRemanejamento);

  return (
    <Card className="flex flex-col justify-between">
      <CardContent className="p-4 pb-2">
        <p className="font-bold text-sm">
          {paciente.nomeCompleto}{' '}
          <Badge variant="outline">{paciente.sexoPaciente.charAt(0)}</Badge>
        </p>
        <p className="text-xs text-muted-foreground">
          {paciente.siglaSetorOrigem || paciente.setorOrigem} - {paciente.leitoCodigo}
        </p>
        <p className="text-xs text-amber-600 mt-1">
          {descreverMotivoRemanejamento(paciente.motivoRemanejamento)}
        </p>
      </CardContent>
      <CardFooter className="p-2 pt-0 flex justify-between items-center">
        <div className="flex items-center gap-1 text-xs font-mono text-amber-600">
          <Clock className="h-3 w-3" />
          {tempoAguardando}
        </div>
        <TooltipProvider>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemanejar(paciente)}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remanejar Paciente</p>
              </TooltipContent>
            </Tooltip>
            <AlertDialog>
              <Tooltip>
                <AlertDialogTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                </AlertDialogTrigger>
                <TooltipContent>
                  <p>Cancelar Solicitação</p>
                </TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar Solicitação</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja cancelar esta solicitação de remanejamento?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onCancelar(paciente)}>
                    Confirmar Cancelamento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};