import { Star, Bug, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Leito } from '@/types/hospital';
import StatusBadge from './StatusBadge';
import DurationDisplay from './DurationDisplay';

interface LeitoCardProps {
  leito: Leito;
}

const LeitoCard = ({ leito }: LeitoCardProps) => {
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
      </div>
    </Card>
  );
};

export default LeitoCard;