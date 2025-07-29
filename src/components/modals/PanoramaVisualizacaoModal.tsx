import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInMinutes, isValid, differenceInHours } from 'date-fns';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Tipagem para os dados que virão do Firestore
interface RegulacaoHistorico {
  id: string;
  pacienteNome: string;
  setorOrigemNome: string;
  leitoOrigemCodigo: string;
  setorDestinoNome: string;
  leitoDestinoCodigo: string;
  status: 'Pendente' | 'Concluída' | 'Cancelada';
  historicoEventos: Array<{
    evento: 'criada' | 'alterada' | 'concluida' | 'cancelada';
    timestamp: string;
    [key: string]: any;
  }>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientesPendentes: any[]; // Mantemos para a seção de pendentes
  dataInicio: string;
  dataFim: string;
}

export const PanoramaVisualizacaoModal = ({ 
  open, 
  onOpenChange, 
  pacientesPendentes, 
  dataInicio,
  dataFim
}: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dadosHistoricos, setDadosHistoricos] = useState<RegulacaoHistorico[]>([]);

  // Efeito que busca os dados no Firestore sempre que o modal abrir ou as datas mudarem
  useEffect(() => {
    const fetchRegulacoesDoPeriodo = async () => {
      if (!open || !dataInicio || !dataFim) {
        setDadosHistoricos([]);
        return;
      }

      try {
        setLoading(true);
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);

        if (!isValid(inicio) || !isValid(fim)) {
          console.error("Datas de período inválidas");
          setDadosHistoricos([]);
          return;
        }

        // Query para buscar na nova coleção, dentro do período selecionado
        const q = query(
          collection(db, "regulacoesRegulaFacil"),
          where("criadaEm", ">=", inicio.toISOString()),
          where("criadaEm", "<=", fim.toISOString()),
          orderBy("criadaEm", "desc")
        );

        const querySnapshot = await getDocs(q);
        const regulacoes: RegulacaoHistorico[] = [];
        querySnapshot.forEach((doc) => {
          regulacoes.push({ id: doc.id, ...doc.data() } as RegulacaoHistorico);
        });
        
        setDadosHistoricos(regulacoes);

      } catch (error) {
        console.error("Erro ao buscar histórico de regulações:", error);
        toast({ title: "Erro", description: "Não foi possível carregar o histórico do período.", variant: "destructive" });
        setDadosHistoricos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRegulacoesDoPeriodo();
  }, [open, dataInicio, dataFim, toast]);

  const calcularTempoAguardando = (dataCriacao: string): string => {
    try {
      const dataObj = new Date(dataCriacao);
      if (!isValid(dataObj)) return 'N/A';
      const agora = new Date();
      const horas = differenceInHours(agora, dataObj);
      const minutos = differenceInMinutes(agora, dataObj) % 60;
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}hs`;
    } catch {
      return 'N/A';
    }
  };

  const calcularTempoDeConclusao = (historico: RegulacaoHistorico['historicoEventos']): string => {
    try {
        // Pega o último evento de 'criada' ou 'alterada' como ponto de partida
        const eventoInicio = [...historico].reverse().find(e => e.evento === 'criada' || e.evento === 'alterada');
        const eventoFim = historico.find(e => e.evento === 'concluida');

        if (!eventoInicio || !eventoFim) return 'N/A';

        const dataInicio = new Date(eventoInicio.timestamp);
        const dataFim = new Date(eventoFim.timestamp);

        if (!isValid(dataInicio) || !isValid(dataFim)) return 'N/A';

        const horas = differenceInHours(dataFim, dataInicio);
        const minutos = differenceInMinutes(dataFim, dataInicio) % 60;

        return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}hs`;
    } catch {
        return 'N/A';
    }
  };

  const gerarTextoFormatado = () => {
    // --- SEÇÃO 1: REGULAÇÕES PENDENTES (LÓGICA ANTIGA E CORRETA) ---
    let texto = '*REGULAÇÕES PENDENTES*\n\n';
    const pacientesOrdenados = [...pacientesPendentes].sort((a, b) => 
        new Date(a.regulacao?.dataAtualizacaoStatus).getTime() - new Date(b.regulacao?.dataAtualizacaoStatus).getTime()
    );

    if (pacientesOrdenados.length > 0) {
      pacientesOrdenados.forEach(paciente => {
        const tempoAguardando = calcularTempoAguardando(paciente.regulacao?.dataAtualizacaoStatus);
        texto += `${paciente.siglaSetorOrigem} - ${paciente.nomeCompleto} / VAI PARA: ${paciente.regulacao?.paraSetorSigla || 'N/A'} - ${paciente.regulacao?.paraLeito || 'N/A'} / AGUARDANDO HÁ: ${tempoAguardando}\n`;
      });
    } else {
      texto += '_Nenhuma regulação pendente no momento._\n';
    }
    texto += '\n---\n\n';

    // --- SEÇÃO 2: RELATÓRIO DO PERÍODO (NOVA LÓGICA) ---
    const dataInicioFormatada = isValid(new Date(dataInicio)) ? format(new Date(dataInicio), 'dd/MM/yyyy HH:mm') : 'N/A';
    const dataFimFormatada = isValid(new Date(dataFim)) ? format(new Date(dataFim), 'dd/MM/yyyy HH:mm') : 'N/A';
    texto += `*PANORAMA DO PERÍODO (${dataInicioFormatada} - ${dataFimFormatada})*\n\n`;

    if (loading) {
        return "Carregando dados do período...";
    }

    // Calculando as estatísticas
    const total = dadosHistoricos.length;
    const concluidas = dadosHistoricos.filter(r => r.status === 'Concluída').length;
    const canceladas = dadosHistoricos.filter(r => r.status === 'Cancelada').length;
    const alteradas = dadosHistoricos.filter(r => r.historicoEventos.some(e => e.evento === 'alterada')).length;

    texto += `*Resumo Gerencial:*\n`;
    texto += `- Total de Regulações Iniciadas: *${total}*\n`;
    texto += `- Concluídas: *${concluidas}*\n`;
    texto += `- Canceladas: *${canceladas}*\n`;
    texto += `- Alteradas: *${alteradas}*\n\n`;
    
    texto += `*Detalhamento:*\n`;
    if (dadosHistoricos.length > 0) {
        dadosHistoricos.forEach(reg => {
            let desfecho = reg.status.toUpperCase();
            if (reg.status === 'Concluída') {
                const tempo = calcularTempoDeConclusao(reg.historicoEventos);
                desfecho += ` (em ${tempo})`;
            }
            texto += `- ${reg.pacienteNome} (${reg.setorOrigemNome}) -> ${reg.setorDestinoNome} (${reg.leitoDestinoCodigo}) | *${desfecho}*\n`;
        });
    } else {
        texto += '_Nenhuma regulação registrada no período selecionado._\n';
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
            <Button onClick={handleCopiar} disabled={loading} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copiar Texto
            </Button>
          </div>
          <ScrollArea className="flex-grow border rounded-md p-4">
            {loading ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <pre className="whitespace-pre-wrap text-sm font-mono">
                    {gerarTextoFormatado()}
                </pre>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};