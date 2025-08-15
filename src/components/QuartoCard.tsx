
// src/components/QuartoCard.tsx

import { useMemo } from 'react';
import LeitoCard from './LeitoCard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { AlertTriangle } from 'lucide-react';
import { LeitoEnriquecido } from '@/types/hospital';

interface QuartoCardProps {
  nomeQuarto: string;
  leitos: LeitoEnriquecido[];
  actions: any;
}

const QuartoCard = ({ nomeQuarto, leitos, actions }: QuartoCardProps) => {
  const hasMixedGenders = useMemo(() => {
    const genders = new Set(leitos.filter(l => l.dadosPaciente).map(l => l.dadosPaciente?.sexoPaciente));
    return genders.size > 1;
  }, [leitos]);

  return (
    <Card className="bg-muted/30 border-2 border-dashed p-2">
      <CardHeader className="py-2 px-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-md font-semibold text-foreground">
            Quarto {nomeQuarto}
          </CardTitle>
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
      <CardContent className="p-2 pt-0">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
          {leitos.sort((a, b) => a.codigoLeito.localeCompare(b.codigoLeito, undefined, { numeric: true })).map((leito) => (
              <LeitoCard 
                key={leito.id} 
                leito={leito} 
                actions={actions}
              />
          ))}
        </div>
      </CardContent>
    </Card>
  ); 
};

export default QuartoCard;
