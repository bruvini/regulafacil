
import { SolicitacaoCirurgica } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Bed, Calendar, Stethoscope } from 'lucide-react';

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

  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
      <div>
        <p className="font-bold text-sm">{cirurgia.nomeCompleto} ({idade}a • {cirurgia.sexo.charAt(0)})</p>
        <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
          <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" />{cirurgia.especialidade}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Interna em: {new Date(cirurgia.dataPrevistaInternacao).toLocaleDateString('pt-BR')}</span>
          <span className="font-semibold">{cirurgia.tipoLeitoNecessario}</span>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => onAlocarLeito(cirurgia)}>
        <Bed className="mr-2 h-4 w-4" /> Alocar Leito
      </Button>
    </div>
  );
};
