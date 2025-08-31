
import { DadosPaciente } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Settings, CheckCircle, X, Loader2 } from 'lucide-react';
import { formatarDuracao } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Props {
  paciente: any;
  onConcluir: (paciente: any) => void;
  onAlterar: (paciente: any) => void;
  onCancelar: (paciente: any) => void;
  isActing?: boolean;
}

export const PacienteReguladoItem = ({ 
  paciente, 
  onConcluir, 
  onAlterar, 
  onCancelar, 
  isActing = false 
}: Props) => {
  const tempoRegulado = formatarDuracao(paciente.regulacao?.dataAtualizacaoStatus || paciente.regulacao?.data);
  
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isActing}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Concluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Conclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja concluir a regulação para o paciente <strong>{paciente.nomeCompleto}</strong>? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onConcluir(paciente)}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onAlterar(paciente)}
          disabled={isActing}
        >
          <Settings className="h-4 w-4 mr-1" />
          Alterar
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onCancelar(paciente)}
          disabled={isActing}
        >
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </div>
    </div>
  );
};
