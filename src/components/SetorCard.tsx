// src/components/SetorCard.tsx

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import LeitoCard from './LeitoCard';
import QuartoCard from './QuartoCard';
import { agruparLeitosPorQuarto } from '@/lib/leitoUtils';
import { Leito, Paciente, Setor } from '@/types/hospital';

// Type for the enriched data structure created in MapaLeitos.tsx
type LeitoEnriquecido = Leito & {
  statusLeito: string;
  dataAtualizacaoStatus: string;
  motivoBloqueio?: string;
  regulacao?: any;
  dadosPaciente?: Paciente | null;
};

// CORRECTION: The props interface now includes all actions for LeitoCard
interface SetorCardProps {
  setor: Setor & { leitos: LeitoEnriquecido[] };
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

const SetorCard = (props: SetorCardProps) => {
  const { setor, ...leitoCardActions } = props; // Group all actions to be passed down

  const leitosVagos = setor.leitos.filter(leito => leito.statusLeito === 'Vago').length;
  const totalLeitos = setor.leitos.length;
  const taxaOcupacao = totalLeitos > 0 ? Math.round(((totalLeitos - leitosVagos) / totalLeitos) * 100) : 0;

  const { quartos, leitosSoltos } = agruparLeitosPorQuarto(setor.leitos);
  const comparadorNatural = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

  return (
    <Card className="shadow-card hover:shadow-medical transition-all duration-200 border border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{setor.nomeSetor}</h3>
            <p className="text-sm text-muted-foreground font-mono">{setor.siglaSetor}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-medical-primary">
              {taxaOcupacao}%
            </div>
            <p className="text-xs text-muted-foreground">{leitosVagos}/{totalLeitos} Vagos</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {setor.leitos.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(quartos)
              .sort(([nomeQuartoA], [nomeQuartoB]) => comparadorNatural(nomeQuartoA, nomeQuartoB))
              .map(([nomeQuarto, leitosDoQuarto]) => (
                <QuartoCard
                  key={nomeQuarto}
                  nomeQuarto={nomeQuarto}
                  leitos={leitosDoQuarto}
                  setorId={setor.id!}
                  todosLeitosDoSetor={setor.leitos}
                  // CORRECTION: Pass all actions to QuartoCard
                  {...leitoCardActions}
                />
            ))}
            {leitosSoltos.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
                {leitosSoltos
                  .sort((a, b) => comparadorNatural(a.codigoLeito, b.codigoLeito))
                  .map((leito) => (
                    <LeitoCard
                      key={leito.id}
                      leito={leito}
                      todosLeitosDoSetor={setor.leitos}
                       // CORRECTION: Pass all actions to LeitoCard
                      {...leitoCardActions}
                    />
                  ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum leito cadastrado neste setor</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SetorCard;