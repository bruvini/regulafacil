
import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  User, 
  Clock, 
  Sparkles, 
  Lock, 
  Star,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Virus,
  Shield,
  Calendar,
  UserCheck,
  Building
} from 'lucide-react';
import { LeitoEnriquecido } from '@/types/hospital';
import { cn } from '@/lib/utils';
import DurationDisplay from './DurationDisplay';
import StatusBadge from './StatusBadge';
import { formatarDataHora, calcularIdade } from '@/lib/formatters';

interface LeitoCardProps {
  leito: LeitoEnriquecido;
  actions: {
    onMoverPaciente: (leito: LeitoEnriquecido) => void;
    onAbrirObs: (leito: LeitoEnriquecido) => void;
    onAltaNoLeito: (leito: LeitoEnriquecido) => void;
    onInternarManualmente: (leito: LeitoEnriquecido) => void;
    onReservarExterno: (leito: LeitoEnriquecido) => void;
    onLiberarLeito: (leitoId: string, pacienteId: string) => void;
    onAtualizarStatus: (leitoId: string, status: string, detalhes?: any) => void;
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
  const ultimoStatus = leito.historicoMovimentacao?.slice(-1)[0];

  // Função para renderizar ícones de isolamento
  const renderIsolamentoIcons = (isolamentos: string[]) => {
    if (!isolamentos || isolamentos.length === 0) return null;
    
    return (
      <div className="flex gap-1">
        {isolamentos.map((isolamento, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  <Virus className="h-3 w-3 mr-1" />
                  {isolamento}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Isolamento: {isolamento}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };

  // Renderização baseada no status do leito
  if (leito.statusLeito === 'Vago') {
    return (
      <Card className="border border-green-200 bg-green-50 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-green-800">Leito {leito.codigoLeito}</h3>
            <StatusBadge status="Vago" />
          </div>
        </CardHeader>
        <CardContent className="text-center py-4">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-green-700 font-medium">Disponível</p>
          <p className="text-xs text-green-600">Pronto para ocupação</p>
        </CardContent>
        <CardFooter className="pt-2 justify-center">
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => actions.onInternarManualmente(leito)}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Internar Manualmente</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => actions.onReservarExterno(leito)}
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Reservar para Externo</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardFooter>
      </Card>
    );
  }

  if (leito.statusLeito === 'Ocupado' && paciente) {
    const isolamentos = paciente.isolamentosVigentes?.map(iso => iso.sigla) || [];
    const temObservacoes = paciente.obsPaciente && paciente.obsPaciente.length > 0;
    
    return (
      <Card className="border border-blue-200 bg-blue-50 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-blue-800">Leito {leito.codigoLeito}</h3>
            <StatusBadge status="Ocupado" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">{paciente.nomeCompleto}</span>
            {paciente.sexoPaciente === 'Masculino' ? (
              <Badge variant="outline" className="text-xs">M</Badge>
            ) : (
              <Badge variant="outline" className="text-xs">F</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Calendar className="h-3 w-3" />
            <span>{calcularIdade(paciente.dataNascimento)} anos</span>
            <Clock className="h-3 w-3 ml-2" />
            <DurationDisplay dataAtualizacaoStatus={paciente.dataInternacao} />
          </div>

          <div className="text-xs text-blue-600">
            <p><strong>Especialidade:</strong> {paciente.especialidadePaciente}</p>
          </div>

          {isolamentos.length > 0 && renderIsolamentoIcons(isolamentos)}

          {paciente.aguardaUTI && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Aguarda UTI
            </Badge>
          )}

          {paciente.provavelAlta && (
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
              <UserCheck className="h-3 w-3 mr-1" />
              Provável Alta
            </Badge>
          )}

          {paciente.altaNoLeito?.status && (
            <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
              <Building className="h-3 w-3 mr-1" />
              Alta no Leito
            </Badge>
          )}
        </CardContent>
        <CardFooter className="pt-2 justify-center">
          <div className="flex gap-1 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => actions.onMoverPaciente(leito)}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Mover Paciente</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {temObservacoes && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-600"
                      onClick={() => actions.onAbrirObs(leito)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Ver Observações</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  }

  if (leito.statusLeito === 'Higienizacao') {
    return (
      <Card className={cn(
        "border hover:shadow-md transition-shadow",
        leito.higienizacaoPrioritaria 
          ? "border-yellow-400 bg-yellow-50 shadow-md border-2" 
          : "border-orange-200 bg-orange-50"
      )}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-orange-800">Leito {leito.codigoLeito}</h3>
              {leito.higienizacaoPrioritaria && (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <StatusBadge status="Higienizacao" />
          </div>
        </CardHeader>
        <CardContent className="text-center py-4">
          <Sparkles className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <p className="text-sm text-orange-700 font-medium">
            {leito.higienizacaoPrioritaria ? 'Higienização PRIORITÁRIA' : 'Aguardando Higienização'}
          </p>
          {ultimoStatus?.dataAtualizacaoStatus && (
            <DurationDisplay dataAtualizacaoStatus={ultimoStatus.dataAtualizacaoStatus} />
          )}
        </CardContent>
        <CardFooter className="pt-2 justify-center">
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => actions.onFinalizarHigienizacao(leito.id)}
                  >
                    <CheckCircle className="h-4 w-4" />
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
                    size="icon"
                    className={cn("h-8 w-8", leito.higienizacaoPrioritaria && 'text-yellow-500')}
                    onClick={() => actions.onPriorizarHigienizacao(leito)}
                  >
                    <Star className={cn("h-4 w-4", leito.higienizacaoPrioritaria && 'fill-yellow-500')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Priorizar Higienização</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardFooter>
      </Card>
    );
  }

  if (leito.statusLeito === 'Bloqueado') {
    return (
      <Card className="border border-red-200 bg-red-50 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-red-800">Leito {leito.codigoLeito}</h3>
            <StatusBadge status="Bloqueado" />
          </div>
        </CardHeader>
        <CardContent className="text-center py-4">
          <Lock className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p className="text-sm text-red-700 font-medium">Bloqueado</p>
          {ultimoStatus?.motivoBloqueio && (
            <p className="text-xs text-red-600 mt-1">{ultimoStatus.motivoBloqueio}</p>
          )}
          {ultimoStatus?.dataAtualizacaoStatus && (
            <DurationDisplay dataAtualizacaoStatus={ultimoStatus.dataAtualizacaoStatus} />
          )}
        </CardContent>
        <CardFooter className="pt-2 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => actions.onAtualizarStatus(leito.id, 'Vago')}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Desbloquear Leito</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>
    );
  }

  if (leito.statusLeito === 'Reservado') {
    return (
      <Card className="border border-purple-200 bg-purple-50 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-purple-800">Leito {leito.codigoLeito}</h3>
            <StatusBadge status="Reservado" />
          </div>
        </CardHeader>
        <CardContent className="text-center py-4">
          <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-purple-700 font-medium">Reservado</p>
          {leito.regulacao?.origemExterna && (
            <p className="text-xs text-purple-600 mt-1">Origem: {leito.regulacao.origemExterna}</p>
          )}
          {ultimoStatus?.dataAtualizacaoStatus && (
            <DurationDisplay dataAtualizacaoStatus={ultimoStatus.dataAtualizacaoStatus} />
          )}
        </CardContent>
        <CardFooter className="pt-2 justify-center">
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => actions.onConcluirTransferencia(leito)}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Concluir Transferência</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => actions.onCancelarReserva(leito.id)}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Cancelar Reserva</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardFooter>
      </Card>
    );
  }

  // Fallback para status não reconhecidos
  return (
    <Card className="border border-gray-200 bg-gray-50">
      <CardHeader>
        <h3 className="font-semibold">Leito {leito.codigoLeito}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">Status: {leito.statusLeito}</p>
      </CardContent>
    </Card>
  );
};

export default LeitoCard;
