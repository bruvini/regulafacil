
import React from 'react';
import { Paciente } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { CalendarClock, MessageSquare } from 'lucide-react';

interface PacientePendenteItemProps {
  paciente: Paciente & {
    setorOrigem: string;
    siglaSetorOrigem: string;
    leitoCodigo: string;
    leitoId: string;
    statusLeito: string;
    regulacao?: any;
  };
  onRegularClick: () => void;
  onAlta?: () => void;
  onConcluir: (paciente: Paciente) => void;
  onAlterar: (paciente: Paciente) => void;
  onCancelar: (paciente: Paciente) => void;
  onAltaDireta?: (paciente: any) => void;
}

export const PacientePendenteItem = ({ 
  paciente, 
  onRegularClick,
  onAlta,
  onConcluir,
  onAlterar,
  onCancelar,
  onAltaDireta
}: PacientePendenteItemProps) => {
  const prioridadeCores = {
    'Muito Urgente': 'bg-red-500 text-white',
    'Urgente': 'bg-orange-500 text-white',
    'Normal': 'bg-yellow-500 text-gray-800',
    'Baixa': 'bg-green-500 text-white',
  };

  const getPrioridadeClassName = (prioridade: string | undefined) => {
    if (!prioridade) return 'bg-gray-200 text-gray-700';
    return prioridadeCores[prioridade as keyof typeof prioridadeCores] || 'bg-gray-200 text-gray-700';
  };

  return (
    <div className="bg-white p-4 rounded-lg border-l-4 border-orange-400 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg text-gray-800">{paciente.nomeCompleto}</h3>
          <p className="text-sm text-gray-600">{paciente.idade} anos</p>
        </div>
        <span className={`text-xs font-bold uppercase py-1 px-2 rounded-full ${getPrioridadeClassName(paciente.prioridade)}`}>
          {paciente.prioridade || 'Sem prioridade'}
        </span>
      </div>

      <div className="mt-2">
        <p className="text-gray-700 text-sm">
          <strong>Solicitado por:</strong> {paciente.solicitadoPor}
        </p>
        <p className="text-gray-700 text-sm">
          <strong>Leito Necessário:</strong> {paciente.leitoNecessario}
        </p>
        <p className="text-gray-700 text-sm">
          <strong>Condição Clínica:</strong> {paciente.condicaoClinica}
        </p>
      </div>

      <div className="flex items-center text-gray-600 text-xs mt-3">
        <CalendarClock className="mr-1 h-4 w-4" />
        Solicitado em: {paciente.dataSolicitacao ? new Date(paciente.dataSolicitacao.toDate()).toLocaleDateString('pt-BR') : 'Data não informada'}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={() => onAlterar(paciente)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Observações
        </Button>
        <Button size="sm" onClick={onRegularClick}>Regular Paciente</Button>
      </div>
      
      {paciente.regulacao && (
        <div className="text-xs text-gray-500 mt-2">
          Regulado para: {paciente.regulacao.paraSetor || 'Não especificado'}
          {paciente.regulacao.timestamp && (
            <span className="ml-2">
              em {new Date(paciente.regulacao.timestamp.toDate()).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PacientePendenteItem;
