
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCheck, Pencil, XCircle, Copy, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatarDuracao } from '@/lib/utils';

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
  paciente: any;
  onConcluir: (paciente: any) => void;
  onAlterar: (paciente: any) => void;
  onCancelar: (paciente: any) => void;
}

export const PacienteReguladoItem = ({ paciente, onConcluir, onAlterar, onCancelar }: Props) => {
  const { toast } = useToast();
  const tempoRegulado = formatarDuracao(paciente.regulacao.data);
  const idade = calcularIdade(paciente.dataNascimento);

  const gerarMensagem = () => {
    const isolamentos = paciente.isolamentosVigentes?.map((i: any) => i.sigla).join(', ') || 'Nenhum';
    const obs = paciente.regulacao.observacoes ? `\nObservações NIR: ${paciente.regulacao.observacoes}` : "";
    
    return `⚠️ LEITO REGULADO ⚠️
Paciente: ${paciente.nomePaciente} - ${paciente.sexoPaciente} - ${idade} anos
Origem: ${paciente.siglaSetorOrigem} - ${paciente.leitoCodigo}
Destino: ${paciente.regulacao.paraSetorSigla} - ${paciente.regulacao.paraLeito}
Isolamento: ${isolamentos}${obs}

- Fazer contato com o destino para passar plantão e agilizar transferências. Avisar o NIR caso haja alguma intercorrência, dificuldade na passagem de plantão ou demais eventualidades!

Data e hora da regulação: ${new Date(paciente.regulacao.data).toLocaleString('pt-BR')}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(gerarMensagem());
    toast({ title: "Copiado!", description: "Mensagem copiada para área de transferência." });
  };

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
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className="font-semibold text-purple-700 dark:text-purple-300">
            Destino: {paciente.regulacao?.paraSetorSigla} - {paciente.regulacao?.paraLeito}
          </span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {tempoRegulado}
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopy}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copiar Mensagem</p>
            </TooltipContent>
          </Tooltip>
          
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
