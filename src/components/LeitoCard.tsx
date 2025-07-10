
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  User, Calendar, Stethoscope, Clock, Settings, Bed, 
  ShieldBan, Shield, Trash2, RotateCcw, Lightbulb, 
  UserMinus, Move, BedDouble, AlertTriangle, ArrowRightLeft, Ambulance
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Leito } from '@/types/hospital';
import { LeitoStatusIsolamento } from './LeitoStatusIsolamento';
import { useSetores } from '@/hooks/useSetores';
import { RemanejamentoModal } from '@/components/modals/RemanejamentoModal';
import { TransferenciaModal } from '@/components/modals/TransferenciaModal';

interface LeitoCardProps {
  leito: Leito;
  setorId: string;
  todosLeitosDoSetor: Leito[];
  onMoverPaciente?: (leito: Leito) => void;
}

const LeitoCard = ({ leito, setorId, todosLeitosDoSetor, onMoverPaciente }: LeitoCardProps) => {
  const { atualizarStatusLeito, desbloquearLeito, finalizarHigienizacao, liberarLeito, solicitarUTI, solicitarRemanejamento, transferirPaciente, cancelarReserva, adicionarIsolamentoPaciente, finalizarIsolamentoPaciente } = useSetores();
  const [showActions, setShowActions] = useState(false);
  const [motivoBloqueio, setMotivoBloqueio] = useState('');
  const [motivoRemanejamento, setMotivoRemanejamento] = useState('');
  const [destinoTransferencia, setDestinoTransferencia] = useState('');
  const [motivoTransferencia, setMotivoTransferencia] = useState('');
  const [remanejamentoModalOpen, setRemanejamentoModalOpen] = useState(false);
  const [transferenciaModalOpen, setTransferenciaModalOpen] = useState(false);

  const paciente = leito.dadosPaciente;

  const handleBloquearLeito = () => {
    atualizarStatusLeito(setorId, leito.id, 'Bloqueado', motivoBloqueio);
    setShowActions(false);
  };

  const handleDesbloquearLeito = () => {
    desbloquearLeito(setorId, leito.id);
    setShowActions(false);
  };

  const handleFinalizarHigienizacao = () => {
    finalizarHigienizacao(setorId, leito.id);
    setShowActions(false);
  };

  const handleLiberarLeito = () => {
    liberarLeito(setorId, leito.id);
    setShowActions(false);
  };

  const handleSolicitarUTI = () => {
    solicitarUTI(setorId, leito.id);
    setShowActions(false);
  };

  const handleSolicitarRemanejamento = (motivo: string) => {
    solicitarRemanejamento(setorId, leito.id, motivo);
    setShowActions(false);
  };

  const handleTransferirPaciente = (destino: string, motivo: string) => {
    transferirPaciente(setorId, leito.id, destino, motivo);
    setShowActions(false);
  };

  const handleCancelarReserva = () => {
    cancelarReserva(setorId, leito.id);
    setShowActions(false);
  };

  const handleAdicionarIsolamento = (isolamentos: any[]) => {
    adicionarIsolamentoPaciente(setorId, leito.id, isolamentos);
    setShowActions(false);
  };

  const handleFinalizarIsolamento = (isolamentoId: string) => {
    finalizarIsolamentoPaciente(setorId, leito.id, isolamentoId);
    setShowActions(false);
  };

  const getQuartoId = (codigoLeito: string) => {
    const match = codigoLeito.match(/^(\d+[\s-]?\w*|\w+[\s-]?\d+)\s/);
    return match ? match[1].trim() : codigoLeito;
  };

  const infoBloqueioIsolamento = useMemo(() => {
    if (leito.statusLeito !== 'Vago') return null;

    const quartoId = getQuartoId(leito.codigoLeito);
    const companheiros = todosLeitosDoSetor.filter(l => 
      getQuartoId(l.codigoLeito) === quartoId && l.statusLeito === 'Ocupado'
    );

    if (companheiros.length > 0) {
      const isolamentosCompanheiros = companheiros[0].dadosPaciente?.isolamentosVigentes;
      if (isolamentosCompanheiros && isolamentosCompanheiros.length > 0) {
        return {
          isolamentos: isolamentosCompanheiros.map(i => i.sigla),
          sexo: companheiros[0].dadosPaciente?.sexoPaciente
        };
      }
    }
    return null;
  }, [leito, todosLeitosDoSetor]);

  const cardClasses = useMemo(() => {
    let classes = 'border shadow-md';

    switch (leito.statusLeito) {
      case 'Ocupado':
        classes += ' border-red-500';
        break;
      case 'Bloqueado':
        classes += ' border-yellow-500';
        break;
      case 'Higienizacao':
        classes += ' border-blue-500';
        break;
      case 'Reservado':
        classes += ' border-green-500';
        break;
      case 'Regulado':
        classes += ' border-purple-500';
        break;
      default:
        classes += ' border-gray-200';
        break;
    }

    return classes;
  }, [leito.statusLeito]);

  const iconColor = useMemo(() => {
    switch (leito.statusLeito) {
      case 'Ocupado':
        return 'text-red-500';
      case 'Bloqueado':
        return 'text-yellow-500';
      case 'Higienizacao':
        return 'text-blue-500';
      case 'Reservado':
        return 'text-green-500';
      case 'Regulado':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  }, [leito.statusLeito]);

  return (
    <>
      <Card className={`h-48 transition-all duration-200 ${cardClasses}`}>
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Bed className={`h-4 w-4 ${iconColor}`} />
              <span className="font-bold text-sm">{leito.codigoLeito}</span>
              {leito.leitoPCP && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary">PCP</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Leito prioritário para paciente crônico</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <StatusBadge status={leito.statusLeito} />
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-grow space-y-2 py-2">
            {leito.statusLeito === 'Vago' && infoBloqueioIsolamento ? (
                <LeitoStatusIsolamento 
                    isolamentos={infoBloqueioIsolamento.isolamentos}
                    sexo={infoBloqueioIsolamento.sexo}
                />
            ) : leito.statusLeito === 'Ocupado' && paciente ? (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-semibold truncate">{paciente.nomePaciente}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(paciente.dataInternacao), {
                      locale: ptBR,
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Stethoscope className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{paciente.especialidadePaciente}</span>
                </div>
              </div>
            ) : leito.statusLeito === 'Bloqueado' ? (
              <div className="text-center text-sm text-yellow-600 italic">
                Leito bloqueado
                {leito.motivoBloqueio && (
                  <>
                    <br />
                    Motivo: {leito.motivoBloqueio}
                  </>
                )}
              </div>
            ) : leito.statusLeito === 'Higienizacao' ? (
              <div className="text-center text-sm text-blue-600 italic">
                Leito em higienização
                <br />
                <Clock className="mx-auto h-4 w-4" />
                {formatDistanceToNow(new Date(leito.dataAtualizacaoStatus), {
                  locale: ptBR,
                  addSuffix: true,
                })}
              </div>
            ) : leito.statusLeito === 'Reservado' ? (
              <div className="text-center text-sm text-green-600 italic">
                Leito reservado
                <br />
                Aguardando paciente
              </div>
            ) : leito.statusLeito === 'Regulado' ? (
              <div className="text-center text-sm text-purple-600 italic">
                Leito regulado
                <br />
                {leito.regulacao?.paraSetor} - {leito.regulacao?.paraLeito}
              </div>
            ) : (
              <div className="h-full w-full"></div>
            )}
          </div>

          {/* Ações */}
          <div className="flex justify-center space-x-1">
            {leito.statusLeito === 'Vago' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Definir Status</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {leito.statusLeito === 'Ocupado' && (
              <div className="flex justify-center space-x-1">

                {/* BOTÃO 1: LIBERAR LEITO */}
                <AlertDialog>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <BedDouble className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent><p>Liberar Leito</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Liberar Leito</AlertDialogTitle>
                      <AlertDialogDescription>
                        Confirmar a liberação do leito {leito.codigoLeito}?
                        O leito será enviado para higienização.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLiberarLeito}>
                        Liberar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* BOTÃO 2: MOVER PACIENTE */}
                {onMoverPaciente && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMoverPaciente(leito)}>
                          <Move className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Mover Paciente</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* BOTÃO 3: SOLICITAR UTI */}
                <AlertDialog>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent><p>Solicitar UTI</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Solicitar UTI</AlertDialogTitle>
                      <AlertDialogDescription>
                        Confirmar a solicitação de vaga de UTI para o paciente {paciente?.nomePaciente}?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSolicitarUTI}>
                        Solicitar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* BOTÃO 4: SOLICITAR REMANEJAMENTO */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setRemanejamentoModalOpen(true)}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Solicitar Remanejamento</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* BOTÃO 5: TRANSFERIR PACIENTE */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setTransferenciaModalOpen(true)}
                      >
                        <Ambulance className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Transferência Externa</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

              </div>
            )}

            {leito.statusLeito === 'Bloqueado' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Shield className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Desbloquear Leito</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {leito.statusLeito === 'Higienizacao' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Finalizar Higienização</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardContent>
      </Card>

      <RemanejamentoModal
        open={remanejamentoModalOpen}
        onOpenChange={setRemanejamentoModalOpen}
        onConfirm={handleSolicitarRemanejamento}
      />

      <TransferenciaModal
        open={transferenciaModalOpen}
        onOpenChange={setTransferenciaModalOpen}
        onConfirm={handleTransferirPaciente}
      />
    </>
  );
};

export default LeitoCard;
