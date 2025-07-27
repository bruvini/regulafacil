
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PacientePendenteItem } from "@/components/PacientePendenteItem";

interface ListaPacientesPendentesProps {
  titulo: string;
  pacientes: any[];
  onRegularClick: (paciente: any, modo?: "normal" | "uti") => void;
  onConcluir?: (paciente: any) => void;
  onAlterar?: (paciente: any) => void;
  onCancelar?: (paciente: any) => void;
  onAlta?: (leitoId: string) => void;
  showAltaButton?: boolean;
  fullWidth?: boolean;
}

export const ListaPacientesPendentes = ({
  titulo,
  pacientes,
  onRegularClick,
  onConcluir,
  onAlterar,
  onCancelar,
  onAlta,
  showAltaButton = false,
  fullWidth = false,
}: ListaPacientesPendentesProps) => {
  if (pacientes.length === 0) {
    return (
      <Card className={`${fullWidth ? 'w-full' : ''}`}>
        {titulo && (
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {titulo}
              <Badge variant="secondary">0</Badge>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum paciente pendente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${fullWidth ? 'w-full' : ''}`}>
      {titulo && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {titulo}
            <Badge variant="secondary">{pacientes.length}</Badge>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {pacientes.map((paciente) => (
          <PacientePendenteItem
            key={paciente.id}
            paciente={paciente}
            onRegularClick={() => onRegularClick(paciente)}
            onConcluir={onConcluir ? () => onConcluir(paciente) : undefined}
            onAlterar={onAlterar ? () => onAlterar(paciente) : undefined}
            onCancelar={onCancelar ? () => onCancelar(paciente) : undefined}
            onAlta={onAlta && showAltaButton ? () => onAlta(paciente.leitoId) : undefined}
            showAltaButton={showAltaButton}
          />
        ))}
      </CardContent>
    </Card>
  );
};
