
import { useAuth } from '@/hooks/useAuth';
import { useHigienizacao } from '@/hooks/useHigienizacao';
import IndicadoresHigienizacao from '@/components/IndicadoresHigienizacao';
import ListaHigienizacao from '@/components/ListaHigienizacao';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, Clock } from 'lucide-react';

const CentralHigienizacao = () => {
  const { userData } = useAuth();
  const { leitosPrioritarios, leitosAgrupados, indicadores, handleConcluirHigienizacao, loading } = useHigienizacao();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando Central de Higienização...</p>
        </div>
      </div>
    );
  }

  const temTarefas = leitosPrioritarios.length > 0 || Object.keys(leitosAgrupados).length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-medical-primary/10 rounded-lg">
          <Sparkles className="h-6 w-6 text-medical-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Central de Higienização</h1>
          <p className="text-muted-foreground">
            Olá, {userData?.nomeCompleto}! Gerencie as tarefas de higienização em tempo real.
          </p>
        </div>
      </div>

      {/* Indicadores */}
      <IndicadoresHigienizacao indicadores={indicadores} />

      {/* Lista de Tarefas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Leitos Aguardando Higienização
          </CardTitle>
        </CardHeader>
        <CardContent>
          {temTarefas ? (
            <div className="space-y-6">
              {/* Bloco de Leitos Prioritários */}
              {leitosPrioritarios.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <h3 className="text-lg font-semibold text-yellow-700">PRIORIDADE MÁXIMA</h3>
                    <Badge variant="destructive">{leitosPrioritarios.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {leitosPrioritarios.map(leito => (
                      <div
                        key={leito.id}
                        className="flex items-center justify-between p-4 rounded-lg border-2 border-yellow-400 bg-yellow-50 shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          <div>
                            <p className="font-medium text-foreground">
                              Leito {leito.codigoLeito}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>Aguardando há {leito.tempoEsperaFormatado}</span>
                              <span className="text-yellow-600">• {leito.setor}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handleConcluirHigienizacao(leito)}
                          className="bg-medical-success hover:bg-medical-success/90"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Concluir
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blocos de Leitos Normais Agrupados por Setor */}
              {Object.keys(leitosAgrupados).length > 0 && (
                <ListaHigienizacao 
                  leitosAgrupados={leitosAgrupados} 
                  onConcluir={handleConcluirHigienizacao} 
                />
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum leito aguardando higienização</p>
              <p className="text-sm">Todos os leitos estão limpos e prontos para uso!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CentralHigienizacao;
