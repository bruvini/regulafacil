
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { formatarDuracao } from '@/lib/utils';

interface Props {
  paciente: any;
  onCancelar: (paciente: any, motivo: string) => void;
  onConcluir: (paciente: any) => void;
  onConfirmar: (paciente: any, leitoDestino: any, pacienteParaLeito: any, observacoes: string) => void;
}

export const RegulacaoPendenteItem = ({ paciente, onCancelar, onConcluir, onConfirmar }: Props) => {
  const tempoAguardando = formatarDuracao(paciente.regulacao?.data);
  
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
        <p className="text-xs text-green-600 mt-1">
          Regulado para: {paciente.regulacao?.paraSetor} - {paciente.regulacao?.paraLeito}
        </p>
        {paciente.regulacao?.observacoes && (
          <p className="text-xs text-muted-foreground">
            Obs: {paciente.regulacao.observacoes}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs font-mono text-green-600">
          <Clock className="h-3 w-3"/>
          {tempoAguardando}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => onConfirmar(paciente, null, null, '')}
              >
                <ArrowRight className="h-4 w-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Confirmar Regulação</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => onConcluir(paciente)}
              >
                <CheckCircle className="h-4 w-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Concluir Regulação</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive" 
                onClick={() => onCancelar(paciente, 'Cancelamento manual')}
              >
                <XCircle className="h-4 w-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Cancelar Regulação</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
