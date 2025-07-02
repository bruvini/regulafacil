
import { Star, ShieldAlert, Lock, Paintbrush } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Leito } from '@/types/hospital';
import StatusBadge from './StatusBadge';
import DurationDisplay from './DurationDisplay';
import { useSetores } from '@/hooks/useSetores';

interface LeitoCardProps {
  leito: Leito;
  setorId: string;
}

const LeitoCard = ({ leito, setorId }: LeitoCardProps) => {
  const { atualizarStatusLeito } = useSetores();

  const handleBloquear = () => {
    const motivo = prompt('Informe o motivo do bloqueio:');
    if (motivo) {
      atualizarStatusLeito(setorId, leito.id, 'Bloqueado', motivo);
    }
  };

  const handleHigienizar = () => {
    atualizarStatusLeito(setorId, leito.id, 'Higienizacao');
  };

  return (
    <Card className="p-4 shadow-card hover:shadow-medical transition-all duration-200 border border-border/50">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-foreground">{leito.codigoLeito}</h4>
            <div className="flex space-x-1">
              {leito.leitoPCP && (
                <div className="p-1 bg-medical-warning/10 rounded-full">
                  <Star className="h-3 w-3 text-medical-warning" fill="currentColor" />
                </div>
              )}
              {leito.leitoIsolamento && (
                <div className="p-1 bg-medical-danger/10 rounded-full">
                  <ShieldAlert className="h-3 w-3 text-medical-danger" />
                </div>
              )}
            </div>
          </div>
          <StatusBadge status={leito.statusLeito} />
        </div>
        
        <div className="pt-2 border-t border-border/30">
          <DurationDisplay dataAtualizacaoStatus={leito.dataAtualizacaoStatus} />
        </div>
        
        {(leito.leitoPCP || leito.leitoIsolamento) && (
          <div className="flex flex-wrap gap-2 text-xs">
            {leito.leitoPCP && (
              <span className="px-2 py-1 bg-medical-warning/10 text-medical-warning rounded-md">
                PCP
              </span>
            )}
            {leito.leitoIsolamento && (
              <span className="px-2 py-1 bg-medical-danger/10 text-medical-danger rounded-md">
                Isolamento
              </span>
            )}
          </div>
        )}

        {leito.statusLeito === 'Vago' && (
          <div className="flex justify-center space-x-2 pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleBloquear}
                    className="h-8 w-8"
                  >
                    <Lock className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Bloquear Leito</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleHigienizar}
                    className="h-8 w-8"
                  >
                    <Paintbrush className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Higienizar Leito</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LeitoCard;
