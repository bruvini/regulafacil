
import LeitoCard from './LeitoCard';
import QuartoCard from './QuartoCard';
import { agruparLeitosPorQuarto } from '@/lib/leitoUtils';
import { Leito, Paciente, Setor } from '@/types/hospital';
import { LeitoEnriquecido } from '@/pages/MapaLeitos';

interface SetorCardProps {
  setor: Setor & { leitos: LeitoEnriquecido[] };
  onMoverPaciente: (leito: LeitoEnriquecido) => void;
  onAbrirObs: (leito: LeitoEnriquecido) => void;
  onLiberarLeito: (leitoId: string, pacienteId: string) => void;
  onAtualizarStatus: (leitoId: string, novoStatus: any, detalhes?: any) => void;
  onSolicitarUTI: (pacienteId: string) => void;
  onSolicitarRemanejamento: (pacienteId: string, motivo: string) => void;
  onTransferirPaciente: (pacienteId: string, destino: string, motivo: string) => void;
  onCancelarReserva: (leitoId: string) => void;
  onConcluirTransferencia: (leito: LeitoEnriquecido) => void;
  onToggleProvavelAlta: (pacienteId: string, valorAtual: boolean) => void;
  onFinalizarHigienizacao: (leitoId: string) => void;
  onBloquearLeito: (leitoId: string, motivo: string) => void;
  onEnviarParaHigienizacao: (leitoId: string) => void;
}

const SetorCard = (props: SetorCardProps) => {
  const { setor, ...leitoCardActions } = props;
  
  // Manually group leitos by quarto while preserving LeitoEnriquecido type
  const { quartos, leitosSoltos } = setor.leitos.reduce((acc, leito) => {
    const codigoLeito = leito.codigoLeito;
    const matches = codigoLeito.match(/^(\d+)([A-Za-z])$/);
    
    if (matches) {
      const [, numeroQuarto] = matches;
      if (!acc.quartos[numeroQuarto]) {
        acc.quartos[numeroQuarto] = [];
      }
      acc.quartos[numeroQuarto].push(leito);
    } else {
      acc.leitosSoltos.push(leito);
    }
    
    return acc;
  }, { quartos: {} as Record<string, LeitoEnriquecido[]>, leitosSoltos: [] as LeitoEnriquecido[] });

  const comparadorNatural = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

  return (
    <div>
      {setor.leitos.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(quartos)
            .sort(([nomeQuartoA], [nomeQuartoB]) => comparadorNatural(nomeQuartoA, nomeQuartoB))
            .map(([nomeQuarto, leitosDoQuarto]) => (
              <QuartoCard
                key={nomeQuarto}
                nomeQuarto={nomeQuarto}
                leitos={leitosDoQuarto}
                todosLeitosDoSetor={setor.leitos}
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
    </div>
  );
};

export default SetorCard;
