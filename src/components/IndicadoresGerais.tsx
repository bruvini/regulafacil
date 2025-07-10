
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface IndicadoresGeraisProps {
  contagem: Record<string, number>;
  taxa: number;
  tempos: Record<string, string>;
  nivelPCP: { nivel: string; cor: string; count: number };
}

export const IndicadoresGerais = ({ contagem, taxa, tempos, nivelPCP }: IndicadoresGeraisProps) => {
  const getProgressColor = (value: number) => {
    const hue = Math.max(0, 120 * (1 - value / 100));
    return `hsl(${hue}, 80%, 45%)`;
  };

  const statusOrder = ['Ocupado', 'Vago', 'Bloqueado', 'Higienizacao', 'Regulado', 'Reservado'];

  return (
    <Card className="shadow-card border border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-medical-primary">Indicadores Gerais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-sm font-medium text-muted-foreground">Taxa de Ocupação</h4>
            <span className="font-bold text-lg text-medical-primary">{taxa}%</span>
          </div>
          <Progress value={taxa} className="h-3" style={{ backgroundColor: 'hsl(var(--muted))' }}>
             <div
              className="h-3 rounded-full transition-all duration-500"
              style={{ width: `${taxa}%`, backgroundColor: getProgressColor(taxa) }}
            />
          </Progress>
        </div>

        <div className={cn("p-4 rounded-lg text-white text-center transition-colors", nivelPCP.cor)}>
          <p className="font-bold text-lg">PCP {nivelPCP.nivel}</p>
          <p className="text-sm opacity-90">{nivelPCP.count} pacientes internados no Pronto Socorro (DCX + DCL)</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Status dos Leitos</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            {statusOrder.map((status) => (
              <Card key={status} className="p-3 flex flex-col justify-between">
                <div>
                  <p className="font-bold text-2xl">{contagem[status] ?? 0}</p>
                  <p className="text-sm font-semibold text-foreground">{status}</p>
                </div>
                {(tempos[status] && status !== 'Regulado' && status !== 'Reservado') && (
                   <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-2">
                     <Clock className="h-3 w-3" />
                     <span>{tempos[status]}</span>
                   </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
