import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  UserPlus,
  Users,
  AlertTriangle,
  Bed,
  BedDouble,
  LayoutDashboard,
  CheckSquare,
  X,
  LucideIcon,
  RotateCcw,
  ShieldQuestion,
  Send,
  Lock,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LeitoEnriquecido } from '@/types/hospital';

interface LeitoCardProps {
  setor: any;
  leito: LeitoEnriquecido;
  actions: any;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Vago':
      return 'text-green-500';
    case 'Ocupado':
      return 'text-red-500';
    case 'Higienizacao':
      return 'text-yellow-500';
    case 'Reservado':
      return 'text-blue-500';
    case 'Bloqueado':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
}

const statusMap = {
  Vago: { label: 'Vago', description: 'Leito disponível para uso.', icon: Bed, action: 'Enviar para Higienização' },
  Ocupado: { label: 'Ocupado', description: 'Leito atualmente ocupado por um paciente.', icon: Users, action: 'Liberar Leito' },
  Higienizacao: { label: 'Higienização', description: 'Leito em processo de limpeza e desinfecção.', icon: RotateCcw, action: 'Finalizar Higienização' },
  Reservado: { label: 'Reservado', description: 'Leito reservado para um paciente específico.', icon: UserPlus, action: 'Confirmar Transferência' },
  Bloqueado: { label: 'Bloqueado', description: 'Leito temporariamente indisponível.', icon: Lock, action: 'Desbloquear Leito' },
  Regulado: { label: 'Regulado', description: 'Leito aguardando liberação para um paciente regulado.', icon: AlertTriangle, action: 'Confirmar Regulação' },
};

const getStatusInfo = (status: string) => statusMap[status] || {
  label: 'Indefinido',
  description: 'Status do leito não definido.',
  icon: AlertTriangle,
  action: 'Verificar Status',
};

const LeitoCard: React.FC<LeitoCardProps> = ({ setor, leito, actions }) => {
  const statusInfo = getStatusInfo(leito.statusLeito);
  const StatusIcon: LucideIcon = statusInfo.icon;

  if (!leito) {
    return <p>Leito não encontrado.</p>;
  }

  return (
    <Card className="shadow-md border border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>{leito.codigoLeito}</span>
          <Badge variant="secondary">
            <StatusIcon className="mr-2 h-4 w-4" />
            {leito.statusLeito}
          </Badge>
        </CardTitle>
        <CardDescription>
          {statusInfo.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <p className="text-sm font-medium text-gray-600">Tipo:</p>
            <p className="text-sm">{leito.tipoLeito}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">PCP:</p>
            <p className="text-sm">{leito.leitoPCP ? 'Sim' : 'Não'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Isolamento:</p>
            <p className="text-sm">{leito.leitoIsolamento ? 'Sim' : 'Não'}</p>
          </div>
          {leito.motivoBloqueio && (
            <div>
              <p className="text-sm font-medium text-gray-600">Motivo do Bloqueio:</p>
              <p className="text-sm">{leito.motivoBloqueio}</p>
            </div>
          )}
          {leito.regulacao?.origemExterna && (
            <div>
              <p className="text-sm font-medium text-gray-600">Origem:</p>
              <p className="text-sm">{leito.regulacao.origemExterna}</p>
            </div>
          )}
          {leito.dadosPaciente && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-600">Paciente:</p>
                <p className="text-sm">{leito.dadosPaciente.nomeCompleto}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Especialidade:</p>
                <p className="text-sm">{leito.dadosPaciente.especialidadePaciente}</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        {/* Ações para leito Vago */}
        {leito.statusLeito === 'Vago' && (
          <div className="flex justify-center flex-wrap gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => actions.onEnviarParaHigienizacao?.(leito.id)}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enviar para Higienização</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => actions.onBloquearLeito?.(leito.id, 'Motivo Padrão')}>
                    <Lock className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Bloquear Leito</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => actions.onInternarManualmente?.(leito)}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Internar Manualmente</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => actions.onReservarExterno?.(leito)}>
                    <Send className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reservar Externamente</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Ações para leito Ocupado */}
        {leito.statusLeito === 'Ocupado' && (
          <div className="flex justify-center flex-wrap gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => actions.onMoverPaciente?.(leito)}>
                    <LayoutDashboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mover Paciente</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => actions.onAbrirObs?.(leito)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adicionar Observações</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => actions.onAltaNoLeito?.(leito)}>
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Alta no Leito</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                    if (leito.dadosPaciente) {
                      actions.onLiberarLeito?.(leito.id, leito.dadosPaciente.id);
                    }
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Liberar Leito</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Ações para leito Higienização */}
        {leito.statusLeito === 'Higienizacao' && (
          <div className="flex justify-center flex-wrap gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => actions.onFinalizarHigienizacao?.(leito.id)}>
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Finalizar Higienização</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

              {/* Ações para leito Reservado */}
              {leito.statusLeito === 'Reservado' && (
                <div className="flex justify-center flex-wrap gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            if (leito.regulacao?.tipoReserva === 'externo') {
                              actions.onConfirmarReservaExterna?.(leito);
                            } else {
                              actions.onConcluirTransferencia?.(leito);
                            }
                          }}
                        >
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Confirmar {leito.regulacao?.tipoReserva === 'externo' ? 'Internação' : 'Transferência'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => actions.onCancelarReserva?.(leito.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cancelar Reserva</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

        {/* Ações para leito Bloqueado */}
        {leito.statusLeito === 'Bloqueado' && (
          <div className="flex justify-center flex-wrap gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => actions.onAtualizarStatus?.(leito.id, 'Vago')}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Desbloquear Leito</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default LeitoCard;
