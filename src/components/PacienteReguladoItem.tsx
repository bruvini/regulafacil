
import { DadosPaciente } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Settings, CheckCircle, X } from 'lucide-react';
import { formatarDuracao } from '@/lib/utils';

interface Props {
  paciente: any;
  onConcluir: (paciente: any) => void;
  onAlterar: (paciente: any) => void;
  onCancelar: (paciente: any) => void;
}

export const PacienteReguladoItem = ({ paciente, onConcluir, onAlterar, onCancelar }: Props) => {
  const tempoRegulado = formatarDuracao(paciente.regulacao.data); // Use 'data'
  
  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-sm">{paciente.nomePaciente}</p>
          <Badge variant="outline">{paciente.siglaSetorOrigem}</Badge>
          <p className="text-xs text-muted-foreground">→</p>
          <Badge variant="secondary">{paciente.regulacao?.paraSetorSigla || paciente.regulacao?.paraSetor}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs text-muted-foreground">
            Leito: {paciente.leitoCodigo} → {paciente.regulacao?.paraLeito}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {tempoRegulado}
          </div>
        </div>
        {paciente.regulacao?.observacoes && (
          <p className="text-xs text-muted-foreground mt-1">
            Obs: {paciente.regulacao.observacoes}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onConcluir(paciente)}>
          <CheckCircle className="h-4 w-4 mr-1" />
          Concluir
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onAlterar(paciente)}>
          <Settings className="h-4 w-4 mr-1" />
          Alterar
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onCancelar(paciente)}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </div>
    </div>
  );
};
