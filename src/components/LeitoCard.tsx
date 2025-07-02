
import { useState } from 'react';
import { Star, ShieldAlert, Lock, Paintbrush, Unlock, Check, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Leito } from '@/types/hospital';
import StatusBadge from './StatusBadge';
import DurationDisplay from './DurationDisplay';
import MotivoBloqueioModal from './modals/MotivoBloqueioModal';
import { useSetores } from '@/hooks/useSetores';

interface LeitoCardProps {
  leito: Leito;
  setorId: string;
}

const LeitoCard = ({ leito, setorId }: LeitoCardProps) => {
  const { atualizarStatusLeito, desbloquearLeito, finalizarHigienizacao } = useSetores();
  const [motivoBloqueioModalOpen, setMotivoBloqueioModalOpen] = useState(false);

  // Derivar o status atual do histórico
  const statusAtual = leito.historicoStatus[leito.historicoStatus.length - 1]?.status || 'Vago';

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
      console.error('Função desbloquearLeito não está disponível');
    }
  };

  const handleFinalizarHigienizacao = () => {
    console.log('Finalizando higienização do leito:', { setorId, leitoId: leito.id });
    if (finalizarHigienizacao) {
      finalizarHigienizacao(setorId, leito.id);
    } else {
      console.error('Função finalizarHigienizacao não está disponível');
    }
  };

  return (
    <>
      <Card className="p-3 shadow-card hover:shadow-medical transition-all duration-200 border border-border/50 flex flex-col h-full">
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
            <StatusBadge historicoStatus={leito.historicoStatus} />
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

          <div className="flex-grow">
            {statusAtual === 'Bloqueado' && leito.motivoBloqueio && (
              <div className="flex items-start space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-800">
                  <p className="font-medium">Motivo do bloqueio:</p>
                  <p>{leito.motivoBloqueio}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto space-y-2">
            <div className="pt-2 border-t border-border/30">
              <DurationDisplay dataAtualizacaoStatus={leito.dataAtualizacaoStatus} />
            </div>

            {statusAtual === 'Vago' && (
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

            {statusAtual === 'Bloqueado' && (
              <div className="flex justify-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Unlock className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Desbloquear Leito</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </AlertDialogTrigger>
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

            {statusAtual === 'Higienizacao' && (
              <div className="flex justify-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Check className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Finalizar Higienização</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </AlertDialogTrigger>
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
          </div>
        </div>
      </Card>

      <MotivoBloqueioModal
        open={motivoBloqueioModalOpen}
        onOpenChange={setMotivoBloqueioModalOpen}
        onConfirm={handleBloquear}
        leitoCodigoLeito={leito.codigoLeito}
      />
    </>
  );
};

export default LeitoCard;
