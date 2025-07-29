
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatarDuracao } from '@/lib/utils';
import { format, differenceInMilliseconds, isValid, differenceInHours, differenceInMinutes } from 'date-fns';

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

  const calcularTempoAguardandoRegulacao = (dataRegulacao: string): string => {
    try {
      const dataRegulacaoObj = new Date(dataRegulacao);
      if (!isValid(dataRegulacaoObj)) return 'N/A';

      const agora = new Date();
      const horas = differenceInHours(agora, dataRegulacaoObj);
      const minutos = differenceInMinutes(agora, dataRegulacaoObj) % 60;

      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}hs`;
    } catch (error) {
      console.error('Erro ao calcular tempo de aguardo:', error);
      return 'N/A';
    }
  };

  const calcularTempoTransferencia = (dataRegulacao: string, dataConfirmacao?: string): string => {
    try {
      const dataRegulacaoObj = new Date(dataRegulacao);
      const dataConfirmacaoObj = dataConfirmacao ? new Date(dataConfirmacao) : new Date();

      if (!isValid(dataRegulacaoObj) || !isValid(dataConfirmacaoObj)) return 'N/A';

      const horas = differenceInHours(dataConfirmacaoObj, dataRegulacaoObj);
      const minutos = differenceInMinutes(dataConfirmacaoObj, dataRegulacaoObj) % 60;

      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}hs`;
    } catch (error) {
      console.error('Erro ao calcular tempo de transferência:', error);
      return 'N/A';
    }
  };

  const gerarTextoFormatado = () => {
    let texto = '*REGULAÇÕES PENDENTES*\n\n';

    // Seção de regulações pendentes - pacientes regulados aguardando transferência física
    const pacientesAguardandoTransferencia = pacientesRegulados.filter(paciente => 
      paciente.regulacao && 
      paciente.regulacao.status !== 'concluido' && 
      paciente.regulacao.paraSetorSigla && 
      paciente.regulacao.paraLeito
    );

    // Ordenar por tempo de aguardo (mais tempo primeiro - ordem decrescente)
    const pacientesOrdenados = pacientesAguardandoTransferencia.sort((a, b) => {
      const dataA = new Date(a.regulacao?.data || a.regulacao?.dataAtualizacaoStatus);
      const dataB = new Date(b.regulacao?.data || b.regulacao?.dataAtualizacaoStatus);
      return dataA.getTime() - dataB.getTime(); // Mais antigo primeiro (aguardando há mais tempo)
    });

    if (pacientesOrdenados.length > 0) {
      pacientesOrdenados.forEach(paciente => {
        const tempoAguardando = calcularTempoAguardandoRegulacao(
          paciente.regulacao?.dataAtualizacaoStatus || paciente.regulacao?.data
        );
        texto += `${paciente.siglaSetorOrigem} - ${paciente.nomeCompleto} / VAI PARA: ${paciente.regulacao?.paraSetorSigla || 'N/A'} - ${paciente.regulacao?.paraLeito || 'N/A'} / AGUARDANDO HÁ: ${tempoAguardando}\n`;
      });
    } else {
      texto += '_Nenhuma regulação pendente no momento._\n';
    }

    texto += '\n---\n\n';

    // Seção de regulações do período - com validação de datas
    let dataInicioFormatada = 'Data Inválida';
    let dataFimFormatada = 'Data Inválida';

    try {
      const dataInicioObj = new Date(dataInicio);
      const dataFimObj = new Date(dataFim);

      if (isValid(dataInicioObj)) {
        dataInicioFormatada = format(dataInicioObj, 'dd/MM/yyyy HH:mm');
      }

      if (isValid(dataFimObj)) {
        dataFimFormatada = format(dataFimObj, 'dd/MM/yyyy HH:mm');
      }
    } catch (error) {
      console.error('Erro ao formatar datas do período:', error);
    }
    
    texto += `*REGULAÇÕES NO PERÍODO (${dataInicioFormatada} - ${dataFimFormatada})*\n\n`;

    // Filtrar regulações do período - buscar na coleção regulacoesRegulaFacil
    const regulacoesDoPeriodo = pacientesRegulados.filter(paciente => {
      if (!paciente.regulacao?.data) return false;
      
      try {
        const dataRegulacao = new Date(paciente.regulacao.data);
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        
        // Verificar se a regulação foi concluída no período selecionado
        return isValid(dataRegulacao) && isValid(inicio) && isValid(fim) && 
               dataRegulacao >= inicio && dataRegulacao <= fim &&
               paciente.regulacao.status === 'concluido';
      } catch (error) {
        console.error('Erro ao validar data de regulação:', error);
        return false;
      }
    });

    if (regulacoesDoPeriodo.length > 0) {
      regulacoesDoPeriodo.forEach(paciente => {
        try {
          const tempoTransferencia = calcularTempoTransferencia(
            paciente.regulacao.data,
            paciente.regulacao.dataConfirmacaoChegada || paciente.regulacao.dataAtualizacaoStatus
          );
          
          texto += `${paciente.siglaSetorOrigem} - ${paciente.nomeCompleto} -> FOI PARA ${paciente.regulacao?.paraSetorSigla || 'N/A'} - ${paciente.regulacao?.paraLeito || 'N/A'} / TEMPO DE TRANSFERÊNCIA: ${tempoTransferencia}\n`;
        } catch (error) {
          console.error('Erro ao processar regulação:', error, paciente);
          texto += `${paciente.siglaSetorOrigem} - ${paciente.nomeCompleto} -> FOI PARA ${paciente.regulacao?.paraSetorSigla || 'N/A'} - ${paciente.regulacao?.paraLeito || 'N/A'} / TEMPO DE TRANSFERÊNCIA: Erro no cálculo\n`;
        }
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
