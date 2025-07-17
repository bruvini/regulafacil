
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHuddle } from '@/hooks/useHuddle';
import { CardPendencia } from '@/components/CardPendencia';
import { NovaPendenciaModal } from '@/components/modals/NovaPendenciaModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Printer, Users, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Pendencia } from '@/types/huddle';

const Huddle = () => {
  const [dataSelecionada] = useState(new Date());
  const [turno] = useState(() => {
    const hora = new Date().getHours();
    return hora < 14 ? 'MANHA' : 'TARDE';
  });
  
  const huddleId = `${format(dataSelecionada, 'yyyy-MM-dd')}-${turno}`;
  const { pendencias, loading, adicionarPendencia, atualizarStatusPendencia } = useHuddle(huddleId);
  
  const [selectedPendencia, setSelectedPendencia] = useState<Pendencia | null>(null);

  const colunas = {
    PENDENTE: pendencias.filter(p => p.status === 'PENDENTE'),
    EM_ANDAMENTO: pendencias.filter(p => p.status === 'EM_ANDAMENTO'),
    RESOLVIDO: pendencias.filter(p => p.status === 'RESOLVIDO'),
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = (pendenciaId: string, novoStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'RESOLVIDO') => {
    atualizarStatusPendencia(huddleId, pendenciaId, novoStatus);
  };

  const handleOpenDetails = (pendencia: Pendencia) => {
    setSelectedPendencia(pendencia);
  };

  const turnoLabel = turno === 'MANHA' ? 'Manhã' : 'Tarde';
  const dataFormatada = format(dataSelecionada, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando huddle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-lg bg-medical-primary flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-medical-primary">
                  Quadro de Comando Huddle
                </h1>
                <p className="text-muted-foreground">
                  {dataFormatada} - Turno da {turnoLabel}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Pendências
            </Button>
            <NovaPendenciaModal onAdicionarPendencia={(pendencia) => adicionarPendencia(huddleId, pendencia)} />
          </div>
        </div>

        {/* Card de Indicadores */}
        <Card className="mb-8 bg-gradient-to-r from-medical-primary/5 to-medical-secondary/5 border-medical-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-medical-primary" />
              Indicadores do Turno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-medical-primary">{pendencias.length}</div>
                <div className="text-sm text-muted-foreground">Total de Pendências</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{colunas.PENDENTE.length}</div>
                <div className="text-sm text-muted-foreground">Para Discutir</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{colunas.EM_ANDAMENTO.length}</div>
                <div className="text-sm text-muted-foreground">Em Andamento</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{colunas.RESOLVIDO.length}</div>
                <div className="text-sm text-muted-foreground">Resolvidas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quadro Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coluna PENDENTE */}
          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                Para Discutir
                <Badge variant="secondary" className="ml-auto">
                  {colunas.PENDENTE.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {colunas.PENDENTE.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma pendência para discutir
                </p>
              ) : (
                colunas.PENDENTE.map((pendencia) => (
                  <CardPendencia
                    key={pendencia.id}
                    pendencia={pendencia}
                    onStatusChange={handleStatusChange}
                    onOpenDetails={handleOpenDetails}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Coluna EM ANDAMENTO */}
          <Card className="border-yellow-200">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-5 w-5" />
                Em Andamento
                <Badge variant="secondary" className="ml-auto">
                  {colunas.EM_ANDAMENTO.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {colunas.EM_ANDAMENTO.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma pendência em andamento
                </p>
              ) : (
                colunas.EM_ANDAMENTO.map((pendencia) => (
                  <CardPendencia
                    key={pendencia.id}
                    pendencia={pendencia}
                    onStatusChange={handleStatusChange}
                    onOpenDetails={handleOpenDetails}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Coluna RESOLVIDO */}
          <Card className="border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <TrendingUp className="h-5 w-5" />
                Resolvido no Turno
                <Badge variant="secondary" className="ml-auto">
                  {colunas.RESOLVIDO.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {colunas.RESOLVIDO.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma pendência resolvida
                </p>
              ) : (
                colunas.RESOLVIDO.map((pendencia) => (
                  <CardPendencia
                    key={pendencia.id}
                    pendencia={pendencia}
                    onStatusChange={handleStatusChange}
                    onOpenDetails={handleOpenDetails}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estilos de impressão */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-break {
            page-break-after: always;
          }
          
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Huddle;
