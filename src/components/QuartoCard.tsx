import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LeitoCard from '@/components/LeitoCard';
import { Leito } from '@/types/hospital';

interface QuartoCardProps {
  nomeQuarto: string;
  leitos: Leito[];
  setorId: string;
  onMoverPaciente?: (leito: Leito) => void;
}

const QuartoCard = ({ nomeQuarto, leitos, setorId, onMoverPaciente }: QuartoCardProps) => {
  const leitosSorteados = [...leitos].sort((a, b) => a.codigoLeito.localeCompare(b.codigoLeito));

  return (
    <Card className="w-full min-h-64">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>{nomeQuarto}</span>
          <Badge variant="outline" className="text-xs">{leitos.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {leitosSorteados.map((leito) => (
            <LeitoCard 
              key={leito.id} 
              leito={leito} 
              setorId={setorId} 
              todosLeitosDoSetor={leitos}
              onMoverPaciente={onMoverPaciente}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuartoCard;
