// src/components/LeitoCard.tsx

import { useState, useMemo } from 'react';
import { Star, ShieldAlert, Lock, Paintbrush, Info, BedDouble, AlertTriangle, ArrowRightLeft, Unlock, User, Stethoscope, Ambulance, XCircle, CheckCircle, Move, LogOut, Bell, MessageSquarePlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import StatusBadge from './StatusBadge';
import DurationDisplay from './DurationDisplay';
import MotivoBloqueioModal from './modals/MotivoBloqueioModal';
import { RemanejamentoModal } from './modals/RemanejamentoModal';
import { TransferenciaModal } from './modals/TransferenciaModal';
import { cn } from '@/lib/utils';
import { LeitoStatusIsolamento } from './LeitoStatusIsolamento';
import { Leito, Paciente } from '@/types/hospital';

// Tipo para os dados enriquecidos que o card espera receber
type LeitoEnriquecido = Leito & {
  statusLeito: string;
  dataAtualizacaoStatus: string;
  motivoBloqueio?: string;
  regulacao?: any;
  dadosPaciente?: Paciente | null;
};

interface LeitoCardProps {
  leito: LeitoEnriquecido;
  todosLeitosDoSetor: LeitoEnriquecido[];
  onMoverPaciente: (leito: LeitoEnriquecido) => void;
  onAbrirObs: (leito: LeitoEnriquecido) => void;
  onLiberarLeito: (leitoId: string, pacienteId: string) => void;
  onAtualizarStatus: (leitoId: string, novoStatus: any, motivo?: string) => void;
  onSolicitarUTI: (pacienteId: string) => void;
  onSolicitarRemanejamento: (pacienteId: string, motivo: string) => void;
  onTransferirPaciente: (pacienteId: string, destino: string, motivo: string) => void;
  onCancelarReserva: (leitoId: string) => void;
  onConcluirTransferencia: (leito: LeitoEnriquecido) => void;
  onToggleProvavelAlta: (pacienteId: string, valorAtual: boolean) => void;
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
  todosLeitosDoSetor, 
  onMoverPaciente, 
  onAbrirObs,
  onLiberarLeito,
  onAtualizarStatus,
  onSolicitarUTI,
  onSolicitarRemanejamento,
  onTransferirPaciente,
  onCancelarReserva,
  onConcluirTransferencia,
  onToggleProvavelAlta
}: LeitoCardProps) => {
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
    if (companheiros.length > 0 && companheiros[0].dadosPaciente) {
        const isolamentos = companheiros[0].dadosPaciente.isolamentosVigentes;
        if (isolamentos && isolamentos.length > 0) {
            return { isolamentos: isolamentos.map(i => i.sigla), sexo: companheiros[0].dadosPaciente.sexoPaciente };
        }
    }
    return null;
  }, [leito, todosLeitosDoSetor]);

  return (
    <>
      <Card className={cn("flex flex-col min-w-[260px] h-[220px] p-3 shadow-card hover:shadow-medical transition-all duration-200 border", paciente?.sexoPaciente === 'Feminino' && 'border-2 border-pink-500', paciente?.sexoPaciente === 'Masculino' && 'border-2 border-blue-500')}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-sm text-foreground">{leito.codigoLeito}</h4>
            {leito.leitoPCP && (<div className="p-1 bg-medical-warning/10 rounded-full"><Star className="h-3 w-3 text-medical-warning" fill="currentColor" /></div>)}
            {paciente?.isolamentosVigentes && paciente.isolamentosVigentes.length > 0 && (<div className="p-1 bg-medical-danger/10 rounded-full"><ShieldAlert className="h-3 w-3 text-medical-danger" /></div>)}
          </div>
          <StatusBadge status={leito.statusLeito as any} />
        </div>
        <div className="flex-grow flex flex-col justify-center py-2">
            {/* O conteúdo do card permanece o mesmo */}
        </div>
        <div className="mt-auto pt-2 border-t border-border/30 space-y-2">
          <div className="text-center"><DurationDisplay dataAtualizacaoStatus={leito.dataAtualizacaoStatus} /></div>
          <div className="h-10 flex items-center justify-center">
            {leito.statusLeito === 'Ocupado' && paciente && (
              <div className="flex justify-center flex-wrap gap-1">
                <AlertDialog>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><BedDouble /></Button></AlertDialogTrigger></TooltipTrigger>
                            <TooltipContent><p>Liberar Leito</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Liberar Leito</AlertDialogTitle><AlertDialogDescription>Confirmar a liberação do leito {leito.codigoLeito}? O paciente terá alta e o leito será enviado para higienização.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onLiberarLeito(leito.id, paciente.id)}>Liberar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                {/* Outros botões... */}
              </div>
            )}
            {/* Outros status... */}
          </div>
        </div>
      </Card>
      
      {/* Modais */}
      <MotivoBloqueioModal open={motivoBloqueioModalOpen} onOpenChange={setMotivoBloqueioModalOpen} onConfirm={(motivo) => onAtualizarStatus(leito.id, 'Bloqueado', motivo)} leitoCodigoLeito={leito.codigoLeito} />
      <RemanejamentoModal open={remanejamentoModalOpen} onOpenChange={setRemanejamentoModalOpen} onConfirm={(motivo) => onSolicitarRemanejamento(paciente!.id, motivo)} />
      <TransferenciaModal open={transferenciaModalOpen} onOpenChange={setTransferenciaModalOpen} onConfirm={(destino, motivo) => onTransferirPaciente(paciente!.id, destino, motivo)} />
    </>
  );
};

export default LeitoCard;