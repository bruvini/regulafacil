
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Header from '@/components/Header';
import LeitoCard from '@/components/LeitoCard';
import GerenciamentoModal from '@/components/modals/GerenciamentoModal';
import { useSetores } from '@/hooks/useSetores';

const Index = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { setores, loading } = useSetores();

  const calcularTaxaOcupacao = (leitos: any[]) => {
    if (leitos.length === 0) return 0;
    const leitosOcupados = leitos.filter(
      leito => !['Vago', 'Higienização', 'Bloqueado'].includes(leito.statusLeito)
    ).length;
    return Math.round((leitosOcupados / leitos.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          {/* Bloco 1: Indicadores */}
          <Card className="shadow-card border border-border/50">
            <CardHeader>
              <h2 className="text-xl font-semibold text-medical-primary">Indicadores</h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento</p>
              {loading ? (
                <div className="space-y-2 mt-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total de Setores:</span>
                    <span className="font-semibold text-medical-primary">{setores.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total de Leitos:</span>
                    <span className="font-semibold text-medical-primary">
                      {setores.reduce((acc, setor) => acc + setor.leitos.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Leitos Vagos:</span>
                    <span className="font-semibold text-medical-success">
                      {setores.reduce((acc, setor) => 
                        acc + setor.leitos.filter(leito => leito.statusLeito === 'Vago').length, 0
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bloco 2: Filtros e Gestão */}
          <Card className="shadow-card border border-border/50">
            <CardHeader>
              <h2 className="text-xl font-semibold text-medical-primary">Filtros</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
              <Button 
                onClick={() => setModalOpen(true)}
                className="w-full bg-medical-primary hover:bg-medical-secondary text-white font-semibold py-3 px-6 rounded-lg shadow-medical transition-all duration-200 hover:shadow-lg"
                size="lg"
              >
                Gerenciar Setores e Leitos
              </Button>
            </CardContent>
          </Card>

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
              ) : setores.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-2">
                  {setores.map((setor) => {
                    const taxaOcupacao = calcularTaxaOcupacao(setor.leitos);
                    return (
                      <AccordionItem 
                        key={setor.id} 
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
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {setor.leitos.map((leito, index) => (
                                  <LeitoCard key={index} leito={leito} />
                                ))}
                              </div>
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
                      Nenhum setor cadastrado ainda
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Comece criando seu primeiro setor e adicionando leitos para visualizar o mapa hospitalar
                    </p>
                    <Button 
                      onClick={() => setModalOpen(true)}
                      className="bg-medical-primary hover:bg-medical-secondary"
                    >
                      Criar Primeiro Setor
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <GerenciamentoModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </div>
  );
};

export default Index;
