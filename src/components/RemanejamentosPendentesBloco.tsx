
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RemanejamentoPendenteItem } from "@/components/RemanejamentoPendenteItem";
import { Paciente } from "@/types/hospital";
import { descreverMotivoRemanejamento } from "@/lib/utils";

interface RemanejamentosPendentesBlocoProps {
  remanejamentos: Paciente[];
  onRemanejar: (paciente: Paciente) => void;
  onCancelar: (paciente: Paciente) => void;
}

export const RemanejamentosPendentesBloco = ({
  remanejamentos = [],
  onRemanejar,
  onCancelar,
}: RemanejamentosPendentesBlocoProps) => {
  const grupos = remanejamentos.reduce(
    (acc, paciente) => {
      const motivoBase = descreverMotivoRemanejamento(
        paciente.motivoRemanejamento
      )
        .split(":")[0]
        .trim() || "Outro";
      if (!acc[motivoBase]) acc[motivoBase] = [];
      acc[motivoBase].push(paciente);
      return acc;
    },
    {} as Record<string, Paciente[]>
  );

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
        {Object.entries(grupos).map(([motivo, pacientes]) => (
          <div key={motivo} className="mb-6 last:mb-0">
            <h3 className="font-medium text-medical-primary mb-2">{motivo}</h3>
            <div className="space-y-4">
              {pacientes.map((paciente) => (
                <RemanejamentoPendenteItem
                  key={paciente.id}
                  paciente={paciente}
                  onRemanejar={onRemanejar}
                  onCancelar={onCancelar}
                />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RemanejamentosPendentesBloco;
