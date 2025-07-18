
import { useState, useMemo } from 'react';
import { Star, ShieldAlert, Lock, Paintbrush, Info, BedDouble, AlertTriangle, ArrowRightLeft, Unlock, User, Stethoscope, Ambulance, XCircle, CheckCircle, Move, LogOut, Bell, ArrowRightLeft as RemanejarIcon, Ambulance as TransferenciaIcon, AlertTriangle as UtiIcon, MessageSquarePlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LeitoExtendido } from '@/hooks/useSetores';
import StatusBadge from './StatusBadge';
import DurationDisplay from './DurationDisplay';
import MotivoBloqueioModal from './modals/MotivoBloqueioModal';
import { RemanejamentoModal } from './modals/RemanejamentoModal';
import { TransferenciaModal } from './modals/TransferenciaModal';
import { useIsolamentos } from '@/hooks/useIsolamentos';
import { cn } from '@/lib/utils';
import { LeitoStatusIsolamento } from './LeitoStatusIsolamento';

interface LeitoCardProps {
  leito: LeitoExtendido;
  setorId: string;
  todosLeitosDoSetor: LeitoExtendido[];
  onMoverPaciente: (leito: LeitoExtendido) => void;
  onAbrirObs: (leito: LeitoExtendido) => void;
  // Funções de ação passadas via props
  onAtualizarStatus: (setorId: string, leitoId: string, novoStatus: any, motivo?: string) => Promise<void>;
  onDesbloquear: (setorId: string, leitoId: string) => Promise<void>;
  onFinalizarHigienizacao: (leitoId: string) => void;
  onLiberarLeito: (setorId: string, leitoId: string) => Promise<void>;
  onSolicitarUTI: (setorId: string, leitoId: string) => Promise<void>;
  onSolicitarRemanejamento: (setorId: string, leitoId: string, motivo: string) => Promise<void>;
  onTransferirPaciente: (setorId: string, leitoId: string, destino: string, motivo: string) => Promise<void>;
  onCancelarReserva: (setorId: string, leitoId: string) => Promise<void>;
  onConcluirTransferencia: (leito: LeitoExtendido, setorId: string) => Promise<void>;
  onToggleProvavelAlta: (setorId: string, leitoId: string) => Promise<void>;
}

const calcularIdade = (dataNascimento: string): string => {
  if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return '?';
  const [dia, mes, ano] = dataNascimento.split('/').map(Number);
  const hoje = new Date();
  const nascimento = new Date(ano, mes - 1, dia);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade.toString();
};

