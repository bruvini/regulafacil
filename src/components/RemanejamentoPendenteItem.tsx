
import { DadosPaciente } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowRightLeft, Clock } from 'lucide-react';
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

export const RemanejamentoPendenteItem = ({ paciente }: { paciente: any }) => {
    const tempoAguardando = calcularDuracao(paciente.dataPedidoRemanejamento);
    return (
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
            <div>
                <p className="font-bold text-sm">{paciente.nomePaciente} <Badge variant="outline">{paciente.sexoPaciente.charAt(0)}</Badge></p>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ArrowRightLeft className="h-4 w-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Remanejar Paciente</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};
