
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CirurgiaEletivaItem } from "@/components/CirurgiaEletivaItem";

interface CirurgiasEletivasBlocoProps {
  cirurgias: any[];
  onAlocarCirurgia: (cirurgia: any) => void;
}

export const CirurgiasEletivasBloco = ({ cirurgias, onAlocarCirurgia }: CirurgiasEletivasBlocoProps) => {
  if (cirurgias.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-card border border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-medical-primary flex items-center gap-2">
          Pacientes Aguardando Cirurgia Eletiva
          <Badge>{cirurgias.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cirurgias.length > 0 ? (
          <div className="space-y-2">
            {cirurgias.map((cirurgia) => (
              <CirurgiaEletivaItem
                key={cirurgia.id}
                cirurgia={cirurgia}
                onAlocarLeito={onAlocarCirurgia}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            Nenhuma cirurgia eletiva pendente.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
