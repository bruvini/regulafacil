import { useState } from 'react';
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
import { useSetores } from '@/hooks/useSetores';
import { useIndicadoresHospital } from '@/hooks/useIndicadoresHospital';
import { useFiltrosMapaLeitos } from '@/hooks/useFiltrosMapaLeitos';
import { agruparLeitosPorQuarto } from '@/lib/leitoUtils';
import { Settings } from 'lucide-react';
import { MovimentacaoModal } from '@/components/modals/MovimentacaoModal';

const MapaLeitos = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [movimentacaoModalOpen, setMovimentacaoModalOpen] = useState(false);
  const [pacienteParaMover, setPacienteParaMover] = useState<any | null>(null);
  const { setores, loading, moverPaciente } = useSetores();
  
  // Chama o hook para obter as métricas incluindo nivelPCP
  const { contagemPorStatus, taxaOcupacao, tempoMedioStatus, nivelPCP } = useIndicadoresHospital(setores);

  const { 
    searchTerm, setSearchTerm, 
    filtrosAvancados, setFiltrosAvancados,
    resetFiltros,
    filteredSetores,
    especialidades,
    todosStatus
  } = useFiltrosMapaLeitos(setores);

  const calcularTaxaOcupacao = (leitos: any[]) => {
    if (leitos.length === 0) return 0;
    const leitosOcupados = leitos.filter(
      leito => !['Vago', 'Higienizacao', 'Bloqueado'].includes(leito.statusLeito)
    ).length;
    return Math.round((leitosOcupados / leitos.length) * 100);
  };

  const handleOpenMovimentacaoModal = (leito: any) => {
    setPacienteParaMover({
      dados: leito.dadosPaciente,
      leitoOrigemId: leito.id,
      setorOrigemId: setores.find(s => s.leitos.some(l => l.id === leito.id))?.id
    });
    setMovimentacaoModalOpen(true);
  };

  const handleConfirmarMovimentacao = (leitoDestino: any) => {
    if (pacienteParaMover) {
      moverPaciente(pacienteParaMover.dados, pacienteParaMover.leitoOrigemId, pacienteParaMover.setorOrigemId, leitoDestino);
    }
    setMovimentacaoModalOpen(false);
    setPacienteParaMover(null);
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={() => setModalOpen(true)} variant="outline" className="w-full">
                          <Settings className="mr-2 h-4 w-4" />
                          Gerenciar Setores e Leitos
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Abrir painel de gerenciamento</p>
                      </TooltipContent>
                    </Tooltip>
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
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {Object.entries(quartos)
                                      .sort(([nomeQuartoA], [nomeQuartoB]) => comparadorNatural(nomeQuartoA, nomeQuartoB))
                                      .map(([nomeQuarto, leitosDoQuarto]) => (
                                        <QuartoCard
                                          key={nomeQuarto}
                                          nomeQuarto={nomeQuarto}
                                          leitos={leitosDoQuarto}
                                          setorId={setor.id!}
                                          onMoverPaciente={handleOpenMovimentacaoModal}
                                        />
                                      ))}
                                    {leitosSoltos
                                      .sort((a, b) => comparadorNatural(a.codigoLeito, b.codigoLeito))
                                      .map((leito) => (
                                        <LeitoCard 
                                          key={leito.id} 
                                          leito={leito} 
                                          setorId={setor.id!} 
                                          todosLeitosDoSetor={setor.leitos}
                                          onMoverPaciente={handleOpenMovimentacaoModal}
                                        />
                                      ))}
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
        pacienteNome={pacienteParaMover?.dados?.nomePaciente || ''}
        onConfirm={handleConfirmarMovimentacao}
      />
    </div>
  );
};

export default MapaLeitos;
