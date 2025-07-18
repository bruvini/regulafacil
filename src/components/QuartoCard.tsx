// src/components/QuartoCard.tsx

import { useMemo } from 'react';
import LeitoCard from './LeitoCard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { AlertTriangle } from 'lucide-react';
import { Leito, Paciente } from '@/types/hospital';

// Tipo para os dados enriquecidos que o card espera receber
// Este tipo agora é idêntico ao que LeitoCard espera, resolvendo a incompatibilidade.
type LeitoEnriquecido = Leito & {
  statusLeito: 'Vago' | 'Ocupado' | 'Bloqueado' | 'Higienizacao' | 'Regulado' | 'Reservado';
  dataAtualizacaoStatus: string;
  motivoBloqueio?: string;
  regulacao?: any;
  dadosPaciente?: Paciente | null;
};

// A interface de props foi expandida para incluir todas as funções necessárias pelo LeitoCard
interface QuartoCardProps {
  nomeQuarto: string;
  leitos: LeitoEnriquecido[];
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
  onFinalizarHigienizacao: (leitoId: string) => void;
}

const QuartoCard = (props: QuartoCardProps) => {
  const { 
    nomeQuarto, 
    leitos, 
    todosLeitosDoSetor, 
    ...leitoCardActions // Agrupa todas as funções de ação para repassar
  } = props;

  const hasMixedGenders = useMemo(() => {
    const genders = new Set(
      leitos
        .filter(l => l.statusLeito === 'Ocupado' && l.dadosPaciente)
        .map(l => l.dadosPaciente?.sexoPaciente)
        .filter(Boolean)
    );
    return genders.size > 1;
  }, [leitos]);

  return (
    <Card className="bg-muted/30 border-2 border-dashed p-2">
      <CardHeader className="py-2 px-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-md font-semibold text-foreground">
            Quarto {nomeQuarto}
          </CardTitle>
          {hasMixedGenders && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Alerta: Pacientes de sexos diferentes neste quarto.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
          {leitos
            .sort((a, b) => a.codigoLeito.localeCompare(b.codigoLeito, undefined, { numeric: true, sensitivity: 'base' }))
            .map((leito) => (
              <LeitoCard
                key={leito.id}
                leito={leito}
                todosLeitosDoSetor={todosLeitosDoSetor}
                // Repassando todas as funções de ação para o LeitoCard
                {...leitoCardActions}
                onFinalizarHigienizacao={props.onFinalizarHigienizacao}
              />
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuartoCard;