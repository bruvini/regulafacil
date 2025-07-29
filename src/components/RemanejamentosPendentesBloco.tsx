
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { RemanejamentoPendenteItem } from "@/components/RemanejamentoPendenteItem";

interface RemanejamentosPendentesBlocoProps {
  pacientesAguardandoRemanejamento: any[];
  onRemanejar: (paciente: any) => void;
  onCancelar: (paciente: any) => void;
}

export const RemanejamentosPendentesBloco = ({ 
  pacientesAguardandoRemanejamento, 
  onRemanejar, 
  onCancelar 
}: RemanejamentosPendentesBlocoProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (pacientesAguardandoRemanejamento.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-card border border-border/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="text-xl font-semibold text-medical-primary flex items-center justify-between">
              <div className="flex items-center gap-2">
                Remanejamentos Pendentes
                <Badge variant="destructive">{pacientesAguardandoRemanejamento.length}</Badge>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-2">
              {pacientesAguardandoRemanejamento.map((paciente) => (
                <RemanejamentoPendenteItem
                  key={paciente.id}
                  paciente={paciente}
                  onRemanejar={() => onRemanejar(paciente)}
                  onCancelar={() => onCancelar(paciente)}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
