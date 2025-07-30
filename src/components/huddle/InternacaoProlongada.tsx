
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, MessageSquare } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ObservacoesAprimoradaModal } from '@/components/modals/ObservacoesAprimoradaModal';
import { Paciente, Leito, Setor } from '@/types/hospital';

interface Props {
  pacientes: Paciente[];
  leitos: Leito[];
  setores: Setor[];
  onAdicionarObservacao: (pacienteId: string, observacao: string, tipo: 'obsInternacaoProlongada') => void;
  onRemoverObservacao: (pacienteId: string, observacaoId: string, tipo: 'obsInternacaoProlongada') => void;
}

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
    const dataInternacao = new Date(p.dataInternacao);
    const diasInternado = differenceInDays(new Date(), dataInternacao);
    return diasInternado > 30;
  });

  const getLeitoNome = (leitoId: string) => {
    const leito = leitos.find(l => l.id === leitoId);
    return leito ? leito.codigoLeito : 'Leito não encontrado';
  };

  const pacientesPorSetor = pacientesProlongados.reduce((acc, paciente) => {
    const setor = setores.find(s => s.id === paciente.setorId);
    const setorNome = setor ? setor.nomeSetor : 'Setor não encontrado';
    
    if (!acc[setorNome]) {
      acc[setorNome] = [];
    }
    acc[setorNome].push(paciente);
    return acc;
  }, {} as Record<string, Paciente[]>);

  const abrirObservacoes = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            Internação Prolongada (> 30 dias)
            <Badge variant="secondary">{pacientesProlongados.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pacientesProlongados.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum paciente com internação prolongada
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(pacientesPorSetor).map(([setorNome, pacientesDoSetor]) => (
                <AccordionItem key={setorNome} value={setorNome}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{setorNome}</span>
                      <Badge variant="outline">{pacientesDoSetor.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {pacientesDoSetor.map((paciente) => {
                        const diasInternado = differenceInDays(new Date(), new Date(paciente.dataInternacao));
                        return (
                          <div key={paciente.id} className="border rounded-lg p-4 bg-orange-50/50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{paciente.nomeCompleto}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Leito: {getLeitoNome(paciente.leitoId)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Internado em: {format(new Date(paciente.dataInternacao), "dd/MM/yyyy", { locale: ptBR })}
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
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

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
