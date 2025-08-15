
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { 
  BedDouble, 
  User, 
  Calendar, 
  Shield, 
  AlertTriangle, 
  ArrowRight, 
  UserX, 
  CheckCircle, 
  Star,
  X,
  Lock,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeitoEnriquecido } from '@/types/hospital';
import StatusBadge from './StatusBadge';
import { LeitoStatusIsolamento } from './LeitoStatusIsolamento';
import { formatDistanceToNow, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DurationDisplay from './DurationDisplay';

interface LeitoCardProps {
  leito: LeitoEnriquecido;
  actions: {
    onMoverPaciente: (leito: LeitoEnriquecido) => void;
    onAbrirObs: (leito: LeitoEnriquecido) => void;
    onAltaNoLeito: (leito: LeitoEnriquecido) => void;
    onInternarManualmente: (leito: LeitoEnriquecido) => void;
    onReservarExterno: (leito: LeitoEnriquecido) => void;
    onLiberarLeito: (leitoId: string, pacienteId: string) => void;
    onAtualizarStatus: (leitoId: string, status: any, detalhes?: any) => void;
    onSolicitarUTI: (pacienteId: string) => void;
    onSolicitarRemanejamento: (pacienteId: string, motivo: string) => void;
    onTransferirPaciente: (pacienteId: string, destino: string, motivo: string) => void;
    onCancelarReserva: (leitoId: string) => void;
    onConcluirTransferencia: (leito: LeitoEnriquecido) => void;
    onToggleProvavelAlta: (pacienteId: string, valorAtual: boolean) => void;
    onFinalizarHigienizacao: (leitoId: string) => void;
    onBloquearLeito: (leitoId: string, motivo: string) => void;
    onEnviarParaHigienizacao: (leitoId: string) => void;
    onPriorizarHigienizacao: (leito: LeitoEnriquecido) => void;
  };
}

const LeitoCard = ({ leito, actions }: LeitoCardProps) => {
  const paciente = leito.dadosPaciente;
  
  const getCardClassName = () => {
    const baseClass = "transition-all duration-200 hover:shadow-md";
    
    // Destaque visual para leitos com higienização prioritária
    if (leito.statusLeito === 'Higienizacao' && leito.higienizacaoPrioritaria) {
      return cn(baseClass, "border-2 border-yellow-400 bg-yellow-50 shadow-md");
    }
    
    switch (leito.statusLeito) {
      case 'Vago': return cn(baseClass, "border-green-200 bg-green-50");
      case 'Ocupado': return cn(baseClass, "border-blue-200 bg-blue-50");
      case 'Higienizacao': return cn(baseClass, "border-purple-200 bg-purple-50");
      case 'Reservado': return cn(baseClass, "border-orange-200 bg-orange-50");
      case 'Bloqueado': return cn(baseClass, "border-red-200 bg-red-50");
      default: return baseClass;
    }
  };

  // Função segura para calcular tempo de internação do paciente
  const tempoInternacao = (() => {
    if (!paciente?.dataInternacao) return '';
    
    try {
      const dataInternacao = new Date(paciente.dataInternacao);
      if (!isValid(dataInternacao)) return '';
      
      return formatDistanceToNow(dataInternacao, { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch (error) {
      console.error('Erro ao calcular tempo de internação:', error, 'Data:', paciente.dataInternacao);
      return '';
    }
  })();

  return (
    <Card className={getCardClassName()}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BedDouble className="h-5 w-5" />
            {leito.codigoLeito}
            {leito.higienizacaoPrioritaria && leito.statusLeito === 'Higienizacao' && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <StatusBadge status={leito.statusLeito} />
            {leito.leitoPCP && <Badge variant="secondary" className="text-xs">PCP</Badge>}
            {leito.leitoIsolamento && <Badge variant="destructive" className="text-xs">ISO</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {paciente && (
          <>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{paciente.nomeCompleto}</span>
              {paciente.provavelAlta && (
                <Badge variant="secondary" className="ml-1">
                  Provável Alta
                </Badge>
              )}
            </div>
            {tempoInternacao && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Internado(a) {tempoInternacao}
              </div>
            )}
            {paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0 && (
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-destructive" />
                <LeitoStatusIsolamento isolamentos={paciente.isolamentosVigentes.map(iso => iso.sigla)} />
              </div>
            )}
            {paciente.aguardaUTI && (
              <div className="flex items-center gap-1 text-orange-500">
                <AlertTriangle className="h-4 w-4" />
                Aguardando UTI
              </div>
            )}
            {paciente.transferirPaciente && (
              <div className="flex items-center gap-1 text-blue-500">
                <ArrowRight className="h-4 w-4" />
                Transferir para {paciente.destinoTransferencia}
              </div>
            )}
            {paciente.remanejarPaciente && (
              <div className="flex items-center gap-1 text-purple-500">
                <UserX className="h-4 w-4" />
                Remanejar ({paciente.motivoRemanejamento})
              </div>
            )}
            {paciente.altaNoLeito?.status && (
              <div className="flex items-center gap-1 text-green-500">
                <CheckCircle className="h-4 w-4" />
                Alta no Leito
              </div>
            )}
          </>
        )}
        
        {/* Tempo desde última atualização usando componente seguro */}
        {leito.dataAtualizacaoStatus && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <DurationDisplay dataAtualizacaoStatus={leito.dataAtualizacaoStatus} />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        {/* Actions for Higienizacao status */}
        {leito.statusLeito === 'Higienizacao' && (
          <div className="flex justify-center flex-wrap gap-1 w-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => actions.onFinalizarHigienizacao(leito.id)}
                    className="bg-medical-success hover:bg-medical-success/90 text-white border-medical-success"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Finalizar
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Finalizar Higienização</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "border",
                      leito.higienizacaoPrioritaria 
                        ? 'text-yellow-600 border-yellow-400 bg-yellow-100 hover:bg-yellow-200' 
                        : 'border-gray-300 hover:bg-gray-100'
                    )}
                    onClick={() => actions.onPriorizarHigienizacao(leito)}
                  >
                    <Star className={cn(
                      "h-4 w-4 mr-1", 
                      leito.higienizacaoPrioritaria && 'fill-yellow-500 text-yellow-500'
                    )} />
                    {leito.higienizacaoPrioritaria ? 'Prioritário' : 'Priorizar'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{leito.higienizacaoPrioritaria ? 'Remover Prioridade' : 'Priorizar Higienização'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Actions for Vago status */}
        {leito.statusLeito === 'Vago' && (
          <div className="flex justify-center flex-wrap gap-1 w-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => actions.onInternarManualmente(leito)}><User className="h-4 w-4 mr-1" />Internar</Button>
                </TooltipTrigger>
                <TooltipContent><p>Internar Paciente Manualmente</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => actions.onReservarExterno(leito)}><Lock className="h-4 w-4 mr-1" />Reservar</Button>
                </TooltipTrigger>
                <TooltipContent><p>Reservar Leito para Paciente Externo</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => actions.onEnviarParaHigienizacao(leito.id)}><Sparkles className="h-4 w-4 mr-1" />Higienizar</Button>
                </TooltipTrigger>
                <TooltipContent><p>Enviar para Higienização</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="destructive" size="sm" onClick={() => actions.onBloquearLeito(leito.id, 'Motivo do Bloqueio')}><X className="h-4 w-4 mr-1" />Bloquear</Button>
                </TooltipTrigger>
                <TooltipContent><p>Bloquear Leito</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Actions for Ocupado status */}
        {leito.statusLeito === 'Ocupado' && paciente && (
          <div className="flex justify-center flex-wrap gap-1 w-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => actions.onMoverPaciente(leito)}><ArrowRight className="h-4 w-4 mr-1" />Mover</Button>
                </TooltipTrigger>
                <TooltipContent><p>Mover Paciente para outro Leito</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => actions.onAbrirObs(leito)}><AlertTriangle className="h-4 w-4 mr-1" />Obs</Button>
                </TooltipTrigger>
                <TooltipContent><p>Adicionar Observações ao Paciente</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => actions.onAltaNoLeito(leito)}><CheckCircle className="h-4 w-4 mr-1" />Alta</Button>
                </TooltipTrigger>
                <TooltipContent><p>Dar Alta no Leito</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="destructive" size="sm" onClick={() => actions.onLiberarLeito(leito.id, paciente.id)}><UserX className="h-4 w-4 mr-1" />Liberar</Button>
                </TooltipTrigger>
                <TooltipContent><p>Liberar Leito (Alta do Paciente)</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Actions for Reservado status */}
        {leito.statusLeito === 'Reservado' && (
          <div className="flex justify-center flex-wrap gap-1 w-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => actions.onConcluirTransferencia(leito)}><ArrowRight className="h-4 w-4 mr-1" />Concluir</Button>
                </TooltipTrigger>
                <TooltipContent><p>Concluir Transferência</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="destructive" size="sm" onClick={() => actions.onCancelarReserva(leito.id)}><X className="h-4 w-4 mr-1" />Cancelar</Button>
                </TooltipTrigger>
                <TooltipContent><p>Cancelar Reserva</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

         {/* Actions for Bloqueado status */}
         {leito.statusLeito === 'Bloqueado' && (
          <div className="flex justify-center flex-wrap gap-1 w-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => actions.onAtualizarStatus(leito.id, 'Vago')}><CheckCircle className="h-4 w-4 mr-1" />Liberar</Button>
                </TooltipTrigger>
                <TooltipContent><p>Liberar Leito</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default LeitoCard;
