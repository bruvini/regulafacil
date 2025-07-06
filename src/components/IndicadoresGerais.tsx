
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface IndicadoresGeraisProps {
  contagem: Record<string, number>;
  taxa: number;
  tempos: Record<string, string>;
}

export const IndicadoresGerais = ({ contagem, taxa, tempos }: IndicadoresGeraisProps) => {
  return (
    <Card className="shadow-card border border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-medical-primary">Indicadores Gerais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Taxa de Ocupação */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-sm font-medium text-muted-foreground">Taxa de Ocupação</h4>
            <span className="font-bold text-lg text-medical-primary">{taxa}%</span>
          </div>
          <Progress value={taxa} className="h-2" />
        </div>
        
        {/* Contagem por Status */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
          {Object.entries(contagem).map(([status, valor]) => (
            <div key={status}>
              <p className="font-bold text-xl">{valor}</p>
              <p className="text-xs text-muted-foreground">{status}</p>
            </div>
          ))}
        </div>

        {/* Tempos Médios */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Tempo Médio no Status</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {Object.entries(tempos).map(([status, valor]) => (
              <Card key={status} className="p-2">
                <p className="font-bold text-lg">{valor}</p>
                <p className="text-xs text-muted-foreground">{status}</p>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
