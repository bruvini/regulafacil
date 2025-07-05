
import { DadosPaciente } from '@/types/hospital';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LogIn, User, Calendar, Stethoscope, Clock } from 'lucide-react';
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
}

export const PacientePendenteItem = ({ paciente }: PacientePendenteItemProps) => {
  const idade = calcularIdade(paciente.dataNascimento);
  const tempoInternado = calcularDuracao(paciente.dataInternacao);
  const corSexo = paciente.sexoPaciente === 'Feminino' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800';

  return (
    <div className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex-grow space-y-1">
        <p className="font-bold text-sm text-foreground">{paciente.nomePaciente}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Badge className={corSexo}>{paciente.sexoPaciente.charAt(0)}</Badge>
          <div className="flex items-center gap-1"><User className="h-3 w-3" /> {idade} anos</div>
          <div className="flex items-center gap-1"><Stethoscope className="h-3 w-3" /> {paciente.especialidadePaciente}</div>
          <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {tempoInternado}</div>
        </div>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <LogIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Regular Leito</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
