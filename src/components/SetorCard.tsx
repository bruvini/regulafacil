
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Setor } from '@/types/hospital';
import LeitoCard from './LeitoCard';

interface SetorCardProps {
  setor: Setor;
}

const SetorCard = ({ setor }: SetorCardProps) => {
  const leitosVagos = setor.leitos.filter(leito => leito.statusLeito === 'Vago').length;
  const totalLeitos = setor.leitos.length;

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
              {leitosVagos}/{totalLeitos}
            </div>
            <p className="text-xs text-muted-foreground">Vagos/Total</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {setor.leitos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {setor.leitos.map((leito, index) => (
              <LeitoCard 
                key={index} 
                leito={leito} 
                setorId={setor.id!} 
                todosLeitosDoSetor={setor.leitos}
              />
            ))}
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
