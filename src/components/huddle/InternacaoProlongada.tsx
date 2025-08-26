
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, MessageSquare } from 'lucide-react';
import { format, differenceInDays, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ObservacoesAprimoradaModal } from '@/components/modals/ObservacoesAprimoradaModal';
import { Paciente, Leito, Setor } from '@/types/hospital';
import { parseDateFromString } from '@/lib/utils';

interface Props {
  pacientes: Paciente[];
  leitos: Leito[];
  setores: Setor[];
  onAdicionarObservacao: (pacienteId: string, observacao: string, tipo: 'obsInternacaoProlongada') => void;
  onRemoverObservacao: (pacienteId: string, observacaoId: string, tipo: 'obsInternacaoProlongada') => void;
}

const parseDataInternacao = (dataStr: string): Date => {
  const parsed = parseDateFromString(dataStr);
  if (parsed) return parsed;

  const isoDate = new Date(dataStr);
  if (isValid(isoDate)) return isoDate;

  console.warn('Data de internação inválida:', dataStr);
  return new Date();
};

export const InternacaoProlongada = ({ 
  pacientes, 
  leitos, 
  setores, 
  onAdicionarObservacao, 
  onRemoverObservacao 
}: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);

  const pacientesProlongados = pacientes.filter(p => {
    const dataInternacao = parseDataInternacao(p.dataInternacao);
    const diasInternado = differenceInDays(new Date(), dataInternacao);
    return diasInternado > 60;
  });

  const getLeitoNome = (leitoId: string) => {
    const leito = leitos.find(l => l.id === leitoId);
    return leito ? leito.codigoLeito : 'Leito não encontrado';
  };

  const pacientesPorSetor = pacientesProlongados.reduce((acc, paciente) => {
    const setor = setores.find(s => s.id === paciente.setorId);
    const setorNome = setor ? setor.nomeSetor : 'Setor não encontrado';
    const especialidade = paciente.especialidadePaciente || 'Sem Especialidade';

    if (!acc[setorNome]) {
      acc[setorNome] = {};
    }
    if (!acc[setorNome][especialidade]) {
      acc[setorNome][especialidade] = [];
    }
    acc[setorNome][especialidade].push(paciente);
    return acc;
  }, {} as Record<string, Record<string, Paciente[]>>);

  const abrirObservacoes = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setModalOpen(true);
  };

  return (
    <>
      <AccordionItem value="internacao-prolongada">
        <AccordionTrigger className="text-left">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            <span className="font-medium">Internação Prolongada (&gt; 60 dias)</span>
            <Badge variant="secondary">{pacientesProlongados.length}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {pacientesProlongados.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum paciente com internação prolongada
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(pacientesPorSetor).map(([setorNome, especialidades]) => {
                const totalSetor = Object.values(especialidades).reduce((sum, arr) => sum + arr.length, 0);
                return (
                  <AccordionItem key={setorNome} value={setorNome}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{setorNome}</span>
                        <Badge variant="outline">{totalSetor}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6">
                        {Object.entries(especialidades).map(([especialidade, pacientesDaEspecialidade]) => (
                          <div key={especialidade} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{especialidade}</h4>
                              <Badge variant="outline">{pacientesDaEspecialidade.length}</Badge>
                            </div>
                            <div className="space-y-3">
                              {pacientesDaEspecialidade.map((paciente) => {
                                const dataInternacao = parseDataInternacao(paciente.dataInternacao);
                                const diasInternado = differenceInDays(new Date(), dataInternacao);
                                return (
                                  <div key={paciente.id} className="border rounded-lg p-4 bg-orange-50/50">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-medium">{paciente.nomeCompleto}</h4>
                                        <p className="text-sm text-muted-foreground">
                                          Leito: {getLeitoNome(paciente.leitoId)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Internado em: {format(dataInternacao, "dd/MM/yyyy", { locale: ptBR })}
                                        </p>
                                        <p className="text-xs font-medium text-orange-700">
                                          {diasInternado} dias de internação
                                        </p>
                                        {paciente.obsInternacaoProlongada && paciente.obsInternacaoProlongada.length > 0 && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {paciente.obsInternacaoProlongada.length} observação(ões)
                                          </p>
                                        )}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => abrirObservacoes(paciente)}
                                      >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Observações
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </AccordionContent>
      </AccordionItem>

      {pacienteSelecionado && (
        <ObservacoesAprimoradaModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          pacienteNome={pacienteSelecionado.nomeCompleto}
          observacoes={pacienteSelecionado.obsInternacaoProlongada || []}
          onConfirm={(texto) => onAdicionarObservacao(pacienteSelecionado.id, texto, 'obsInternacaoProlongada')}
          onDelete={(observacaoId) => onRemoverObservacao(pacienteSelecionado.id, observacaoId, 'obsInternacaoProlongada')}
        />
      )}
    </>
  );
};
