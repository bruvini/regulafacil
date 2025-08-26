
import { Badge } from '@/components/ui/badge';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Paciente, Leito, Setor } from '@/types/hospital';
import { Observacao } from '@/types/observacao';

interface Props {
  pacientes: Paciente[];
  leitos: Leito[];
  setores: Setor[];
}

interface ObservacaoComTipo extends Observacao {
  tipo: 'Geral' | 'Alta Provável' | 'Internação Prolongada';
}

export const PacientesComObservacoes = ({ 
  pacientes, 
  leitos, 
  setores 
}: Props) => {

  const getSetorNome = (setorId: string) => {
    const setor = setores.find(s => s.id === setorId);
    return setor ? setor.nomeSetor : 'Setor não encontrado';
  };

  const getLeitoNome = (leitoId: string) => {
    const leito = leitos.find(l => l.id === leitoId);
    return leito ? leito.codigoLeito : 'Leito não encontrado';
  };

  const pacientesComObservacoes = pacientes.filter(paciente => {
    const temObsPaciente = paciente.obsPaciente && paciente.obsPaciente.length > 0;
    const temObsAltaProvavel = paciente.obsAltaProvavel && paciente.obsAltaProvavel.length > 0;
    const temObsInternacaoProlongada = paciente.obsInternacaoProlongada && paciente.obsInternacaoProlongada.length > 0;
    
    return temObsPaciente || temObsAltaProvavel || temObsInternacaoProlongada;
  });

  const obterTodasObservacoes = (paciente: Paciente): ObservacaoComTipo[] => {
    const observacoes: ObservacaoComTipo[] = [];

    if (paciente.obsPaciente) {
      observacoes.push(...paciente.obsPaciente.map(obs => ({ ...obs, tipo: 'Geral' as const })));
    }

    if (paciente.obsAltaProvavel) {
      observacoes.push(...paciente.obsAltaProvavel.map(obs => ({ ...obs, tipo: 'Alta Provável' as const })));
    }

    if (paciente.obsInternacaoProlongada) {
      observacoes.push(...paciente.obsInternacaoProlongada.map(obs => ({ ...obs, tipo: 'Internação Prolongada' as const })));
    }

    // Ordenar por timestamp (mais recente primeiro)
    return observacoes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getCorTipo = (tipo: ObservacaoComTipo['tipo']) => {
    switch (tipo) {
      case 'Geral':
        return 'bg-gray-100 text-gray-800';
      case 'Alta Provável':
        return 'bg-green-100 text-green-800';
      case 'Internação Prolongada':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AccordionItem value="observacoes">
      <AccordionTrigger className="text-left">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-purple-600" />
          <span className="font-medium">Pacientes com Observações</span>
          <Badge variant="secondary">{pacientesComObservacoes.length}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {pacientesComObservacoes.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum paciente com observações registradas
          </p>
        ) : (
          <div className="space-y-4">
            {pacientesComObservacoes.map((paciente) => {
              const todasObservacoes = obterTodasObservacoes(paciente);

              return (
                <div key={paciente.id} className="border rounded-lg p-4 bg-purple-50/30">
                  <div className="mb-3">
                    <h4 className="font-medium text-lg">{paciente.nomeCompleto}</h4>
                    <p className="text-sm text-muted-foreground">
                      {getSetorNome(paciente.setorId)} - Leito {getLeitoNome(paciente.leitoId)}
                    </p>
                    <p className="text-xs text-purple-700 font-medium">
                      {todasObservacoes.length} observação(ões) registrada(s)
                    </p>
                  </div>

                  <div className="space-y-3">
                    {todasObservacoes.map((observacao, index) => (
                      <div key={`${observacao.id}-${index}`} className="bg-white rounded-lg p-3 border-l-4 border-purple-200">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getCorTipo(observacao.tipo)}`}
                          >
                            {observacao.tipo}
                          </Badge>
                          <div className="text-xs text-muted-foreground text-right">
                            <div>{format(new Date(observacao.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
                            <div>{observacao.usuario}</div>
                          </div>
                        </div>
                        <p className="text-sm">{observacao.texto}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};
