
import { SolicitacaoCirurgica } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bed, Calendar, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';

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

interface Props {
  cirurgia: SolicitacaoCirurgica;
  onAlocarLeito: (cirurgia: SolicitacaoCirurgica) => void;
}

export const CirurgiaEletivaItem = ({ cirurgia, onAlocarLeito }: Props) => {
  const idade = calcularIdade(cirurgia.dataNascimento);
  const dataInternacaoFormatada = cirurgia.dataPrevistaInternacao ? 
    format(cirurgia.dataPrevistaInternacao, 'dd/MM/yyyy') : 
    'Data inválida';

  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
      <div>
        <p className="font-bold text-sm">{cirurgia.nomeCompleto} ({idade}a • {cirurgia.sexo.charAt(0)})</p>
        <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
          <span className="flex items-center gap-1">
            <Stethoscope className="h-3 w-3" />
            {cirurgia.especialidade}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Interna em: {dataInternacaoFormatada}
          </span>
          <span className="font-semibold">{cirurgia.tipoLeitoNecessario}</span>
        </div>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => onAlocarLeito(cirurgia)}>
              <Bed className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Alocar Leito</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
