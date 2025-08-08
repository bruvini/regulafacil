import React from 'react';
import { MoreVertical, Edit, UserPlus, Users, Bed, RefreshCcw, XCircle, CheckCircle, AlertTriangle, Info, Eye, BedDouble, RotateCcw, UserX, Power, Send, Lock, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { LeitoEnriquecido } from '@/types/hospital';

interface LeitoCardProps {
  leito: LeitoEnriquecido;
  actions: any;
}

const LeitoCard: React.FC<LeitoCardProps> = ({ leito, actions }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Vago': return 'text-green-500';
      case 'Ocupado': return 'text-red-500';
      case 'Higienizacao': return 'text-yellow-500';
      case 'Reservado': return 'text-blue-500';
      case 'Regulado': return 'text-purple-500';
      case 'Bloqueado': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Vago': return 'Vago';
      case 'Ocupado': return 'Ocupado';
      case 'Higienizacao': return 'Higienização';
      case 'Reservado': return 'Reservado';
      case 'Regulado': return 'Regulado';
      case 'Bloqueado': return 'Bloqueado';
      default: return 'Desconhecido';
    }
  };

  const statusColor = getStatusColor(leito.statusLeito);
  const statusLabel = getStatusLabel(leito.statusLeito);

  return (
    <Card className="w-full shadow-card border border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">{leito.codigoLeito}</h3>
            <p className="text-sm text-muted-foreground">
              {statusLabel}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => actions.onAtualizarStatus(leito.id, 'Vago')}>
                <UserX className="mr-2 h-4 w-4" />
                Liberar Leito
              </DropdownMenuItem>
              {leito.statusLeito === 'Vago' && (
                <>
                  <DropdownMenuItem onClick={() => actions.onInternarManualmente(leito)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Internar Manualmente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.onReservarExterno(leito)}>
                    <Send className="mr-2 h-4 w-4" />
                    Reserva Externa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.onBloquearLeito(leito.id, 'Motivo do Bloqueio')}>
                    <Lock className="mr-2 h-4 w-4" />
                    Bloquear Leito
                  </DropdownMenuItem>
                </>
              )}
              {leito.statusLeito === 'Ocupado' && leito.dadosPaciente && (
                <>
                  <DropdownMenuItem onClick={() => actions.onMoverPaciente(leito)}>
                    <Users className="mr-2 h-4 w-4" />
                    Mover Paciente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.onAbrirObs(leito)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Observações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.onAltaNoLeito(leito)}>
                    <Power className="mr-2 h-4 w-4" />
                    Alta no Leito
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.onSolicitarUTI(leito.dadosPaciente.id)}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Solicitar UTI
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.onSolicitarRemanejamento(leito.dadosPaciente.id, 'Motivo do Remanejamento')}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Solicitar Remanejamento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.onTransferirPaciente(leito.dadosPaciente.id, 'Destino da Transferência', 'Motivo da Transferência')}>
                    <Send className="mr-2 h-4 w-4" />
                    Transferir Paciente
                  </DropdownMenuItem>
                </>
              )}
              {leito.statusLeito === 'Higienizacao' && (
                <DropdownMenuItem onClick={() => actions.onFinalizarHigienizacao(leito.id)}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Finalizar Higienização
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Editar Leito
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Ações para diferentes status de leito */}
        <div className="mt-4 flex justify-between items-center">
          <Badge variant="outline" className={statusColor}>
            {statusLabel}
          </Badge>

          {/* Ações para leito Vago */}
          {leito.statusLeito === 'Vago' && (
            <div className="flex justify-center flex-wrap gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => actions.onAtualizarStatus(leito.id, 'Ocupado')}>
                      <UserPlus className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ocupar Leito</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => actions.onEnviarParaHigienizacao(leito.id)}>
                      <RefreshCcw className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enviar para Higienização</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Ações para leito Ocupado */}
          {leito.statusLeito === 'Ocupado' && leito.dadosPaciente && (
            <div className="flex justify-center flex-wrap gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => actions.onLiberarLeito(leito.id, leito.dadosPaciente.id)}>
                      <UserX className="h-5 w-5 text-red-600 hover:text-red-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Liberar Leito</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => actions.onAtualizarStatus(leito.id, 'Bloqueado')}>
                      <XCircle className="h-5 w-5 text-yellow-600 hover:text-yellow-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bloquear Leito</p>
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
                        className="h-8 w-8 text-green-600 hover:text-green-700"
                        onClick={() =>
                          leito.regulacao?.tipoReserva === 'externo'
                            ? actions.onConfirmarInternacaoExterna?.(leito)
                            : actions.onConcluirTransferencia?.(leito)
                        }
                      >
                        <CheckCircle className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Confirmar {leito.regulacao?.tipoReserva === 'externo' ? 'Internação' : 'Transferência'}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => actions.onCancelarReserva(leito.id)}>
                        <XCircle className="h-5 w-5 text-red-600 hover:text-red-700" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cancelar Reserva</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            {/* Ações para leito em Higienização */}
            {leito.statusLeito === 'Higienizacao' && (
              <div className="flex justify-center flex-wrap gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => actions.onFinalizarHigienizacao(leito.id)}>
                        <CheckCircle className="h-5 w-5 text-green-600 hover:text-green-700" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Finalizar Higienização</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
        </div>

        {/* Conteúdo para diferentes status de leito */}
        {leito.statusLeito === 'Ocupado' && leito.dadosPaciente && (
          <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
            <Avatar className="mx-auto">
              <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
              <AvatarFallback>{leito.dadosPaciente.nomeCompleto.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium text-red-800">{leito.dadosPaciente.nomeCompleto}</p>
            <p className="text-xs text-red-600 mt-1">
              {leito.dadosPaciente.especialidadePaciente}
            </p>
          </div>
        )}

        {/* Conteúdo para leito Reservado */}
        {leito.statusLeito === 'Reservado' && (
          <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <Avatar className="mx-auto">
              <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
              <AvatarFallback>{leito.dadosPaciente?.nomeCompleto.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium text-yellow-800">{leito.dadosPaciente?.nomeCompleto}</p>
            {leito.regulacao?.tipoReserva === 'externo' ? (
              <p className="text-xs text-teal-600 mt-1">Origem Externa: {leito.regulacao.origemExterna}</p>
            ) : (
              leito.regulacao && (
                <p className="text-xs text-yellow-600 mt-1">
                  {leito.regulacao.paraSetor} - {leito.regulacao.paraLeito}
                </p>
              )
            )}
          </div>
        )}

        {/* Conteúdo para leito em Higienização */}
        {leito.statusLeito === 'Higienizacao' && (
          <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">Em Higienização</p>
          </div>
        )}

        {/* Conteúdo para leito Bloqueado */}
        {leito.statusLeito === 'Bloqueado' && (
          <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
            <Lock className="mx-auto h-6 w-6 text-gray-600" />
            <p className="text-sm font-medium text-gray-800">Leito Bloqueado</p>
            <p className="text-xs text-gray-600 mt-1">Motivo: {leito.motivoBloqueio}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeitoCard;
