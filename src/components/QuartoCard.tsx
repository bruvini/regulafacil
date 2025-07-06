
import { useMemo } from 'react';
import { Leito } from '@/types/hospital';
import LeitoCard from './LeitoCard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { AlertTriangle } from 'lucide-react';

interface QuartoCardProps {
  nomeQuarto: string;
  leitos: Leito[];
  setorId: string;
}

const QuartoCard = ({ nomeQuarto, leitos, setorId }: QuartoCardProps) => {
  // Lógica para detectar sexos misturados
  const hasMixedGenders = useMemo(() => {
    const genders = new Set(
      leitos
        .filter(l => l.statusLeito === 'Ocupado')
        .map(l => l.dadosPaciente?.sexoPaciente)
        .filter(Boolean) // Remove undefined/null
    );
    return genders.size > 1;
  }, [leitos]);

  return (
    <Card className="bg-muted/50 border-2 border-dashed col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-md font-semibold text-foreground">
            Quarto {nomeQuarto}
          </CardTitle>
          {/* Renderização condicional do alerta */}
          {hasMixedGenders && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Alerta: Pacientes de sexos diferentes neste quarto.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {leitos
            .sort((a, b) => a.codigoLeito.localeCompare(b.codigoLeito, undefined, { numeric: true, sensitivity: 'base' }))
            .map((leito) => (
              <LeitoCard key={leito.id} leito={leito} setorId={setorId} />
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuartoCard;
