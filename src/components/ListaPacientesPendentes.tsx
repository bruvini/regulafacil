
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PacientePendenteItem } from "@/components/PacientePendenteItem";
import { Users } from "lucide-react";

interface Props {
  titulo: string;
  pacientes: any[];
  onRegularClick: (paciente: any) => void;
  onAltaClick: (paciente: any) => void;
  onAlta?: (leitoId: string) => void;
  onConcluir?: (paciente: any) => void;
  onAlterar?: (paciente: any) => void;
  onCancelar?: (paciente: any) => void;
  actingOnPatientId?: string | null;
}

export const ListaPacientesPendentes = ({ 
  titulo, 
  pacientes, 
  onRegularClick, 
  onAltaClick,
  onAlta, 
  onConcluir, 
  onAlterar, 
  onCancelar,
  actingOnPatientId
}: Props) => {
  if (pacientes.length === 0) return null;

  return (
    <Card className="shadow-sm border border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-medical-primary flex items-center gap-2">
          <Users className="h-5 w-5" />
          {titulo}
          <Badge variant="secondary">{pacientes.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {pacientes.map((paciente) => (
          <PacientePendenteItem
            key={paciente.id}
            paciente={paciente}
            onRegularClick={onRegularClick}
            onAltaClick={onAltaClick}
            isActing={actingOnPatientId === paciente.id}
          />
        ))}
      </CardContent>
    </Card>
  );
};
