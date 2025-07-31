
// src/components/PacientePendenteItem.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
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
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

import {
  LogIn,
  LogOut,
  Clock,
  CheckCheck,
  Pencil,
  XCircle
} from 'lucide-react';

import { formatarDuracao } from '@/lib/utils';
import { Paciente } from '@/types/hospital';

// Função auxiliar
const calcularIdade = (dataNascimento: string): string => {
  if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return '?';
  const [dia, mes, ano] = dataNascimento.split('/').map(Number);
  const hoje = new Date();
  const nascimento = new Date(ano, mes - 1, dia);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade.toString();
};

interface PacientePendenteItemProps {
  paciente: Paciente & {
    setorOrigem: string;
    siglaSetorOrigem: string;
    leitoCodigo: string;
    leitoId: string;
    statusLeito: string;
    regulacao?: any;
  };
  onRegularClick?: () => void;
  onAlta?: () => void;
  onConcluir?: (paciente: Paciente) => void;
  onAlterar?: (paciente: Paciente) => void;
  onCancelar?: (paciente: Paciente) => void;
}

export const PacientePendenteItem = ({
  paciente,
  onRegularClick,
  onAlta,
  onConcluir,
  onAlterar,
  onCancelar
}: PacientePendenteItemProps) => {
  const idade = calcularIdade(paciente.dataNascimento);
  
  console.log('PacientePendenteItem - paciente:', paciente);
  console.log('PacientePendenteItem - nomeCompleto:', paciente.nomeCompleto);

  return (
    <div className="flex items-start gap-4 p-2 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm text-foreground">
            {paciente.nomeCompleto || 'Nome não disponível'}
          </p>
          <Badge variant="outline" className="text-xs">
            {paciente.sexoPaciente?.charAt(0) || '?'} - {idade}a
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          {paciente.statusLeito === 'Regulado' ? (
            <>
              <span className="font-semibold text-purple-600">Destino:</span>
              <span>
                {paciente.regulacao?.paraSetorSigla || 'Setor desconhecido'} -{' '}
                {paciente.regulacao?.paraLeito || 'Leito não informado'}
              </span>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatarDuracao(paciente.regulacao?.data)}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatarDuracao(paciente.dataInternacao)}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {paciente.statusLeito === 'Regulado' ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onConcluir?.(paciente)}
                  aria-label="Concluir regulação"
                >
                  <CheckCheck className="h-4 w-4 text-green-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Concluir Regulação</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onAlterar?.(paciente)}
                  aria-label="Alterar regulação"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Alterar Regulação</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onCancelar?.(paciente)}
                  aria-label="Cancelar regulação"
                >
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Cancelar Regulação</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onRegularClick}
                  aria-label="Regular leito"
                >
                  <LogIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Regular Leito</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {onAlta && (
          <AlertDialog>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600"
                      aria-label="Informar alta"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Informar Alta</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Alta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá liberar o leito do paciente. Deseja continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onAlta}>Confirmar Alta</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};
