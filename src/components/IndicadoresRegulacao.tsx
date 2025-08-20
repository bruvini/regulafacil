
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle, XCircle, Repeat, ArrowRight, ArrowLeft, Sun, Moon, Sunset } from 'lucide-react';

interface IndicadoresProps {
  indicadores: {
    aguardandoLeito: number;
    tempoMedioInternacao: string;
    contagemStatus: { Pendentes: number; Concluidas: number; Canceladas: number; Alteradas: number; };
    tempoMedioRegulacaoPendente: string;
    topOrigem: { nome: string; contagem: number };
    topDestino: { nome: string; contagem: number };
    topTurno: { nome: string; contagem: number };
  }
}

export const IndicadoresRegulacao = ({ indicadores }: IndicadoresProps) => {
  const { aguardandoLeito, tempoMedioInternacao, contagemStatus, tempoMedioRegulacaoPendente, topOrigem, topDestino, topTurno } = indicadores;
  
  const getTurnoIcon = (turno: string) => {
    if (turno.includes('Manhã')) return <Sun className="h-4 w-4 text-muted-foreground" />;
    if (turno.includes('Tarde')) return <Sunset className="h-4 w-4 text-muted-foreground" />;
    if (turno.includes('Noite')) return <Moon className="h-4 w-4 text-muted-foreground" />;
    return null;
  };

  return (
    <Card className="shadow-card border border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-medical-primary">Indicadores da Regulação</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Pacientes Aguardando */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Leito no PS</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aguardandoLeito}</div>
            <p className="text-xs text-muted-foreground">TP médio - Espera por leito: {tempoMedioInternacao}</p>
          </CardContent>
        </Card>
        
        {/* Status das Regulações */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Status das Regulações (Histórico)</CardTitle></CardHeader>
          <CardContent className="flex justify-around items-center pt-2">
            <div className="text-center"><CheckCircle className="h-4 w-4 mx-auto text-green-500" /><p className="font-bold">{contagemStatus.Concluidas}</p><p className="text-xs">Concluídas</p></div>
            <div className="text-center"><XCircle className="h-4 w-4 mx-auto text-red-500" /><p className="font-bold">{contagemStatus.Canceladas}</p><p className="text-xs">Canceladas</p></div>
            <div className="text-center"><Repeat className="h-4 w-4 mx-auto text-blue-500" /><p className="font-bold">{contagemStatus.Alteradas}</p><p className="text-xs">Alteradas</p></div>
          </CardContent>
        </Card>

        {/* Tempo Médio de Regulação */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio (Pendentes)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tempoMedioRegulacaoPendente}</div>
            <p className="text-xs text-muted-foreground">Tempo de espera atual</p>
          </CardContent>
        </Card>
        
        {/* Top Setores e Turno com contagens */}
        <Card className="col-span-2 lg:col-span-4">
           <CardContent className="flex justify-around items-center pt-6 text-center">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              <p className="text-sm">Origem mais frequente: <span className="font-bold">{topOrigem.nome} ({topOrigem.contagem})</span></p>
            </div>
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <p className="text-sm">Destino mais frequente: <span className="font-bold">{topDestino.nome} ({topDestino.contagem})</span></p>
            </div>
            <div className="flex items-center gap-2">
              {getTurnoIcon(topTurno.nome)}
              <p className="text-sm">Turno com mais regulações: <span className="font-bold">{topTurno.nome} ({topTurno.contagem})</span></p>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
