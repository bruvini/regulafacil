import { useState } from 'react';
import { Star, ShieldAlert, Lock, Paintbrush, Info, BedDouble, AlertTriangle, ArrowRightLeft, Unlock, User, Stethoscope, Ambulance } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Leito } from '@/types/hospital';
import StatusBadge from './StatusBadge';
import DurationDisplay from './DurationDisplay';
import MotivoBloqueioModal from './modals/MotivoBloqueioModal';
import { RemanejamentoModal } from './modals/RemanejamentoModal';
import { TransferenciaModal } from './modals/TransferenciaModal';
import { useSetores } from '@/hooks/useSetores';
import { cn } from '@/lib/utils';

interface LeitoCardProps {
  leito: Leito;
  setorId: string;
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

const LeitoCard = ({ leito, setorId }: LeitoCardProps) => {
  const { atualizarStatusLeito, desbloquearLeito, finalizarHigienizacao, liberarLeito, solicitarUTI, solicitarRemanejamento, transferirPaciente } = useSetores();
  const [motivoBloqueioModalOpen, setMotivoBloqueioModalOpen] = useState(false);
  const [remanejamentoModalOpen, setRemanejamentoModalOpen] = useState(false);
  const [transferenciaModalOpen, setTransferenciaModalOpen] = useState(false);

  // A variável 'paciente' agora vem diretamente do leito
  const paciente = leito.dadosPaciente;

  const handleBloquear = (motivo: string) => {
    console.log('Tentando bloquear leito:', { setorId, leitoId: leito.id, motivo });
    atualizarStatusLeito(setorId, leito.id, 'Bloqueado', motivo);
  };

  const handleHigienizar = () => {
    console.log('Tentando higienizar leito:', { setorId, leitoId: leito.id });
    atualizarStatusLeito(setorId, leito.id, 'Higienizacao');
  };

  const handleDesbloquear = () => {
    console.log('Tentando desbloquear leito:', { setorId, leitoId: leito.id });
    if (desbloquearLeito) {
      desbloquearLeito(setorId, leito.id);
    } else {
      console.error('Função desbloquearLeito não está disponível no hook useSetores.');
    }
  };

  const handleFinalizarHigienizacao = () => {
    console.log('Finalizando higienização do leito:', { setorId, leitoId: leito.id });
    if (finalizarHigienizacao) {
      finalizarHigienizacao(setorId, leito.id);
    } else {
      console.error('Função finalizarHigienizacao não está disponível no hook useSetores.');
    }
  };

  const handleLiberarLeito = () => liberarLeito(setorId, leito.id);
  const handleSolicitarUTI = () => solicitarUTI(setorId, leito.id);
  const handleConfirmarRemanejamento = (motivo: string) => solicitarRemanejamento(setorId, leito.id, motivo);
  const handleConfirmarTransferencia = (destino: string, motivo: string) => transferirPaciente(setorId, leito.id, destino, motivo);

  return (
    <>
      <Card 
        className={cn(
          "p-3 shadow-card hover:shadow-medical transition-all duration-200 border flex flex-col h-full",
          paciente?.sexoPaciente === 'Feminino' && 'border-2 border-pink-500',
          paciente?.sexoPaciente === 'Masculino' && 'border-2 border-blue-500'
        )}
      >
        <div className="flex flex-col h-full space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-sm text-foreground">{leito.codigoLeito}</h4>
              <div className="flex space-x-1">
                {leito.leitoPCP && (
                  <div className="p-1 bg-medical-warning/10 rounded-full">
                    <Star className="h-3 w-3 text-medical-warning" fill="currentColor" />
                  </div>
                )}
                {leito.leitoIsolamento && (
                  <div className="p-1 bg-medical-danger/10 rounded-full">
                    <ShieldAlert className="h-3 w-3 text-medical-danger" />
                  </div>
                )}
              </div>
            </div>
            <StatusBadge status={leito.statusLeito} />
          </div>
          
          {(leito.leitoPCP || leito.leitoIsolamento) && (
            <div className="flex flex-wrap gap-1 text-xs">
              {leito.leitoPCP && (
                <span className="px-2 py-1 bg-medical-warning/10 text-medical-warning rounded-md">
                  PCP
                </span>
              )}
              {leito.leitoIsolamento && (
                <span className="px-2 py-1 bg-medical-danger/10 text-medical-danger rounded-md">
                  Isolamento
                </span>
              )}
            </div>
          )}

          <div className="flex-grow space-y-2 py-2">
            {leito.statusLeito === 'Ocupado' && paciente ? (
              <div className="text-left space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="font-medium text-sm leading-tight">{paciente.nomePaciente}</p>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  {calcularIdade(paciente.dataNascimento)} anos
                </p>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">{paciente.especialidadePaciente}</p>
                </div>
              </div>
            ) : leito.statusLeito === 'Bloqueado' && leito.motivoBloqueio ? (
              <div className="flex items-start space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-800">
                  <p className="font-medium">Motivo do bloqueio:</p>
                  <p>{leito.motivoBloqueio}</p>
                </div>
              </div>
            ) : leito.statusLeito === 'Regulado' && leito.dadosPaciente ? (
              <div className="text-center p-2 bg-purple-50 border border-purple-200 rounded-md">
                <p className="text-sm font-semibold text-purple-800">{leito.dadosPaciente.nomePaciente}</p>
                <p className="text-xs font-bold text-purple-700 mt-1">REGULADO PARA:</p>
                <p className="text-xs text-purple-600">{leito.regulacao?.paraSetor} - {leito.regulacao?.paraLeito}</p>
                {leito.regulacao?.observacoes && (
                  <p className="text-xs text-purple-500 mt-1">{leito.regulacao.observacoes}</p>
                )}
              </div>
            ) : leito.statusLeito === 'Reservado' && leito.dadosPaciente ? (
              <div className="text-center p-2 bg-teal-50 border border-teal-200 rounded-md">
                <p className="text-xs font-bold text-teal-700">RESERVADO PARA:</p>
                <p className="text-sm font-medium text-teal-800">{leito.dadosPaciente.nomePaciente}</p>
                {leito.dadosPaciente.origem && (
                  <p className="text-xs text-teal-600">Vindo de: {leito.dadosPaciente.origem.deSetor} - {leito.dadosPaciente.origem.deLeito}</p>
                )}
              </div>
            ) : (
              <div className="h-full w-full"></div>
            )}
          </div>

          <div className="mt-auto space-y-2">
            <div className="pt-2 border-t border-border/30">
              <DurationDisplay dataAtualizacaoStatus={leito.dataAtualizacaoStatus} />
            </div>

            {leito.statusLeito === 'Vago' && (
              <div className="flex justify-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setMotivoBloqueioModalOpen(true)}
                        className="h-8 w-8"
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bloquear Leito</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={handleHigienizar}
                        className="h-8 w-8"
                      >
                        <Paintbrush className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Higienizar Leito</p>
                    </TooltipContent>
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
                      <TooltipContent>
                        <p>Desbloquear Leito</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Desbloquear Leito</AlertDialogTitle>
                      <AlertDialogDescription>
                        Deseja realmente desbloquear o leito {leito.codigoLeito}?
                        Ele ficará disponível para ocupação.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDesbloquear}>
                        Desbloquear
                      </AlertDialogAction>
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
                            <Paintbrush className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Finalizar Higienização</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Finalizar Higienização</AlertDialogTitle>
                      <AlertDialogDescription>
                        Confirmar a finalização da higienização do leito {leito.codigoLeito}?
                        Ele ficará disponível para ocupação.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleFinalizarHigienizacao}>
                        Finalizar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {leito.statusLeito === 'Ocupado' && (
              <div className="flex justify-center space-x-2">
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
                      <TooltipContent>
                        <p>Liberar Leito</p>
                      </TooltipContent>
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
                      <TooltipContent>
                        <p>Solicitar UTI</p>
                      </TooltipContent>
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
                    <TooltipContent>
                      <p>Solicitar Remanejamento</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

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
                    <TooltipContent>
                      <p>Transferir Paciente</p>
                    </TooltipContent>
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
