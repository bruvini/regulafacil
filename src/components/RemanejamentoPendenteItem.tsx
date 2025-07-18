
import { DadosPaciente } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowRightLeft, Clock, XCircle } from 'lucide-react';
import { formatarDuracao } from '@/lib/utils';

interface Props {
  paciente: any;
  onRemanejar: (paciente: any) => void;
  onCancelar: (paciente: any) => void;
}

export const RemanejamentoPendenteItem = ({ paciente, onRemanejar, onCancelar }: Props) => {
    const tempoAguardando = formatarDuracao(paciente.dataPedidoRemanejamento);
    return (
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
            <div>
                <p className="font-bold text-sm">{paciente.nomeCompleto} <Badge variant="outline">{paciente.sexoPaciente.charAt(0)}</Badge></p>
                <p className="text-xs text-muted-foreground">{paciente.siglaSetorOrigem || paciente.setorOrigem} - {paciente.leitoCodigo}</p>
                <p className="text-xs text-amber-600 mt-1">Motivo: {paciente.motivoRemanejamento}</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs font-mono text-amber-600">
                    <Clock className="h-3 w-3"/>
                    {tempoAguardando}
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemanejar(paciente)}>
                                <ArrowRightLeft className="h-4 w-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Remanejar Paciente</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onCancelar(paciente)}>
                                <XCircle className="h-4 w-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Cancelar Solicitação</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};
