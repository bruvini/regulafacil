
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RemanejamentoPendenteItem } from "@/components/RemanejamentoPendenteItem";
import { Paciente } from '@/types/hospital';

interface RemanejamentosPendentesBlocoProps {
  remanejamentosPendentes: Paciente[];
  onConfirmarRemanejamento: (paciente: Paciente) => void;
  onCancelarRemanejamento: (paciente: Paciente) => void;
  onObservacoesRemanejamento: (paciente: Paciente) => void;
}

export const RemanejamentosPendentesBloco = ({ 
  remanejamentosPendentes = [], 
  onConfirmarRemanejamento, 
  onCancelarRemanejamento, 
  onObservacoesRemanejamento 
}: RemanejamentosPendentesBlocoProps) => {
  // Garantir que remanejamentosPendentes é sempre um array
  const remanejamentos = Array.isArray(remanejamentosPendentes) ? remanejamentosPendentes : [];

  if (remanejamentos.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-card border border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-medical-primary flex items-center gap-2">
          Remanejamentos Pendentes
          <Badge variant="secondary">{remanejamentos.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {remanejamentos.map((paciente) => (
            <RemanejamentoPendenteItem
              key={paciente.id}
              paciente={paciente}
              onConfirmar={onConfirmarRemanejamento}
              onCancelar={onCancelarRemanejamento}
              onObservacoes={onObservacoesRemanejamento}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RemanejamentosPendentesBloco;
