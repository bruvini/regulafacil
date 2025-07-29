
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PacienteReguladoItem } from "@/components/PacienteReguladoItem";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, BarChart3 } from "lucide-react";
import { useState } from "react";

interface PacientesReguladosBlocoProps {
  pacientesRegulados: any[];
  onConcluir: (paciente: any) => void;
  onAlterar: (paciente: any) => void;
  onCancelar: (paciente: any) => void;
  onVerResumo: () => void;
  onAbrirPanorama: () => void;
}

export const PacientesReguladosBloco = ({ 
  pacientesRegulados, 
  onConcluir, 
  onAlterar, 
  onCancelar, 
  onVerResumo,
  onAbrirPanorama
}: PacientesReguladosBlocoProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (pacientesRegulados.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-card border border-border/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="text-xl font-semibold text-medical-primary flex items-center justify-between">
              <div className="flex items-center gap-2">
                Pacientes Regulados
                <Badge variant="secondary">{pacientesRegulados.length}</Badge>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onAbrirPanorama}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Panorama Atual
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onVerResumo}
              >
                Ver Resumo
              </Button>
            </div>
            <div className="space-y-2">
              {pacientesRegulados.map((paciente) => (
                <PacienteReguladoItem
                  key={paciente.id}
                  paciente={paciente}
                  onConcluir={onConcluir}
                  onAlterar={onAlterar}
                  onCancelar={onCancelar}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
