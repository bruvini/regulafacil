
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TrendingUp, BedDouble, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ObservacoesAprimoradaModal } from '@/components/modals/ObservacoesAprimoradaModal';
import { Paciente, Leito, Setor } from '@/types/hospital';

interface Props {
  pacientes: Paciente[];
  leitos: Leito[];
  setores: Setor[];
  onAdicionarObservacao: (pacienteId: string, observacao: string, tipo: 'obsAltaProvavel') => void;
  onRemoverObservacao: (pacienteId: string, observacaoId: string, tipo: 'obsAltaProvavel') => void;
}

export const AltaProvavel = ({ 
  pacientes, 
  leitos, 
  setores, 
  onAdicionarObservacao, 
  onRemoverObservacao 
}: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);

  const pacientesProvavelAlta = pacientes.filter(p => p.provavelAlta);
  const pacientesAltaNoLeito = pacientes.filter(p => p.altaNoLeito?.status);

  const getSetorNome = (setorId: string) => {
    const setor = setores.find(s => s.id === setorId);
    return setor ? setor.nomeSetor : 'Setor não encontrado';
  };

  const getLeitoNome = (leitoId: string) => {
    const leito = leitos.find(l => l.id === leitoId);
    return leito ? leito.codigoLeito : 'Leito não encontrado';
  };

  const agruparPorSetor = (pacientesList: Paciente[]) => {
    return pacientesList.reduce((acc, paciente) => {
      const setorNome = getSetorNome(paciente.setorId);
      if (!acc[setorNome]) {
        acc[setorNome] = [];
      }
      acc[setorNome].push(paciente);
      return acc;
    }, {} as Record<string, Paciente[]>);
  };

  const abrirObservacoes = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setModalOpen(true);
  };

  const pacientesProvavelAltaPorSetor = agruparPorSetor(pacientesProvavelAlta);
  const pacientesAltaNoLeitoPorSetor = agruparPorSetor(pacientesAltaNoLeito);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Provável Alta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Provável Alta
              <Badge variant="secondary">{pacientesProvavelAlta.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pacientesProvavelAlta.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum paciente com alta provável
              </p>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(pacientesProvavelAltaPorSetor).map(([setorNome, pacientesDoSetor]) => (
                  <AccordionItem key={setorNome} value={setorNome}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{setorNome}</span>
                        <Badge variant="outline">{pacientesDoSetor.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {pacientesDoSetor.map((paciente) => (
                          <div key={paciente.id} className="border rounded-lg p-4 bg-green-50/50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{paciente.nomeCompleto}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Leito {getLeitoNome(paciente.leitoId)}
                                </p>
                                {paciente.obsAltaProvavel && paciente.obsAltaProvavel.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {paciente.obsAltaProvavel.length} observação(ões)
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
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Alta no Leito */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-blue-600" />
              Alta no Leito
              <Badge variant="secondary">{pacientesAltaNoLeito.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pacientesAltaNoLeito.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum paciente com alta no leito
              </p>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(pacientesAltaNoLeitoPorSetor).map(([setorNome, pacientesDoSetor]) => (
                  <AccordionItem key={setorNome} value={setorNome}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{setorNome}</span>
                        <Badge variant="outline">{pacientesDoSetor.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {pacientesDoSetor.map((paciente) => (
                          <div key={paciente.id} className="border rounded-lg p-4 bg-blue-50/50">
                            <div>
                              <h4 className="font-medium">{paciente.nomeCompleto}</h4>
                              <p className="text-sm text-muted-foreground">
                                Leito {getLeitoNome(paciente.leitoId)}
                              </p>
                              <div className="mt-2 p-2 bg-white rounded border-l-4 border-blue-500">
                                <p className="text-sm font-medium text-blue-900">
                                  Pendência: {paciente.altaNoLeito?.pendencia}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Registrado em: {format(new Date(paciente.altaNoLeito?.timestamp || ''), "dd/MM/yyyy HH:mm", { locale: ptBR })} por {paciente.altaNoLeito?.usuario}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>

      {pacienteSelecionado && (
        <ObservacoesAprimoradaModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          pacienteNome={pacienteSelecionado.nomeCompleto}
          observacoes={pacienteSelecionado.obsAltaProvavel || []}
          onConfirm={(texto) => onAdicionarObservacao(pacienteSelecionado.id, texto, 'obsAltaProvavel')}
          onDelete={(observacaoId) => onRemoverObservacao(pacienteSelecionado.id, observacaoId, 'obsAltaProvavel')}
        />
      )}
    </>
  );
};
