
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatarDuracao } from '@/lib/utils';
import { format, differenceInMilliseconds } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientesPendentes: any[];
  pacientesRegulados: any[];
  dataInicio: string;
  dataFim: string;
}

export const PanoramaVisualizacaoModal = ({ 
  open, 
  onOpenChange, 
  pacientesPendentes, 
  pacientesRegulados,
  dataInicio,
  dataFim
}: Props) => {
  const { toast } = useToast();

  const gerarTextoFormatado = () => {
    let texto = '*REGULAÇÕES PENDENTES*\n\n';

    // Seção de regulações pendentes
    if (pacientesPendentes.length > 0) {
      pacientesPendentes.forEach(paciente => {
        const tempoAguardando = formatarDuracao(paciente.dataInternacao);
        texto += `${paciente.siglaSetorOrigem} - ${paciente.nomeCompleto} / VAI PARA: ${paciente.regulacao?.paraSetorSigla || 'N/A'} - ${paciente.regulacao?.paraLeito || 'N/A'} / AGUARDANDO HÁ: ${tempoAguardando}\n`;
      });
    } else {
      texto += '_Nenhuma regulação pendente no momento._\n';
    }

    texto += '\n---\n\n';

    // Seção de regulações do período
    const dataInicioFormatada = format(new Date(dataInicio), 'dd/MM/yyyy HH:mm');
    const dataFimFormatada = format(new Date(dataFim), 'dd/MM/yyyy HH:mm');
    
    texto += `*REGULAÇÕES NO PERÍODO (${dataInicioFormatada} - ${dataFimFormatada})*\n\n`;

    // Filtrar regulações do período
    const regulacoesDoPeriodo = pacientesRegulados.filter(paciente => {
      if (!paciente.regulacao?.data) return false;
      const dataRegulacao = new Date(paciente.regulacao.data);
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      return dataRegulacao >= inicio && dataRegulacao <= fim;
    });

    if (regulacoesDoPeriodo.length > 0) {
      regulacoesDoPeriodo.forEach(paciente => {
        const dataRegulacao = new Date(paciente.regulacao.data);
        const dataConclusao = new Date(paciente.regulacao.dataAtualizacaoStatus || paciente.regulacao.data);
        const tempoTransferencia = differenceInMilliseconds(dataConclusao, dataRegulacao);
        const tempoFormatado = formatarDuracao(dataRegulacao.toISOString());
        
        texto += `${paciente.siglaSetorOrigem} - ${paciente.nomeCompleto} -> FOI PARA ${paciente.regulacao?.paraSetorSigla || 'N/A'} - ${paciente.regulacao?.paraLeito || 'N/A'} / TEMPO DE TRANSFERÊNCIA: ${tempoFormatado}\n`;
      });
    } else {
      texto += '_Nenhuma regulação realizada no período selecionado._\n';
    }

    return texto;
  };

  const handleCopiar = () => {
    const texto = gerarTextoFormatado();
    navigator.clipboard.writeText(texto);
    toast({
      title: 'Copiado!',
      description: 'Panorama copiado para a área de transferência.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Panorama de Regulações</DialogTitle>
          <DialogDescription>
            Relatório formatado pronto para copiar e compartilhar
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0 flex flex-col">
          <div className="flex justify-end mb-4">
            <Button onClick={handleCopiar} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copiar Texto
            </Button>
          </div>
          <ScrollArea className="flex-grow border rounded-md p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {gerarTextoFormatado()}
            </pre>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
