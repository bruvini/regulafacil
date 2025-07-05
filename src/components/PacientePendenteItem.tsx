
import { DadosPaciente } from '@/types/hospital';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LogIn, LogOut, Clock } from 'lucide-react';
import { intervalToDuration, parse } from 'date-fns';

// Função para calcular idade
const calcularIdade = (dataNascimento: string): string => {
  if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return '?';
  const [dia, mes, ano] = dataNascimento.split('/').map(Number);
  const hoje = new Date();
  const nascimento = new Date(ano, mes - 1, dia);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade.toString();
};

// Função para calcular a duração da internação
const calcularDuracao = (dataInternacao: string): string => {
    if (!dataInternacao || !dataInternacao.includes(' ')) return 'N/A';
    const dataEntrada = parse(dataInternacao, 'dd/MM/yyyy HH:mm', new Date());
    if (isNaN(dataEntrada.getTime())) return 'Data inválida';
    
    const duracao = intervalToDuration({ start: dataEntrada, end: new Date() });
    const partes = [];
    if (duracao.days && duracao.days > 0) partes.push(`${duracao.days}d`);
    if (duracao.hours && duracao.hours > 0) partes.push(`${duracao.hours}h`);
    if (duracao.minutes) partes.push(`${duracao.minutes}m`);
    return partes.length > 0 ? partes.join(' ') : 'Recente';
};

interface PacientePendenteItemProps {
  paciente: DadosPaciente;
  onAlta?: () => void;
}

export const PacientePendenteItem = ({ paciente, onAlta }: PacientePendenteItemProps) => {
  const idade = calcularIdade(paciente.dataNascimento);
  const tempoInternado = calcularDuracao(paciente.dataInternacao);

  return (
    <div className="flex items-start gap-4 p-2 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm text-foreground">{paciente.nomePaciente}</p>
          <Badge variant="outline" className="text-xs">
            {paciente.sexoPaciente.charAt(0)} - {idade}a
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span>{paciente.especialidadePaciente}</span>
          <span className="text-gray-400">•</span>
          <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {tempoInternado}</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <LogIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Regular Leito</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {onAlta && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={onAlta}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Dar Alta da Recuperação</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
