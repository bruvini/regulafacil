import { useState, useMemo } from 'react';
import { Star, ShieldAlert, Lock, Paintbrush, Info, BedDouble, AlertTriangle, ArrowRightLeft, Unlock, User, Stethoscope, Ambulance, XCircle, CheckCircle, Move } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Leito, DadosPaciente } from '@/types/hospital';
import StatusBadge from './StatusBadge';
import DurationDisplay from './DurationDisplay';
import MotivoBloqueioModal from './modals/MotivoBloqueioModal';
import { RemanejamentoModal } from './modals/RemanejamentoModal';
import { TransferenciaModal } from './modals/TransferenciaModal';
import { useSetores } from '@/hooks/useSetores';
import { useIsolamentos } from '@/hooks/useIsolamentos';
import { cn } from '@/lib/utils';
import { LeitoStatusIsolamento } from './LeitoStatusIsolamento';

interface LeitoCardProps {
  leito: Leito;
  setorId: string;
  todosLeitosDoSetor: Leito[];
  onMoverPaciente: (leito: Leito) => void;
}

const calcularIdade = (dataNascimento: string): string => {
  if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return '?';
  const [dia, mes, ano] = dataNascimento.split('/').map(Number);
  const hoje = new Date();
  const nascimento = new Date(ano, mes - 1, dia);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade.toString();
};

const LeitoCard = ({ leito, setorId, todosLeitosDoSetor, onMoverPaciente }: LeitoCardProps) => {
  const { atualizarStatusLeito, desbloquearLeito, finalizarHigienizacao, liberarLeito, solicitarUTI, solicitarRemanejamento, transferirPaciente, cancelarReserva, concluirTransferencia } = useSetores();
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
    const companheiros = todosLeitosDoSetor.filter(l => getQuartoId(l.codigoLeito) === quartoId && l.statusLeito === 'Ocupado');
    if (companheiros.length > 0) {
        const isolamentosCompanheiros = companheiros[0].dadosPaciente?.isolamentosVigentes;
        if (isolamentosCompanheiros && isolamentosCompanheiros.length > 0) {
            return { isolamentos: isolamentosCompanheiros.map(i => i.sigla), sexo: companheiros[0].dadosPaciente?.sexoPaciente };
        }
    }
    return null;
  }, [leito, todosLeitosDoSetor]);

  const handleBloquear = (motivo: string) => atualizarStatusLeito(setorId, leito.id, 'Bloqueado', motivo);
  const handleHigienizar = () => atualizarStatusLeito(setorId, leito.id, 'Higienizacao');
  const handleDesbloquear = () => desbloquearLeito(setorId, leito.id);
  const handleFinalizarHigienizacao = () => finalizarHigienizacao(setorId, leito.id);
  const handleLiberarLeito = () => liberarLeito(setorId, leito.id);
  const handleSolicitarUTI = () => solicitarUTI(setorId, leito.id);
  const handleConfirmarRemanejamento = (motivo: string) => solicitarRemanejamento(setorId, leito.id, motivo);
  const handleConfirmarTransferencia = (destino: string, motivo: string) => transferirPaciente(setorId, leito.id, destino, motivo);
  const handleCancelarReserva = () => cancelarReserva(setorId, leito.id);
  const handleConfirmarTransferenciaInterna = () => concluirTransferencia(leito, setorId);

  return (
    <>
      <Card className={cn("p-3 shadow-card hover:shadow-medical transition-all duration-200 border flex flex-col h-full", paciente?.sexoPaciente === 'Feminino' && 'border-2 border-pink-500', paciente?.sexoPaciente === 'Masculino' && 'border-2 border-blue-500')}>
        <div className="flex flex-col h-full space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-sm text-foreground">{leito.codigoLeito}</h4>
              {leito.leitoPCP && (
                <Star className="h-3 w-3 text-yellow-500" fill="currentColor" />
              )}
              {paciente?.isolamentosVigentes && paciente.isolamentosVigentes.length > 0 && (
                <ShieldAlert className="h-3 w-3 text-orange-500" />
              )}
            </div>
            <StatusBadge status={leito.statusLeito} />
          </div>

          <div className="flex-grow space-y-2 py-2">
            {leito.statusLeito === 'Vago' && infoBloqueioIsolamento ? (
              <LeitoStatusIsolamento isolamentos={infoBloqueioIsolamento.isolamentos} sexo={infoBloqueioIsolamento.sexo} />
            ) : leito.statusLeito === 'Ocupado' && paciente ? (
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium text-foreground truncate">{paciente.nomePaciente}</p>
                <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{calcularIdade(paciente.dataNascimento)}a</span>
                  <span className="text-xs">•</span>
                  <span>{paciente.sexoPaciente?.charAt(0) || '?'}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{paciente.especialidadePaciente}</p>
                {paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
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
                <p className="text-sm font-medium text-purple-800">{leito.dadosPaciente?.nomePaciente}</p>
                <p className="text-sm text-purple-600">{leito.regulacao.paraSetor} - {leito.regulacao.paraLeito}</p>
              </div>
            ) : leito.statusLeito === 'Reservado' && leito.dadosPaciente ? (
              <div className="text-center p-2 bg-teal-50 border border-teal-200 rounded-md">
                <Info className="mx-auto h-4 w-4 text-teal-600 mb-1" />
                <p className="text-xs font-bold text-teal-700">RESERVADO PARA:</p>
                <p className="text-sm font-medium text-teal-800">{leito.dadosPaciente.nomePaciente}</p>
                {leito.dadosPaciente.origem && <p className="text-xs text-teal-600">Vindo de: {leito.dadosPaciente.origem.deSetor} - {leito.dadosPaciente.origem.deLeito}</p>}
              </div>
            ) : (
              <div className="h-full w-full"></div>
            )}
          </div>

          <div className="mt-auto space-y-2">
            <div className="pt-2 border-t border-border/30">
              <DurationDisplay dataAtualizacaoStatus={leito.dataAtualizacaoStatus} />
            </div>

            {/* BOTÕES DE AÇÃO - Restaurados e Corrigidos */}
            {leito.statusLeito === 'Vago' && (
              <div className="flex justify-center space-x-1">
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
              <div className="flex justify-center space-x-1">
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
                      <AlertDialogDescription>Confirmar a chegada do paciente {leito.dadosPaciente?.nomePaciente} ao leito {leito.codigoLeito}?</AlertDialogDescription>
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
                      <AlertDialogDescription>Deseja cancelar a reserva do leito {leito.codigoLeito} para {leito.dadosPaciente?.nomePaciente}?</AlertDialogDescription>
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
              <div className="flex justify-center space-x-1">
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
                      <AlertDialogDescription>Confirmar a solicitação de vaga de UTI para o paciente {paciente?.nomePaciente}?</AlertDialogDescription>
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