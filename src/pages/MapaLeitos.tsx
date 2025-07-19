import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import SetorCard from '@/components/SetorCard';
import GerenciamentoModal from '@/components/modals/GerenciamentoModal';
import { FiltrosMapaLeitos } from '@/components/FiltrosMapaLeitos';
import { IndicadoresGerais } from '@/components/IndicadoresGerais';
import { useSetores } from '@/hooks/useSetores';
import { useLeitos } from '@/hooks/useLeitos';
import { usePacientes } from '@/hooks/usePacientes';
import { useIndicadoresHospital } from '@/hooks/useIndicadoresHospital';
import { useFiltrosMapaLeitos } from '@/hooks/useFiltrosMapaLeitos';
import { Settings, ShieldQuestion, ClipboardList } from 'lucide-react';
import { MovimentacaoModal } from '@/components/modals/MovimentacaoModal';
import { RelatorioIsolamentosModal } from '@/components/modals/RelatorioIsolamentosModal';
import { RelatorioVagosModal } from '@/components/modals/RelatorioVagosModal';
import { ObservacoesModal } from '@/components/modals/ObservacoesModal';
import { Leito, Paciente, HistoricoMovimentacao } from '@/types/hospital';
import { doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Tipo padronizado que será usado por todos os componentes filhos - alinhado com LeitoExtendido
export type LeitoEnriquecido = Leito & {
  statusLeito: HistoricoMovimentacao['statusLeito'];
  dataAtualizacaoStatus?: string;
  motivoBloqueio?: string;
  regulacao?: any;
  dadosPaciente?: Paciente | null;
};

const MapaLeitos = () => {
  // --- Estados de Modais e Ações ---
  const [modalOpen, setModalOpen] = useState(false);
  const [movimentacaoModalOpen, setMovimentacaoModalOpen] = useState(false);
  const [relatorioIsolamentoOpen, setRelatorioIsolamentoOpen] = useState(false);
  const [relatorioVagosOpen, setRelatorioVagosOpen] = useState(false);
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [pacienteParaMover, setPacienteParaMover] = useState<any | null>(null);
  const [pacienteParaObs, setPacienteParaObs] = useState<any | null>(null);
  const { toast } = useToast();

  // --- Hooks de Dados (Nova Arquitetura) ---
  const { setores, loading: setoresLoading } = useSetores();
  const { leitos, loading: leitosLoading, atualizarStatusLeito } = useLeitos();
  const { pacientes, loading: pacientesLoading } = usePacientes();
  const loading = setoresLoading || leitosLoading || pacientesLoading;

  // --- Lógica Central de Combinação de Dados ---
  const dadosCombinados = useMemo(() => {
    if (loading) {
      return { setoresEnriquecidos: [], todosLeitosEnriquecidos: [] };
    }

    const mapaPacientes = new Map(pacientes.map(p => [p.id, p]));
    const todosLeitosEnriquecidos: LeitoEnriquecido[] = leitos.map(leito => {
      const historicoRecente = leito.historicoMovimentacao[leito.historicoMovimentacao.length - 1];
      const pacienteId = historicoRecente?.pacienteId;
      return {
        ...leito,
        statusLeito: historicoRecente.statusLeito,
        dataAtualizacaoStatus: historicoRecente.dataAtualizacaoStatus,
        motivoBloqueio: historicoRecente.motivoBloqueio,
        regulacao: historicoRecente.infoRegulacao,
        dadosPaciente: pacienteId ? mapaPacientes.get(pacienteId) : null
      };
    });

    const mapaLeitosPorSetor = todosLeitosEnriquecidos.reduce((acc, leito) => {
      (acc[leito.setorId] = acc[leito.setorId] || []).push(leito);
      return acc;
    }, {} as Record<string, LeitoEnriquecido[]>);

    const setoresEnriquecidos = setores.map(setor => ({
      ...setor,
      leitos: mapaLeitosPorSetor[setor.id!] || []
    }));

    return { setoresEnriquecidos, todosLeitosEnriquecidos };
  }, [setores, leitos, pacientes, loading]);

  const { setoresEnriquecidos } = dadosCombinados;
  const { contagemPorStatus, taxaOcupacao, tempoMedioStatus, nivelPCP } = useIndicadoresHospital(setoresEnriquecidos);
  const { filteredSetores, filtrosAvancados, setFiltrosAvancados, ...filtrosProps } = useFiltrosMapaLeitos(setoresEnriquecidos);

  // --- OBJETO CENTRALIZADO DE AÇÕES ---
  const leitoActions = {
    onMoverPaciente: (leito: LeitoEnriquecido) => {
      setPacienteParaMover({
        dados: leito.dadosPaciente,
        leitoOrigemId: leito.id,
        setorOrigemId: leito.setorId,
      });
      setMovimentacaoModalOpen(true);
    },

    onAbrirObs: (leito: LeitoEnriquecido) => {
      setPacienteParaObs(leito);
      setObsModalOpen(true);
    },

    onLiberarLeito: async (leitoId: string, pacienteId: string) => {
      await deleteDoc(doc(db, 'pacientesRegulaFacil', pacienteId));
      await atualizarStatusLeito(leitoId, 'Higienizacao');
      toast({ title: "Sucesso!", description: "Paciente recebeu alta." });
    },

    onAtualizarStatus: atualizarStatusLeito,

    onSolicitarUTI: async (pacienteId: string) => {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, { 
        aguardaUTI: true, 
        dataPedidoUTI: new Date()
      });
      toast({ title: "Sucesso!", description: "Pedido de UTI solicitado." });
    },

    onSolicitarRemanejamento: async (pacienteId: string, motivo: string) => {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, { 
        remanejarPaciente: true, 
        motivoRemanejamento: motivo,
        dataPedidoRemanejamento: new Date()
      });
      toast({ title: "Sucesso!", description: "Solicitação de remanejamento registrada." });
    },

    onTransferirPaciente: async (pacienteId: string, destino: string, motivo: string) => {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, { 
        transferirPaciente: true, 
        destinoTransferencia: destino, 
        motivoTransferencia: motivo,
        dataTransferencia: new Date()
      });
      toast({ title: "Sucesso!", description: "Solicitação de transferência externa registrada." });
    },

    onCancelarReserva: async (leitoId: string) => {
      try {
        await atualizarStatusLeito(leitoId, 'Vago');
        toast({ title: "Sucesso!", description: "Reserva cancelada." });
      } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        toast({ title: "Erro", description: "Erro ao cancelar reserva.", variant: "destructive" });
      }
    },

    onConcluirTransferencia: async (leito: LeitoEnriquecido) => {
      try {
        await atualizarStatusLeito(leito.id, 'Ocupado');
        toast({ title: "Sucesso!", description: "Transferência concluída." });
      } catch (error) {
        console.error('Erro ao concluir transferência:', error);
        toast({ title: "Erro", description: "Erro ao concluir transferência.", variant: "destructive" });
      }
    },

    onToggleProvavelAlta: async (pacienteId: string, valorAtual: boolean) => {
      await updateDoc(doc(db, 'pacientesRegulaFacil', pacienteId), { provavelAlta: !valorAtual });
    },

    onFinalizarHigienizacao: async (leitoId: string) => {
      await atualizarStatusLeito(leitoId, 'Vago');
      toast({ title: "Sucesso!", description: "Leito liberado e pronto para uso." });
    },

    onBloquearLeito: async (leitoId: string, motivo: string) => {
      try {
        await atualizarStatusLeito(leitoId, 'Bloqueado', { motivoBloqueio: motivo });
        toast({ title: "Sucesso!", description: "Leito bloqueado." });
      } catch (error) {
        console.error('Erro ao bloquear leito:', error);
        toast({ title: "Erro", description: "Erro ao bloquear leito.", variant: "destructive" });
      }
    },

    onEnviarParaHigienizacao: async (leitoId: string) => {
      try {
        await atualizarStatusLeito(leitoId, 'Higienizacao');
        toast({ title: "Sucesso!", description: "Leito enviado para higienização." });
      } catch (error) {
        console.error('Erro ao enviar para higienização:', error);
        toast({ title: "Erro", description: "Erro ao enviar para higienização.", variant: "destructive" });
      }
    }
  };

  const handleConfirmarMovimentacao = async (leitoDestino: Leito) => {
    if (pacienteParaMover && leitoDestino) {
        await atualizarStatusLeito(pacienteParaMover.leitoOrigemId, 'Higienizacao');
        await atualizarStatusLeito(leitoDestino.id, 'Ocupado', { pacienteId: pacienteParaMover.dados.id });
        const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteParaMover.dados.id);
        await updateDoc(pacienteRef, { leitoId: leitoDestino.id, setorId: leitoDestino.setorId });
        toast({ title: "Sucesso!", description: "Paciente movido com sucesso." });
    }
    setMovimentacaoModalOpen(false);
    setPacienteParaMover(null);
  };
  
  const handleConfirmObs = async (obs: string) => {
    if (pacienteParaObs?.dadosPaciente) {
        const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteParaObs.dadosPaciente.id);
        await updateDoc(pacienteRef, { obsPaciente: arrayUnion(obs) });
        toast({ title: "Sucesso!", description: "Observação adicionada." });
    }
    setObsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-medical-primary">Mapa de Leitos</h1>
              <p className="text-muted-foreground">Visualização em tempo real dos leitos hospitalares</p>
            </div>
          </header>

          {loading ? (
             <Card className="shadow-card border border-border/50">
              <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
              <CardContent><div className="space-y-4"><Skeleton className="h-8 w-full" /></div></CardContent>
            </Card>
          ) : (
            <IndicadoresGerais 
              contagem={contagemPorStatus} 
              taxa={taxaOcupacao} 
              tempos={tempoMedioStatus}
              nivelPCP={nivelPCP}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FiltrosMapaLeitos 
                setores={setores} 
                filtrosAvancados={filtrosAvancados}
                setFiltrosAvancados={setFiltrosAvancados}
                {...filtrosProps} 
              />
            </div>
            <div className="lg:col-span-1">
              <Card className="shadow-card border border-border/50">
                <CardHeader><CardTitle className="text-xl font-semibold text-medical-primary">Ações Rápidas</CardTitle></CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <div className="flex space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => setModalOpen(true)}><Settings className="h-4 w-4" /></Button></TooltipTrigger>
                        <TooltipContent><p>Gerenciar Setores e Leitos</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => setRelatorioIsolamentoOpen(true)}><ShieldQuestion className="h-4 w-4" /></Button></TooltipTrigger>
                        <TooltipContent><p>Relatório de Isolamentos</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => setRelatorioVagosOpen(true)}><ClipboardList className="h-4 w-4" /></Button></TooltipTrigger>
                        <TooltipContent><p>Relatório de Leitos Vagos</p></TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Card className="shadow-card border border-border/50">
            <CardHeader>
              <h2 className="text-2xl font-bold text-medical-primary">Mapa de Setores</h2>
              <p className="text-muted-foreground">Visualização em tempo real dos leitos hospitalares</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : filteredSetores.length > 0 ? (
                <Accordion type="single" collapsible className="w-full space-y-2" defaultValue={filteredSetores[0]?.id}>
                  {filteredSetores.map((setor) => {
                    // Calcular indicadores do setor aqui
                    const leitosVagos = setor.leitos.filter(l => l.statusLeito === 'Vago').length;
                    const totalLeitos = setor.leitos.length;
                    const taxaOcupacao = totalLeitos > 0 ? Math.round(((totalLeitos - leitosVagos) / totalLeitos) * 100) : 0;
                    
                    return (
                      <AccordionItem key={setor.id} value={setor.id!} className="border border-border/50 rounded-lg">
                        <AccordionTrigger className="hover:no-underline px-4">
                          <div className="flex justify-between items-center w-full pr-4">
                            <div className="flex flex-col items-start">
                              <h3 className="text-lg font-semibold text-foreground">{setor.nomeSetor}</h3>
                              <p className="text-sm text-muted-foreground font-mono">{setor.siglaSetor}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-medical-primary">
                                {taxaOcupacao}%
                              </div>
                              <p className="text-xs text-muted-foreground">{leitosVagos}/{totalLeitos} Vagos</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4">
                          <SetorCard 
                            setor={setor}
                            actions={leitoActions}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                 <div className="text-center py-12"><p className="text-lg text-muted-foreground">Nenhum resultado encontrado.</p></div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <GerenciamentoModal open={modalOpen} onOpenChange={setModalOpen} />
      <MovimentacaoModal open={movimentacaoModalOpen} onOpenChange={setMovimentacaoModalOpen} pacienteNome={pacienteParaMover?.dados?.nomeCompleto || ''} onConfirm={handleConfirmarMovimentacao}/>
      <RelatorioIsolamentosModal open={relatorioIsolamentoOpen} onOpenChange={setRelatorioIsolamentoOpen}/>
      <RelatorioVagosModal open={relatorioVagosOpen} onOpenChange={setRelatorioVagosOpen}/>
      <ObservacoesModal open={obsModalOpen} onOpenChange={setObsModalOpen} pacienteNome={pacienteParaObs?.dadosPaciente?.nomeCompleto || ''} observacoes={pacienteParaObs?.dadosPaciente?.obsPaciente || []} onConfirm={handleConfirmObs}/>
    </div>
  );
};

export default MapaLeitos;
