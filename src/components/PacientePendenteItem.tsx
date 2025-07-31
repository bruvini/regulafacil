
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, LogOut, Loader2 } from 'lucide-react';
import { formatarDuracao } from '@/lib/utils';

interface Props {
  paciente: any;
  onRegularClick: (paciente: any) => void;
  onAltaClick: (paciente: any) => void;
  isActing?: boolean;
}

export const PacientePendenteItem = ({ 
  paciente, 
  onRegularClick, 
  onAltaClick,
  isActing = false 
}: Props) => {
  const tempoEspera = formatarDuracao(paciente.dataInternacao);
  
  return (
    <div className={`flex items-center justify-between p-3 bg-muted/30 rounded-lg border relative ${isActing ? 'opacity-75' : ''}`}>
      {isActing && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg z-10">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-sm">{paciente.nomeCompleto}</p>
          <Badge variant="outline">{paciente.siglaSetorOrigem}</Badge>
          <Badge variant="secondary">{paciente.especialidadePaciente}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs text-muted-foreground">Leito: {paciente.leitoCodigo}</p>
          <p className="text-xs text-muted-foreground">Tempo: {tempoEspera}</p>
          {paciente.sexoPaciente && (
            <Badge variant="outline" className="text-xs">
              {paciente.sexoPaciente === 'Masculino' ? 'M' : 'F'}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onRegularClick(paciente)}
          disabled={isActing}
        >
          <UserCheck className="h-4 w-4 mr-1" />
          Regular
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onAltaClick(paciente)}
          disabled={isActing}
          className="text-medical-danger hover:text-medical-danger/90 hover:bg-medical-danger/10"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Alta
        </Button>
      </div>
    </div>
  );
};
