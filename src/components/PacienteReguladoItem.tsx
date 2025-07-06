
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCheck, Pencil, XCircle } from 'lucide-react';

interface Props {
  paciente: any;
  onConcluir: (paciente: any) => void;
  onAlterar: (paciente: any) => void;
  onCancelar: (paciente: any) => void;
}

export const PacienteReguladoItem = ({ paciente, onConcluir, onAlterar, onCancelar }: Props) => {
  return (
    <div className="flex items-center gap-4 p-3 rounded-md bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
      <div className="flex-grow">
        <p className="font-bold text-sm text-purple-900 dark:text-purple-100">
          {paciente.nomePaciente} 
          <Badge variant="outline" className="ml-2">
            {paciente.sexoPaciente.charAt(0)}
          </Badge>
        </p>
        <p className="text-xs text-muted-foreground">
          Origem: {paciente.siglaSetorOrigem} - {paciente.leitoCodigo}
        </p>
        <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mt-1">
          Destino: {paciente.regulacao?.paraSetorSigla} - {paciente.regulacao?.paraLeito}
        </p>
      </div>
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onConcluir(paciente)}
                className="h-8 w-8 p-0"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Concluir Regulação</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onAlterar(paciente)}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Alterar Regulação</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onCancelar(paciente)}
                className="h-8 w-8 p-0"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cancelar Regulação</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
