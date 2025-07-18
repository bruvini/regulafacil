
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import LeitoCard from '@/components/LeitoCard';
import QuartoCard from '@/components/QuartoCard';
import GerenciamentoModal from '@/components/modals/GerenciamentoModal';
import { FiltrosMapaLeitos } from '@/components/FiltrosMapaLeitos';
import { IndicadoresGerais } from '@/components/IndicadoresGerais';
import { useSetores, LeitoExtendido, SetorComLeitos } from '@/hooks/useSetores';
import { useIndicadoresHospital } from '@/hooks/useIndicadoresHospital';
import { useFiltrosMapaLeitos } from '@/hooks/useFiltrosMapaLeitos';
import { agruparLeitosPorQuarto } from '@/lib/leitoUtils';
import { Settings, ShieldQuestion, ClipboardList } from 'lucide-react';
import { MovimentacaoModal } from '@/components/modals/MovimentacaoModal';
import { RelatorioIsolamentosModal } from '@/components/modals/RelatorioIsolamentosModal';
import { RelatorioVagosModal } from '@/components/modals/RelatorioVagosModal';
import { ObservacoesModal } from '@/components/modals/ObservacoesModal';

const MapaLeitos = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [movimentacaoModalOpen, setMovimentacaoModalOpen] = useState(false);
  const [relatorioIsolamentoOpen, setRelatorioIsolamentoOpen] = useState(false);
  const [relatorioVagosOpen, setRelatorioVagosOpen] = useState(false);
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [pacienteParaMover, setPacienteParaMover] = useState<any | null>(null);
  const [pacienteParaObs, setPacienteParaObs] = useState<any | null>(null);

  // Buscar dados enriquecidos
  const { 
    setores, 
    loading, 
    moverPaciente, 
    adicionarObservacaoPaciente,
    atualizarStatusLeito,
    desbloquearLeito,
    finalizarHigienizacao,
    liberarLeito,
    solicitarUTI,
    solicitarRemanejamento,
    transferirPaciente,
    cancelarReserva,
    concluirTransferencia,
    toggleProvavelAlta
  } = useSetores();

  const { contagemPorStatus, taxaOcupacao, tempoMedioStatus, nivelPCP } = useIndicadoresHospital(setores);

  const { 
    searchTerm, setSearchTerm, 
    filtrosAvancados, setFiltrosAvancados,
    resetFiltros,
    filteredSetores,
    especialidades,
    todosStatus
  } = useFiltrosMapaLeitos(setores);

  const calcularTaxaOcupacao = (leitos: LeitoExtendido[]) => {
    if (leitos.length === 0) return 0;
    const leitosOcupados = leitos.filter(
      leito => !['Vago', 'Higienizacao', 'Bloqueado'].includes(leito.statusLeito)
    ).length;
    return Math.round((leitosOcupados / leitos.length) * 100);
  };

  const handleOpenMovimentacaoModal = (leito: LeitoExtendido) => {
    setPacienteParaMover({
      dados: leito.dadosPaciente,
      leitoOrigemId: leito.id,
      setorOrigemId: setores.find(s => s.leitos.some(l => l.id === leito.id))?.id
    });
    setMovimentacaoModalOpen(true);
  };

  const handleConfirmarMovimentacao = (leitoDestino: any) => {
    if (pacienteParaMover) {
      const setorDestinoId = setores.find(s => s.leitos.some(l => l.id === leitoDestino.id))?.id;
      if (setorDestinoId) {
        moverPaciente(
          pacienteParaMover.setorOrigemId, 
          pacienteParaMover.leitoOrigemId, 
          setorDestinoId, 
          leitoDestino.id
        );
      }
    }
    setMovimentacaoModalOpen(false);
    setPacienteParaMover(null);
  };

  const handleOpenObsModal = (leito: LeitoExtendido) => {
    setPacienteParaObs({ ...leito, setorId: setores.find(s => s.leitos.some(l => l.id === leito.id))?.id });
    setObsModalOpen(true);
  };

  const handleConfirmObs = (obs: string) => {
    if (pacienteParaObs) {
      adicionarObservacaoPaciente(pacienteParaObs.setorId, pacienteParaObs.id, obs);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-medical-primary">Mapa de Leitos</h1>
              <p className="text-muted-foreground">Visualização em tempo real dos leitos hospitalares</p>
            </div>
          </div>

          {/* Bloco 1: Indicadores Gerais Aprimorados */}
          {loading ? (
            <Card className="shadow-card border border-border/50">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="text-center">
                        <Skeleton className="h-8 w-full mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <IndicadoresGerais 
              contagem={contagemPorStatus} 
              taxa={taxaOcupacao} 
              tempos={tempoMedioStatus}
              nivelPCP={nivelPCP}
            />
          )}

          {/* Bloco 2: Filtros e Ações */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bloco de Filtros */}
            <div className="lg:col-span-2">
              <FiltrosMapaLeitos 
                setores={setores}
                filtros={filtrosAvancados}
                setFiltros={setFiltrosAvancados}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                resetFiltros={resetFiltros}
                especialidades={especialidades}
                todosStatus={todosStatus}
              />
            </div>

            {/* Bloco de Ações Rápidas */}
            <div className="lg:col-span-1">
              <Card className="shadow-card border border-border/50">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-medical-primary">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <div className="flex space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setModalOpen(true)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Gerenciar Setores e Leitos</p></TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setRelatorioIsolamentoOpen(true)}>
                            <ShieldQuestion className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Relatório de Isolamentos</p></TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setRelatorioVagosOpen(true)}>
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Relatório de Leitos Vagos</p></TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bloco 3: Mapa de Setores */}
          <Card className="shadow-card border border-border/50">
            <CardHeader>
              <h2 className="text-2xl font-bold text-medical-primary">Mapa de Setores</h2>
              <p className="text-muted-foreground">Visualização em tempo real dos leitos hospitalares</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-4">
                      <Skeleton className="h-6 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-1/4" />
                    </Card>
                  ))}
                </div>
              ) : filteredSetores.length > 0 ? (
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {filteredSetores.map((setor) => {
                    const setorOriginal = setores.find(s => s.id === setor.id);
                    if (!setorOriginal) return null;
                    
                    const taxaOcupacao = calcularTaxaOcupacao(setor.leitos);
                    return (
                      <AccordionItem 
                        key={setor.id!} 
                        value={setor.id!}
                        className="border border-border/50 rounded-lg px-4"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex justify-between items-center w-full pr-4">
                            <div className="flex flex-col items-start">
                              <h3 className="text-lg font-semibold text-foreground">{setor.nomeSetor}</h3>
                              <p className="text-sm text-muted-foreground font-mono">{setor.siglaSetor}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-medical-primary">
                                {taxaOcupacao}%
                              </div>
                              <p className="text-xs text-muted-foreground">Ocupação</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-4">
                            {setor.leitos.length > 0 ? (
                              (() => {
                                const { quartos, leitosSoltos } = agruparLeitosPorQuarto(setor.leitos);
                                const comparadorNatural = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

                                return (
                                  <div className="space-y-4">
                                    {Object.entries(quartos)
                                      .sort(([nomeQuartoA], [nomeQuartoB]) => comparadorNatural(nomeQuartoA, nomeQuartoB))
                                      .map(([nomeQuarto, leitosDoQuarto]) => (
                                        <QuartoCard
                                          key={nomeQuarto}
                                          nomeQuarto={nomeQuarto}
                                          leitos={leitosDoQuarto}
                                          setorId={setor.id!}
                                          todosLeitosDoSetor={setorOriginal.leitos}
                                          onMoverPaciente={handleOpenMovimentacaoModal}
                                        />
                                      ))}

                                    {leitosSoltos.length > 0 && (
                                      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
                                        {leitosSoltos
                                          .sort((a, b) => comparadorNatural(a.codigoLeito, b.codigoLeito))
                                          .map((leito) => (
                                            <LeitoCard
                                              key={leito.id}
                                              leito={leito}
                                              setorId={setor.id!}
                                              todosLeitosDoSetor={setorOriginal.leitos}
                                              onMoverPaciente={handleOpenMovimentacaoModal}
                                              onAbrirObs={handleOpenObsModal}
                                              onAtualizarStatus={atualizarStatusLeito}
                                              onDesbloquear={desbloquearLeito}
                                              onFinalizarHigienizacao={finalizarHigienizacao}
                                              onLiberarLeito={liberarLeito}
                                              onSolicitarUTI={solicitarUTI}
                                              onSolicitarRemanejamento={solicitarRemanejamento}
                                              onTransferirPaciente={transferirPaciente}
                                              onCancelarReserva={cancelarReserva}
                                              onConcluirTransferencia={concluirTransferencia}
                                              onToggleProvavelAlta={toggleProvavelAlta}
                                            />
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <p>Nenhum leito cadastrado neste setor</p>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <p className="text-lg text-muted-foreground mb-4">
                      {setores.length === 0 ? "Nenhum setor cadastrado ainda" : "Nenhum resultado encontrado para os filtros aplicados."}
                    </p>
                    {setores.length === 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-6">
                          Comece criando seu primeiro setor e adicionando leitos para visualizar o mapa hospitalar
                        </p>
                        <Button 
                          onClick={() => setModalOpen(true)}
                          className="bg-medical-primary hover:bg-medical-secondary"
                        >
                          Criar Primeiro Setor
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={resetFiltros}
                        variant="outline"
                      >
                        Limpar Filtros
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <GerenciamentoModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />

      <MovimentacaoModal
        open={movimentacaoModalOpen}
        onOpenChange={setMovimentacaoModalOpen}
        pacienteNome={pacienteParaMover?.dados?.nomeCompleto || ''}
        onConfirm={handleConfirmarMovimentacao}
      />

      <RelatorioIsolamentosModal 
        open={relatorioIsolamentoOpen} 
        onOpenChange={setRelatorioIsolamentoOpen}
      />

      <RelatorioVagosModal
        open={relatorioVagosOpen}
        onOpenChange={setRelatorioVagosOpen}
      />

      <ObservacoesModal
        open={obsModalOpen}
        onOpenChange={setObsModalOpen}
        pacienteNome={pacienteParaObs?.dadosPaciente?.nomeCompleto || ''}
        observacoes={pacienteParaObs?.dadosPaciente?.obsPaciente || []}
        onConfirm={handleConfirmObs}
      />
    </div>
  );
};

export default MapaLeitos;
