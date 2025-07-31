
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import StatusBadge from './StatusBadge';
import LeitoStatusIsolamento from './LeitoStatusIsolamento';
import { 
  Settings, 
  ShieldQuestion, 
  Trash2, 
  UserPlus,
  CheckCircle,
  Ban,
  RotateCcw,
  ArrowRight,
  UserMinus,
  Calendar,
  MessageSquare,
  UserX,
  Clipboard,
  Activity
} from 'lucide-react';
import { LeitoEnriquecido } from '@/types/hospital';

interface LeitoCardProps {
  leito: LeitoEnriquecido;
  actions: {
    onMoverPaciente: (leito: LeitoEnriquecido) => void;
    onAbrirObs: (leito: LeitoEnriquecido) => void;
    onAltaNoLeito: (leito: LeitoEnriquecido) => void;
    onLiberarLeito: (leitoId: string, pacienteId: string) => void;
    onAtualizarStatus: (leitoId: string, novoStatus: any) => void;
    onSolicitarUTI: (pacienteId: string) => void;
    onSolicitarRemanejamento: (pacienteId: string, motivo: string) => void;
    onTransferirPaciente: (pacienteId: string, destino: string, motivo: string) => void;
    onCancelarReserva: (leitoId: string) => void;
    onConcluirTransferencia: (leito: LeitoEnriquecido) => void;
    onToggleProvavelAlta: (pacienteId: string, valorAtual: boolean) => void;
    onFinalizarHigienizacao: (leitoId: string) => void;
    onBloquearLeito: (leitoId: string, motivo: string) => void;
    onEnviarParaHigienizacao: (leitoId: string) => void;
    onAdicionarPaciente?: (leito: LeitoEnriquecido) => void;
  };
}

const LeitoCard: React.FC<LeitoCardProps> = ({ leito, actions }) => {
  const paciente = leito.dadosPaciente;

  const renderStatusActions = () => {
    switch (leito.statusLeito) {
      case 'Vago':
        return (
          <div className="flex gap-1">
            {actions.onAdicionarPaciente && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => actions.onAdicionarPaciente!(leito)}
                      className="h-8 w-8"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Adicionar Paciente</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => actions.onBloquearLeito(leito.id, '')}
                    className="h-8 w-8"
                  >
                    <Ban className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Bloquear</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );

      case 'Higienizacao':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => actions.onFinalizarHigienizacao(leito.id)}
                  className="h-8 w-8"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Finalizar Higienização</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );

      case 'Ocupado':
        if (!paciente) return null;
        return (
          <div className="flex gap-1 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => actions.onMoverPaciente(leito)}
                    className="h-8 w-8"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Mover Paciente</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => actions.onAbrirObs(leito)}
                    className="h-8 w-8"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Observações</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => actions.onAltaNoLeito(leito)}
                    className="h-8 w-8"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Alta no Leito</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => actions.onLiberarLeito(leito.id, paciente.id)}
                    className="h-8 w-8"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Dar Alta</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );

      case 'Reservado':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => actions.onCancelarReserva(leito.id)}
                  className="h-8 w-8"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Cancelar Reserva</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );

      case 'Regulado':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => actions.onConcluirTransferencia(leito)}
                  className="h-8 w-8"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Concluir Transferência</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );

      case 'Bloqueado':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => actions.onAtualizarStatus(leito.id, 'Vago')}
                  className="h-8 w-8"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Desbloquear</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="shadow-card border border-border/50 hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold text-foreground">{leito.codigoLeito}</h4>
            <div className="flex gap-2 mt-1">
              <StatusBadge status={leito.statusLeito} />
              {leito.leitoIsolamento && (
                <Badge variant="outline" className="text-xs">
                  <ShieldQuestion className="w-3 h-3 mr-1" />
                  Isolamento
                </Badge>
              )}
              {leito.leitoPCP && (
                <Badge variant="outline" className="text-xs">
                  <Activity className="w-3 h-3 mr-1" />
                  PCP
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {renderStatusActions()}
          </div>
        </div>

        {paciente && (
          <div className="space-y-2">
            <div>
              <p className="font-medium text-foreground truncate">{paciente.nomeCompleto}</p>
              <p className="text-xs text-muted-foreground">
                {paciente.sexoPaciente} • {paciente.especialidadePaciente}
              </p>
            </div>

            {paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0 && (
              <LeitoStatusIsolamento isolamentos={paciente.isolamentosVigentes} />
            )}

            {paciente.aguardaUTI && (
              <Badge variant="destructive" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                Aguarda UTI
              </Badge>
            )}

            {paciente.provavelAlta && (
              <Badge variant="secondary" className="text-xs">
                <UserMinus className="w-3 h-3 mr-1" />
                Provável Alta
              </Badge>
            )}

            {paciente.altaNoLeito?.status && (
              <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                <Clipboard className="w-3 h-3 mr-1" />
                Alta no Leito
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeitoCard;
