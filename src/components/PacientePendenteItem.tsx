// src/components/PacientePendenteItem.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { Biohazard, Clock, CheckCircle, LogOut } from 'lucide-react'; // Ícones atualizados
import { formatarDuracao } from '@/lib/utils';
import { Paciente, IsolamentoVigente } from '@/types/hospital'; // Tipo IsolamentoVigente importado
import { usePacientes } from '@/hooks/usePacientes';
import { useAuth } from '@/hooks/useAuth';

// A interface de props permanece a mesma
interface PacientePendenteItemProps {
  paciente: Paciente;
  onRegularClick: (paciente: Paciente) => void;
  onConcluir?: (paciente: Paciente) => void;
  onAlterar?: (paciente: Paciente) => void;
  onCancelar?: (paciente: Paciente) => void;
  onAltaDireta?: (paciente: any) => void;
  onAlta?: (paciente: Paciente) => void;
}

// A função de calcular idade permanece a mesma
const calcularIdade = (dataNascimento?: string): string => {
  if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return '?';
  const [dia, mes, ano] = dataNascimento.split('/').map(Number);
  let idade = new Date().getFullYear() - ano;
  const m = new Date().getMonth() - (mes - 1);
  if (m < 0 || (m === 0 && new Date().getDate() < dia)) idade--;
  return idade.toString();
};

export const PacientePendenteItem = ({ paciente, onRegularClick }: PacientePendenteItemProps) => {
  const idade = calcularIdade(paciente.dataNascimento);
  const { darAltaPaciente } = usePacientes();
  const { currentUser } = useAuth();

  // Substitua o return atual por este JSX aprimorado:
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border">
      
      {/* Coluna da Esquerda: Informações do Paciente (com correção de overflow) */}
      <div className="flex-grow min-w-0"> {/* min-w-0 é a chave para evitar o overflow */}
        
        {/* Linha 1: Nome (com truncamento), Idade/Sexo e Alerta de Isolamento */}
        <div className="flex items-center gap-2">
          <p className="font-bold text-base truncate" title={paciente.nomeCompleto}>
            {paciente.nomeCompleto}
          </p>
          <Badge variant="outline" className="text-xs flex-shrink-0">
            {paciente.sexoPaciente?.charAt(0)} - {idade}a
          </Badge>
          
          {/* Badge de Isolamento Condicional (com tooltip corrigido) */}
          {paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="destructive" className="cursor-help flex-shrink-0">
                    <Biohazard className="h-4 w-4" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-bold">Isolamentos Ativos:</p>
                  <ul className="list-disc list-inside">
                    {/* CORREÇÃO: Usando a 'sigla' que é garantida de existir */}
                    {paciente.isolamentosVigentes.map((iso: IsolamentoVigente) => (
                      <li key={iso.sigla}>- {iso.sigla}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Linha 2: Especialidade e Tempo de Internação (com fonte menor) */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          <span>{paciente.especialidadePaciente}</span>
          <span className="text-gray-400">•</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatarDuracao(paciente.dataInternacao)}</span>
          </div>
        </div>

      </div>

      {/* Coluna da Direita: Botões de Ação com Ícones e Tooltips */}
      <div className="flex items-center flex-shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => onRegularClick(paciente)}>
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Regular Paciente</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <AlertDialog>
          <TooltipProvider>
            <Tooltip>
              <AlertDialogTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <LogOut className="h-5 w-5 text-destructive" />
                  </Button>
                </TooltipTrigger>
              </AlertDialogTrigger>
              <TooltipContent><p>Dar Alta</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Alta do Paciente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. O paciente "{paciente.nomeCompleto}" será removido do sistema e seu leito ({paciente.leitoId}) será enviado para higienização.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => darAltaPaciente(paciente, currentUser)}>
                Confirmar Alta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