const LeitoCard = ({ 
  leito, 
  setorId, 
  todosLeitosDoSetor, 
  onMoverPaciente, 
  onAbrirObs,
  onAtualizarStatus,
  onDesbloquear,
  onFinalizarHigienizacao,
  onLiberarLeito,
  onSolicitarUTI,
  onSolicitarRemanejamento,
  onTransferirPaciente,
  onCancelarReserva,
  onConcluirTransferencia,
  onToggleProvavelAlta
}: LeitoCardProps) => {
  const { isolamentos: tiposDeIsolamento } = useIsolamentos();
  const [motivoBloqueioModalOpen, setMotivoBloqueioModalOpen] = useState(false);
  const [remanejamentoModalOpen, setRemanejamentoModalOpen] = useState(false);
  const [transferenciaModalOpen, setTransferenciaModalOpen] = useState(false);

  const paciente = leito.dadosPaciente;

  const infoBloqueioIsolamento = useMemo(() => {
    if (leito.statusLeito !== 'Vago') return null;
    const getQuartoId = (codigoLeito: string): string => {
        const match = codigoLeito.match(/^(\d+[\s-]?\w*|\w+[\s-]?\d+)\s/);
        return match ? match[1].trim() : codigoLeito;
    };
    const quartoId = getQuartoId(leito.codigoLeito);
    if (!quartoId) return null;
    const companheiros = todosLeitosDoSetor.filter(l => getQuartoId(l.codigoLeito) === quartoId && l.statusLeito === 'Ocupado');
    if (companheiros.length > 0) {
        const isolamentosCompanheiros = companheiros[0].dadosPaciente?.isolamentosVigentes;
        if (isolamentosCompanheiros && isolamentosCompanheiros.length > 0) {
            return { isolamentos: isolamentosCompanheiros.map(i => i.sigla), sexo: companheiros[0].dadosPaciente?.sexoPaciente };
        }
    }
    return null;
  }, [leito, todosLeitosDoSetor]);

  const handleBloquear = (motivo: string) => onAtualizarStatus(setorId, leito.id, 'Bloqueado', motivo);
  const handleHigienizar = () => onAtualizarStatus(setorId, leito.id, 'Higienizacao');
  const handleDesbloquear = () => onDesbloquear(setorId, leito.id);
  const handleFinalizarHigienizacao = () => onFinalizarHigienizacao(leito.id);
  const handleLiberarLeito = () => onLiberarLeito(setorId, leito.id);
  const handleSolicitarUTI = () => onSolicitarUTI(setorId, leito.id);
  const handleConfirmarRemanejamento = (motivo: string) => onSolicitarRemanejamento(setorId, leito.id, motivo);
  const handleConfirmarTransferencia = (destino: string, motivo: string) => onTransferirPaciente(setorId, leito.id, destino, motivo);
  const handleCancelarReserva = () => onCancelarReserva(setorId, leito.id);
  const handleConfirmarTransferenciaInterna = () => onConcluirTransferencia(leito, setorId);
  const handleToggleProvavelAlta = () => onToggleProvavelAlta(setorId, leito.id);

  return (
    <>
      {/* A ESTRUTURA PRINCIPAL DO CARD */}
      <Card className={cn(
        "flex flex-col min-w-[260px] h-[220px] p-3 shadow-card hover:shadow-medical transition-all duration-200 border",
        paciente?.sexoPaciente === 'Feminino' && 'border-2 border-pink-500',
        paciente?.sexoPaciente === 'Masculino' && 'border-2 border-blue-500'
      )}>
        {/* Header do Card */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-sm text-foreground">{leito.codigoLeito}</h4>
            {leito.leitoPCP && (<div className="p-1 bg-medical-warning/10 rounded-full"><Star className="h-3 w-3 text-medical-warning" fill="currentColor" /></div>)}
            {paciente?.isolamentosVigentes && paciente.isolamentosVigentes.length > 0 && (<div className="p-1 bg-medical-danger/10 rounded-full"><ShieldAlert className="h-3 w-3 text-medical-danger" /></div>)}
          </div>
          <StatusBadge status={leito.statusLeito} />
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-grow flex flex-col justify-center py-2">
            {leito.statusLeito === 'Vago' && infoBloqueioIsolamento ? (
              <LeitoStatusIsolamento isolamentos={infoBloqueioIsolamento.isolamentos} sexo={infoBloqueioIsolamento.sexo} />
            ) : leito.statusLeito === 'Ocupado' && paciente ? (
              <div className="text-left space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="font-medium text-sm leading-tight truncate">{paciente.nomeCompleto}</p>
                  </div>
                  {/* ÍCONES DE STATUS DO PACIENTE */}
                  <div className="flex items-center space-x-1">
                    {paciente.provavelAlta && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Bell className="h-4 w-4 text-green-500" />
                          </TooltipTrigger>
                          <TooltipContent><p>Provável Alta</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {paciente.aguardaUTI && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <UtiIcon className="h-4 w-4 text-red-500" />
                          </TooltipTrigger>
                          <TooltipContent><p>Aguardando UTI</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {paciente.remanejarPaciente && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <RemanejarIcon className="h-4 w-4 text-yellow-500" />
                          </TooltipTrigger>
                          <TooltipContent><p>Remanejamento Solicitado</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {paciente.transferirPaciente && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <TransferenciaIcon className="h-4 w-4 text-blue-500" />
                          </TooltipTrigger>
                          <TooltipContent><p>Transferência Externa</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-6">{calcularIdade(paciente.dataNascimento)} anos • {paciente.sexoPaciente?.charAt(0) || '?'}</p>
                <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-muted-foreground flex-shrink-0" /><p className="text-xs text-muted-foreground truncate">{paciente.especialidadePaciente}</p></div>
                {paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {paciente.isolamentosVigentes.map((iso, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs px-1 py-0 bg-orange-50 border-orange-200 text-orange-800">
                        {iso.sigla}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : leito.statusLeito === 'Bloqueado' && leito.motivoBloqueio ? (
              <div className="text-center p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <Lock className="mx-auto h-4 w-4 text-yellow-600 mb-1" />
                <p className="text-xs font-bold text-yellow-700">BLOQUEADO</p>
                <p className="text-xs text-yellow-600">{leito.motivoBloqueio}</p>
              </div>
            ) : leito.statusLeito === 'Higienizacao' ? (
              <div className="text-center p-2 bg-blue-50 border border-blue-200 rounded-md">
                <Paintbrush className="mx-auto h-4 w-4 text-blue-600 mb-1" />
                <p className="text-xs font-bold text-blue-700">HIGIENIZAÇÃO</p>
                <p className="text-xs text-blue-600">Em limpeza</p>
              </div>
            ) : leito.statusLeito === 'Regulado' && leito.regulacao ? (
              <div className="text-center p-2 bg-purple-50 border border-purple-200 rounded-md">
                <Info className="mx-auto h-4 w-4 text-purple-600 mb-1" />
                <p className="text-xs font-bold text-purple-700">REGULADO PARA:</p>
                <p className="text-sm font-medium text-purple-800">{leito.dadosPaciente?.nomeCompleto}</p>
                <p className="text-sm text-purple-600">{leito.regulacao.paraSetor} - {leito.regulacao.paraLeito}</p>
              </div>
            ) : leito.statusLeito === 'Reservado' && leito.dadosPaciente ? (
              <div className="text-center p-2 bg-teal-50 border border-teal-200 rounded-md">
                <Info className="mx-auto h-4 w-4 text-teal-600 mb-1" />
                <p className="text-xs font-bold text-teal-700">RESERVADO PARA:</p>
                <p className="text-sm font-medium text-teal-800">{leito.dadosPaciente.nomeCompleto}</p>
                {leito.dadosPaciente.origem && <p className="text-xs text-teal-600">Vindo de: {leito.dadosPaciente.origem.deSetor} - {leito.dadosPaciente.origem.deLeito}</p>}
              </div>
            ) : (
              <div className="h-full w-full"></div>
            )}
        </div>

        {/* Footer do Card */}
        <div className="mt-auto pt-2 border-t border-border/30 space-y-2">
          <div className="text-center"><DurationDisplay dataAtualizacaoStatus={leito.dataAtualizacaoStatus} /></div>
          <div className="h-10 flex items-center justify-center">
            {leito.statusLeito === 'Vago' && (
              <div className="flex justify-center flex-wrap gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMotivoBloqueioModalOpen(true)}>
                        <Lock className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Bloquear Leito</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleHigienizar}>
                        <Paintbrush className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Enviar para Higienização</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            
            {leito.statusLeito === 'Bloqueado' && (
              <div className="flex justify-center">
                <AlertDialog>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Unlock className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent><p>Desbloquear Leito</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Desbloquear Leito</AlertDialogTitle>
                      <AlertDialogDescription>Deseja realmente desbloquear o leito {leito.codigoLeito}?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDesbloquear}>Desbloquear</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            
            {leito.statusLeito === 'Higienizacao' && (
              <div className="flex justify-center">
                <AlertDialog>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent><p>Finalizar Higienização</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Finalizar Higienização</AlertDialogTitle>
                      <AlertDialogDescription>Confirmar a finalização da higienização do leito {leito.codigoLeito}?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleFinalizarHigienizacao}>Finalizar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            
            {leito.statusLeito === 'Reservado' && (
              <div className="flex justify-center flex-wrap gap-1">
                <AlertDialog>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent><p>Confirmar Transferência</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Transferência</AlertDialogTitle>
                      <AlertDialogDescription>Confirmar a chegada do paciente {leito.dadosPaciente?.nomeCompleto} ao leito {leito.codigoLeito}?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleConfirmarTransferenciaInterna}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <AlertDialog>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent><p>Cancelar Reserva</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar Reserva</AlertDialogTitle>
                      <AlertDialogDescription>Deseja cancelar a reserva do leito {leito.codigoLeito} para {leito.dadosPaciente?.nomeCompleto}?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Não</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelarReserva}>Cancelar Reserva</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            
            {leito.statusLeito === 'Ocupado' && (
              <div className="flex justify-center flex-wrap gap-1">
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
                      <AlertDialogDescription>Confirmar a liberação do leito {leito.codigoLeito}? O leito será enviado para higienização.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLiberarLeito}>Liberar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

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

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAbrirObs(leito)}>
                        <MessageSquarePlus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Observações</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

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
                      <AlertDialogDescription>Confirmar a solicitação de vaga de UTI para o paciente {paciente?.nomeCompleto}?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSolicitarUTI}>Solicitar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRemanejamentoModalOpen(true)}>
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Solicitar Remanejamento</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTransferenciaModalOpen(true)}>
                        <Ambulance className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Transferência Externa</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleProvavelAlta}>
                        <LogOut className={`h-4 w-4 ${paciente?.provavelAlta ? 'text-green-500' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Sinalizar Provável Alta</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      </Card>

      <MotivoBloqueioModal
        open={motivoBloqueioModalOpen}
        onOpenChange={setMotivoBloqueioModalOpen}
        onConfirm={handleBloquear}
        leitoCodigoLeito={leito.codigoLeito}
      />

      <RemanejamentoModal
        open={remanejamentoModalOpen}
        onOpenChange={setRemanejamentoModalOpen}
        onConfirm={handleConfirmarRemanejamento}
      />

      <TransferenciaModal
        open={transferenciaModalOpen}
        onOpenChange={setTransferenciaModalOpen}
        onConfirm={handleConfirmarTransferencia}
      />
    </>
  );
};

export default LeitoCard;
