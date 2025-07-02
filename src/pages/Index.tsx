import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import SetorCard from '@/components/SetorCard';
import GerenciamentoModal from '@/components/modals/GerenciamentoModal';
import { useSetores } from '@/hooks/useSetores';

const Index = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { setores, loading } = useSetores();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          {/* Bloco 3: Placeholder para extensão futura */}
          <Card className="shadow-card border border-border/50">
            <CardHeader>
              <h2 className="text-xl font-semibold text-medical-primary">Ações Rápidas</h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Funcionalidades adicionais serão implementadas aqui</p>
            </CardContent>
          </Card>
        </div>

        {/* Mapa de Setores */}
        <div className="mt-8">
          <Card className="shadow-card border border-border/50">
            <CardHeader>
              <h2 className="text-2xl font-bold text-medical-primary">Mapa de Setores</h2>
              <p className="text-muted-foreground">Visualização em tempo real dos leitos hospitalares</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-6">
                      <Skeleton className="h-6 w-1/2 mb-4" />
                      <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : setores.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {setores.map((setor) => (
                    <SetorCard key={setor.id} setor={setor} />
                  ))}
                </div>
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
