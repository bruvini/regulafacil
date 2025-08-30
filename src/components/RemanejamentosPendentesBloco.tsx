
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RemanejamentoPendenteItem } from "@/components/RemanejamentoPendenteItem";
import { Paciente } from "@/types/hospital";
import { descreverMotivoRemanejamento } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
      const motivoCompleto = descreverMotivoRemanejamento(
        paciente.motivoRemanejamento
      );
      let motivoBase = motivoCompleto.split(":")[0].trim() || "Outro";
      if (
        motivoCompleto
          .toLowerCase()
          .startsWith("risco de contaminação cruzada")
      ) {
        motivoBase = "Risco de Contaminação Cruzada";
      }
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
      <Accordion type="single" collapsible>
        <AccordionItem value="remanejamentos">
          <CardHeader className="p-0">
            <AccordionTrigger className="px-6">
              <CardTitle className="text-xl font-semibold text-medical-primary flex items-center gap-2">
                Remanejamentos Pendentes
                <Badge variant="secondary">{remanejamentos.length}</Badge>
              </CardTitle>
            </AccordionTrigger>
          </CardHeader>
          <AccordionContent>
            <CardContent className="pt-4">
              <Accordion type="multiple" className="space-y-2" collapsible>
                {Object.entries(grupos).map(([motivo, pacientes]) => (
                  <AccordionItem value={motivo} key={motivo}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-medical-primary">{motivo}</span>
                        <Badge variant="secondary">{pacientes.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {pacientes.map((paciente) => (
                          <RemanejamentoPendenteItem
                            key={paciente.id}
                            paciente={paciente}
                            onRemanejar={onRemanejar}
                            onCancelar={onCancelar}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default RemanejamentosPendentesBloco;
