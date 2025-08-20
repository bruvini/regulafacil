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
interface EventoHistorico {
  evento: 'criada' | 'alterada' | 'concluida' | 'cancelada';
  timestamp: string;
  detalhes: string;
  [key: string]: any;
}

interface RegulacaoHistorico {
  id: string;
  pacienteNome: string;
  setorOrigemNome: string;
  leitoOrigemCodigo: string;
  setorDestinoNome: string;
  leitoDestinoCodigo: string;
  status: 'Pendente' | 'Concluída' | 'Cancelada';
  criadaEm: string;
  concluidaEm?: string;
  canceladaEm?: string;
  motivoCancelamento?: string;
  historicoEventos: EventoHistorico[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientesRegulados: any[]; // Usado para a seção de pendentes em tempo real
  dataInicio: string;
  dataFim: string;
}

export const PanoramaVisualizacaoModal = ({ 
  open, 
  onOpenChange, 
  pacientesRegulados, 
  dataInicio,
  dataFim
}: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dadosHistoricos, setDadosHistoricos] = useState<RegulacaoHistorico[]>([]);

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
        if (!isValid(inicio) || !isValid(fim)) return;

        const q = query(
          collection(db, "regulacoesRegulaFacil"),
          where("criadaEm", ">=", inicio.toISOString()),
          where("criadaEm", "<=", fim.toISOString()),
          orderBy("criadaEm", "desc")
        );
        const querySnapshot = await getDocs(q);
        const regulacoes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegulacaoHistorico));
        setDadosHistoricos(regulacoes);
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        toast({ title: "Erro", description: "Não foi possível carregar o histórico.", variant: "destructive" });
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
  
  const calcularTempoDeConclusao = (historico: EventoHistorico[]): string => {
     try {
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
    // --- SEÇÃO 1: REGULAÇÕES PENDENTES ---
    let texto = '*REGULAÇÕES PENDENTES*\n\n';
    const pendentesOrdenados = [...pacientesRegulados].sort((a, b) => 
        new Date(a.regulacao?.dataAtualizacaoStatus).getTime() - new Date(b.regulacao?.dataAtualizacaoStatus).getTime()
    );

    if (pendentesOrdenados.length > 0) {
      pendentesOrdenados.forEach(paciente => {
        const dataRegulacao = new Date(paciente.regulacao?.dataAtualizacaoStatus);
        const dataFormatada = isValid(dataRegulacao) ? format(dataRegulacao, 'dd/MM HH:mm') : 'N/A';
        const tempoAguardando = calcularTempoAguardando(paciente.regulacao?.dataAtualizacaoStatus);
        texto += `${paciente.siglaSetorOrigem} - ${paciente.nomeCompleto} -> ${paciente.regulacao?.paraSetorSigla || 'N/A'} - ${paciente.regulacao?.paraLeito || 'N/A'}\n`;
        texto += `_(Regulado em ${dataFormatada} - Aguardando há ${tempoAguardando})_\n\n`;
      });
    } else {
      texto += '_Nenhuma regulação pendente no momento._\n';
    }
    texto += '---\n\n';

    // --- SEÇÃO 2: RELATÓRIO DO PERÍODO ---
    const dataInicioFormatada = isValid(new Date(dataInicio)) ? format(new Date(dataInicio), 'dd/MM/yyyy HH:mm') : 'N/A';
    const dataFimFormatada = isValid(new Date(dataFim)) ? format(new Date(dataFim), 'dd/MM/yyyy HH:mm') : 'N/A';
    texto += `*PANORAMA DO PERÍODO (${dataInicioFormatada} - ${dataFimFormatada})*\n\n`;

    if (loading) {
      return "Carregando dados do período...";
    }

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
            const dataCriacao = new Date(reg.criadaEm);
            const dataCriacaoFormatada = isValid(dataCriacao) ? format(dataCriacao, 'dd/MM HH:mm') : 'N/A';
            
            // **MELHORIA**: Extrai a informação inicial da primeira alteração, se houver.
            const primeiraAlteracao = reg.historicoEventos.find(e => e.evento === 'alterada');
            const destinoInicial = primeiraAlteracao ? 
                primeiraAlteracao.detalhes.split(' alterada de ')[1]?.split(' para ')[0] || reg.leitoDestinoCodigo :
                `${reg.setorDestinoNome} ${reg.leitoDestinoCodigo}`;

            texto += `- *${reg.pacienteNome}* (${reg.setorOrigemNome} - ${reg.leitoOrigemCodigo} -> ${destinoInicial})\n`;
            texto += `  _Iniciada em: ${dataCriacaoFormatada}_\n`;

            // **MELHORIA**: Itera sobre todos os eventos para criar a linha do tempo.
            reg.historicoEventos.forEach(evento => {
                if (evento.evento === 'alterada') {
                    const dataAlteracao = new Date(evento.timestamp);
                    const dataAlteracaoFormatada = isValid(dataAlteracao) ? format(dataAlteracao, 'dd/MM HH:mm') : 'N/A';
                    const motivo = evento.detalhes.split('Motivo: ')[1] || 'N/A';
                    const novoDestino = evento.detalhes.split(' para ')[1]?.split('.')[0] || 'N/A';
                    texto += `  _Alterada em: ${dataAlteracaoFormatada} -> ${novoDestino} (Motivo: ${motivo})_\n`;
                }
            });

            if (reg.status === 'Concluída') {
                const dataConclusao = new Date(reg.concluidaEm!);
                const dataConclusaoFormatada = isValid(dataConclusao) ? format(dataConclusao, 'dd/MM HH:mm') : 'N/A';
                const tempo = calcularTempoDeConclusao(reg.historicoEventos);
                texto += `  *Desfecho: CONCLUÍDA em ${dataConclusaoFormatada} (em ${tempo})*\n\n`;
            } else if (reg.status === 'Cancelada') {
                const dataCancelamento = new Date(reg.canceladaEm!);
                const dataCancelamentoFormatada = isValid(dataCancelamento) ? format(dataCancelamento, 'dd/MM HH:mm') : 'N/A';
                texto += `  *Desfecho: CANCELADA em ${dataCancelamentoFormatada} (Motivo: ${reg.motivoCancelamento || 'N/A'})*\n\n`;
            } else {
                texto += `  *Desfecho: PENDENTE*\n\n`;
            }
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