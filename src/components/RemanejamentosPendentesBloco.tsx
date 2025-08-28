
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { RemanejamentoPendenteItem } from "@/components/RemanejamentoPendenteItem";
import type { TipoRemanejamento } from "@/types/hospital";

interface RemanejamentosPendentesBlocoProps {
  pacientesAguardandoRemanejamento: any[];
  onRemanejar: (paciente: any) => void;
  onCancelar: (paciente: any) => void;
}

export const RemanejamentosPendentesBloco = ({
  pacientesAguardandoRemanejamento,
  onRemanejar,
  onCancelar,
}: RemanejamentosPendentesBlocoProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const pacientesFiltrados = pacientesAguardandoRemanejamento.filter(
    (p) => p.remanejarPaciente
  );

  if (pacientesFiltrados.length === 0) {
    return null;
  }

  const grupos = pacientesFiltrados.reduce(
    (acc: Record<TipoRemanejamento, any[]>, paciente) => {
      let tipo: TipoRemanejamento = 'incompatibilidade_biologica';
      if (typeof paciente.motivoRemanejamento === 'object' && paciente.motivoRemanejamento)
        tipo = paciente.motivoRemanejamento.tipo;
      acc[tipo] = acc[tipo] || [];
      acc[tipo].push(paciente);
      return acc;
    },
    {} as Record<TipoRemanejamento, any[]>
  );

  const labels: Record<TipoRemanejamento, string> = {
    priorizacao: 'Pedido de Priorização',
    adequacao_perfil: 'Adequação de Perfil Clínico',
    melhoria_assistencia: 'Melhoria na Assistência',
    liberado_isolamento: 'Liberado de Isolamento',
    incompatibilidade_biologica: 'Incompatibilidade Biológica',
  };

  return (
    <Card className="shadow-card border border-border/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="text-xl font-semibold text-medical-primary flex items-center justify-between">
              <div className="flex items-center gap-2">
                Remanejamentos Pendentes
                <Badge variant="destructive">{pacientesFiltrados.length}</Badge>
              </div>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {Object.entries(grupos).map(([tipo, pacientes]) => (
                <AccordionItem key={tipo} value={tipo} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      {labels[tipo as TipoRemanejamento]}
                      <Badge variant="destructive">{pacientes.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                      {pacientes.map((paciente: any) => (
                        <RemanejamentoPendenteItem
                          key={paciente.id}
                          paciente={paciente}
                          onRemanejar={() => onRemanejar(paciente)}
                          onCancelar={() => onCancelar(paciente)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
