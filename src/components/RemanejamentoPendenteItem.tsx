
import React from 'react';
import { Paciente } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, MapPin } from 'lucide-react';
import { descreverMotivoRemanejamento } from '@/lib/utils';

interface RemanejamentoPendenteItemProps {
  paciente: Paciente & {
    setorOrigem?: string;
    siglaSetorOrigem?: string;
    leitoCodigo?: string;
  };
  onConfirmar: (paciente: Paciente) => void;
  onCancelar: (paciente: Paciente) => void;
  onObservacoes: (paciente: Paciente) => void;
}

export const RemanejamentoPendenteItem = ({ 
  paciente, 
  onConfirmar, 
  onCancelar, 
  onObservacoes 
}: RemanejamentoPendenteItemProps) => {
  const prioridadeCores = {
    'Muito Urgente': 'bg-red-500 text-white',
    'Urgente': 'bg-orange-500 text-white',
    'Normal': 'bg-yellow-500 text-gray-800',
    'Baixa': 'bg-green-500 text-white',
  };

  return (
    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-400 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-800">{paciente.nomeCompleto}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <MapPin className="h-4 w-4" />
            <span>
              {paciente.setorOrigem || paciente.siglaSetorOrigem || 'Setor não informado'} - 
              Leito {paciente.leitoCodigo || 'N/A'}
            </span>
          </div>
        </div>
        <Badge 
          variant="secondary" 
          className="text-xs font-semibold"
        >
          REMANEJAMENTO
        </Badge>
      </div>

      <div className="mt-2">
        <p className="text-gray-700 text-sm mb-2">
          <strong>Motivo:</strong> {descreverMotivoRemanejamento(paciente.motivoRemanejamento)}
        </p>
        <p className="text-gray-700 text-sm">
          <strong>Especialidade:</strong> {paciente.especialidadePaciente}
        </p>
      </div>

      <div className="flex items-center text-gray-600 text-xs mt-3">
        <CalendarClock className="mr-1 h-4 w-4" />
        Solicitado em: {
          paciente.dataPedidoRemanejamento 
            ? new Date(paciente.dataPedidoRemanejamento).toLocaleDateString('pt-BR')
            : 'Data não informada'
        }
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => onObservacoes(paciente)}>
          Observações
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onCancelar(paciente)}>
          Cancelar
        </Button>
        <Button size="sm" onClick={() => onConfirmar(paciente)}>
          Confirmar Remanejamento
        </Button>
      </div>
    </div>
  );
};

export default RemanejamentoPendenteItem;
