
import { Leito } from '@/types/hospital';
import LeitoCard from './LeitoCard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface QuartoCardProps {
  nomeQuarto: string;
  leitos: Leito[];
  setorId: string;
}

const QuartoCard = ({ nomeQuarto, leitos, setorId }: QuartoCardProps) => {
  return (
    <Card className="bg-muted/50 border-2 border-dashed col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-md font-semibold text-foreground">
          Quarto {nomeQuarto}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {leitos
            .sort((a, b) => a.codigoLeito.localeCompare(b.codigoLeito, undefined, { numeric: true, sensitivity: 'base' }))
            .map((leito) => (
              <LeitoCard key={leito.id} leito={leito} setorId={setorId} />
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuartoCard;
