
import { Card, CardContent } from '@/components/ui/card';
import LeitoCard from './LeitoCard';
import QuartoCard from './QuartoCard';
import { agruparLeitosPorQuarto } from '@/lib/leitoUtils';
import { Setor } from '@/types/hospital';
import { LeitoEnriquecido } from '@/pages/MapaLeitos';

interface SetorCardProps {
  setor: Setor & { leitos: LeitoEnriquecido[] };
  actions: any;
}

const SetorCard = ({ setor, actions }: SetorCardProps) => {
  // Agrupar leitos usando a função utilitária
  const { quartos, leitosSoltos } = agruparLeitosPorQuarto(setor.leitos);

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
                  leitos={leitosDoQuarto}
                  todosLeitosDoSetor={setor.leitos}
                  actions={actions}
                />
            ))}
            
            {/* Renderizar leitos soltos */}
            {leitosSoltos.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
                {leitosSoltos
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
