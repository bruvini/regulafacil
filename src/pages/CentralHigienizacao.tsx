
import { useAuth } from '@/hooks/useAuth';
import { useHigienizacao } from '@/hooks/useHigienizacao';
import IndicadoresHigienizacao from '@/components/IndicadoresHigienizacao';
import ListaHigienizacao from '@/components/ListaHigienizacao';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

const CentralHigienizacao = () => {
  const { userData } = useAuth();
  const { leitosEmHigienizacao, indicadores, handleConcluirHigienizacao, loading } = useHigienizacao();

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
          {leitosEmHigienizacao.length > 0 ? (
            <ListaHigienizacao 
              leitosAgrupados={leitosEmHigienizacao} 
              onConcluir={handleConcluirHigienizacao} 
            />
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
