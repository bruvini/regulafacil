
// src/components/ListaPacientesPendentes.tsx

import { Paciente } from '@/types/hospital';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PacientePendenteItem } from './PacientePendenteItem';

interface ListaPacientesPendentesProps {
  titulo: string;
  pacientes: (Paciente & {
    setorOrigem: string;
    siglaSetorOrigem: string;
    leitoCodigo: string;
    leitoId: string;
    statusLeito: string;
    regulacao?: any;
  })[];
  onRegularClick: (paciente: Paciente) => void;
  onAlta?: (leitoId: string) => void;
  onConcluir: (paciente: Paciente) => void;
  onAlterar: (paciente: Paciente) => void;
  onCancelar: (paciente: Paciente) => void;
}

export const ListaPacientesPendentes = ({
  titulo,
  pacientes,
  onRegularClick,
  onAlta,
  onConcluir,
  onAlterar,
  onCancelar
}: ListaPacientesPendentesProps) => {
  const pacientesOrdenados = pacientes;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-base font-semibold">{titulo}</CardTitle>
        <Badge variant="secondary">{pacientes.length}</Badge>
      </CardHeader>
      <CardContent className="p-0 flex-grow flex flex-col">
        {pacientes.length > 0 ? (
          <ScrollArea className="h-72 p-2">
            <div className="space-y-2">
              {pacientesOrdenados.map((paciente) => (
                <PacientePendenteItem
                  key={`${paciente.id}-${paciente.leitoId}`}
                  paciente={paciente}
                  onRegularClick={() => onRegularClick(paciente)}
                  onAlta={
                    titulo === 'Recuperação Cirúrgica'
                      ? () => onAlta?.(paciente.leitoId)
                      : undefined
                  }
                  onConcluir={onConcluir}
                  onAlterar={onAlterar}
                  onCancelar={onCancelar}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4">
            Nenhum paciente nesta fila.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
