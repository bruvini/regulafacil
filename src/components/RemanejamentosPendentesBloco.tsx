
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RemanejamentoPendenteItem } from './RemanejamentoPendenteItem';
import { Paciente } from '@/types/paciente';

interface RemanejamentosPendentesBlocoProps {
  pacientes: any[];
  onRemanejar: (paciente: any) => void;
  onCancelar: (paciente: Paciente) => Promise<void>;
}

export const RemanejamentosPendentesBloco = ({
  pacientes,
  onRemanejar,
  onCancelar
}: RemanejamentosPendentesBlocoProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Remanejamentos Pendentes</CardTitle>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            {pacientes.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pacientes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum remanejamento pendente
          </p>
        ) : (
          pacientes.map((paciente) => (
            <RemanejamentoPendenteItem
              key={paciente.id}
              paciente={paciente}
              onRemanejar={() => onRemanejar(paciente)}
              onCancelar={() => onCancelar(paciente)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};
