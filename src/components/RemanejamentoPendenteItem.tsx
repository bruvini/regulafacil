
import React from "react";
import { Paciente } from "@/types/hospital";
import { Button } from "@/components/ui/button";
import { descreverMotivoRemanejamento, formatarDuracao } from "@/lib/utils";

interface RemanejamentoPendenteItemProps {
  paciente: Paciente & {
    setorOrigem?: string;
    siglaSetorOrigem?: string;
    leitoCodigo?: string;
  };
  onRemanejar: (paciente: Paciente) => void;
  onCancelar: (paciente: Paciente) => void;
}

export const RemanejamentoPendenteItem = ({
  paciente,
  onRemanejar,
  onCancelar,
}: RemanejamentoPendenteItemProps) => {
  const motivo = descreverMotivoRemanejamento(paciente.motivoRemanejamento);
  const isRiscoContaminacao = motivo
    .toLowerCase()
    .startsWith("risco de contaminação cruzada");

  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col flex-grow min-w-0 gap-1">
        <p className="font-semibold text-base truncate" title={paciente.nomeCompleto}>
          {paciente.nomeCompleto}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {paciente.setorOrigem || paciente.siglaSetorOrigem || 'Setor não informado'} - Leito {paciente.leitoCodigo || 'N/A'}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          Motivo: {motivo}
        </p>
        <p className="text-xs text-muted-foreground">
          Aguardando há {formatarDuracao(paciente.dataPedidoRemanejamento)}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {!isRiscoContaminacao && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onCancelar(paciente)}
          >
            Cancelar
          </Button>
        )}
        <Button size="sm" onClick={() => onRemanejar(paciente)}>
          Remanejar
        </Button>
      </div>
    </div>
  );
};

export default RemanejamentoPendenteItem;
