import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import LeitoCard from './LeitoCard';
import QuartoCard from './QuartoCard';
import { getQuartoId } from '@/lib/utils';
import { Setor } from '@/types/hospital';
import { LeitoEnriquecido } from '@/types/hospital';

interface SetorCardProps {
  setor: Setor & { leitos: LeitoEnriquecido[] };
  actions: any;
}

const SetorCard = ({ setor, actions }: SetorCardProps) => {
  const { quartos, leitosSoltos } = useMemo(() => {
    const grupos = setor.leitos.reduce((acc, leito) => {
      const quartoId = getQuartoId(leito.codigoLeito);
      if (!acc[quartoId]) {
        acc[quartoId] = [];
      }
      acc[quartoId].push(leito);
      return acc;
    }, {} as Record<string, LeitoEnriquecido[]>);

    const resultado: { quartos: Record<string, LeitoEnriquecido[]>; leitosSoltos: LeitoEnriquecido[] } = {
      quartos: {},
      leitosSoltos: [],
    };

    Object.entries(grupos).forEach(([id, leitos]) => {
      if (leitos.length > 1) {
        resultado.quartos[id] = leitos;
      } else {
        resultado.leitosSoltos.push(leitos[0]);
      }
    });

    const nomesDosQuartos = Object.keys(resultado.quartos);
    if (nomesDosQuartos.length === 1 && resultado.leitosSoltos.length === 0) {
      return { quartos: {}, leitosSoltos: setor.leitos };
    }

    return resultado;
  }, [setor.leitos]);

  const comparadorNatural = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

  return (
    <Card className="shadow-card hover:shadow-medical transition-all duration-200 border border-border/50">
      <CardContent className="pt-6">
        {setor.leitos.length > 0 ? (
          <div className="space-y-4">
            {/* Renderizar quartos agrupados */}
            {Object.entries(quartos)
              .sort(([nomeQuartoA], [nomeQuartoB]) => comparadorNatural(nomeQuartoA, nomeQuartoB))
              .map(([nomeQuarto, leitosDoQuarto]) => (
                <QuartoCard
                  key={nomeQuarto}
                  nomeQuarto={nomeQuarto}
                  leitos={leitosDoQuarto as LeitoEnriquecido[]}
                  todosLeitosDoSetor={setor.leitos}
                  actions={actions}
                />
            ))}
            
            {/* Renderizar leitos soltos */}
            {leitosSoltos.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
                {(leitosSoltos as LeitoEnriquecido[])
                  .sort((a, b) => comparadorNatural(a.codigoLeito, b.codigoLeito))
                  .map((leito) => (
                    <LeitoCard
                      key={leito.id}
                      leito={leito}
                      todosLeitosDoSetor={setor.leitos}
                      actions={actions}
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
