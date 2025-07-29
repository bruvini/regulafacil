
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { AguardandoUTIItem } from "@/components/AguardandoUTIItem";
import { AguardandoTransferenciaItem } from "@/components/AguardandoTransferenciaItem";

interface EsperaUTITransferenciasProps {
  pacientesAguardandoUTI: any[];
  pacientesAguardandoTransferencia: any[];
  onCancelarUTI: (paciente: any) => void;
  onTransferirExterna: (paciente: any) => void;
  onRegularUTI: (paciente: any) => void;
  onGerenciarTransferencia: (paciente: any) => void;
}

export const EsperaUTITransferencias = ({
  pacientesAguardandoUTI,
  pacientesAguardandoTransferencia,
  onCancelarUTI,
  onTransferirExterna,
  onRegularUTI,
  onGerenciarTransferencia
}: EsperaUTITransferenciasProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const totalPacientes = pacientesAguardandoUTI.length + pacientesAguardandoTransferencia.length;

  return (
    <Card className="shadow-card border border-border/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="text-xl font-semibold text-medical-primary flex items-center justify-between">
              <div className="flex items-center gap-2">
                Espera por UTI e Transferências Externas
                <Badge variant="secondary">{totalPacientes}</Badge>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna 1: Pacientes Aguardando UTI */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-foreground">Pacientes Aguardando UTI</h4>
                  <Badge variant="outline">{pacientesAguardandoUTI.length}</Badge>
                </div>
                {pacientesAguardandoUTI.length > 0 ? (
                  <div className="space-y-2">
                    {pacientesAguardandoUTI.map((paciente) => (
                      <AguardandoUTIItem
                        key={paciente.id}
                        paciente={paciente}
                        onCancel={() => onCancelarUTI(paciente)}
                        onTransfer={() => onTransferirExterna(paciente)}
                        onRegularUTI={() => onRegularUTI(paciente)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    Nenhum paciente aguardando UTI.
                  </p>
                )}
              </div>

              {/* Coluna 2: Pacientes Aguardando Transferência Externa */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-foreground">Pacientes Aguardando Transferência Externa</h4>
                  <Badge variant="outline">{pacientesAguardandoTransferencia.length}</Badge>
                </div>
                {pacientesAguardandoTransferencia.length > 0 ? (
                  <div className="space-y-2">
                    {pacientesAguardandoTransferencia.map((paciente) => (
                      <AguardandoTransferenciaItem
                        key={paciente.id}
                        paciente={paciente}
                        onCancel={() => onTransferirExterna(paciente)}
                        onGerenciar={() => onGerenciarTransferencia(paciente)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    Nenhum paciente aguardando transferência externa.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
