import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlaneTakeoff, TrendingUp, MessageSquare } from 'lucide-react';
import { ObservacoesAprimoradaModal } from '@/components/modals/ObservacoesAprimoradaModal';
import { Paciente, Leito, Setor } from '@/types/hospital';
import { formatarDuracao } from '@/lib/utils';

interface Props {
  pacientes: Paciente[];
  leitos: Leito[];
  setores: Setor[];
  onAdicionarObservacao: (pacienteId: string, observacao: string, tipo: 'obsAltaProvavel') => void;
  onRemoverObservacao: (pacienteId: string, observacaoId: string, tipo: 'obsAltaProvavel') => void;
}

const motivoLabels: Record<string, string> = {
  medicacao: 'Finalizando Medicação',
  transporte: 'Aguardando Transporte',
  familiar: 'Aguardando Familiar',
  emad: 'Aguardando EMAD',
  outros: 'Outros',
};

export const PacientesEmFluxoDeAlta = ({
  pacientes,
  leitos,
  setores,
  onAdicionarObservacao,
  onRemoverObservacao
}: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);

  const pacientesProvavelAlta = pacientes.filter(p => p.provavelAlta);
  const altasNoLeito = pacientes
    .filter(p => p.altaNoLeito?.status)
    .reduce((acc, paciente) => {
      const tipo = paciente.altaNoLeito!.tipo;
      if (!acc[tipo]) {
        acc[tipo] = [];
      }
      acc[tipo].push(paciente);
      return acc;
    }, {} as Record<string, Paciente[]>);

  const totalAltasNoLeito = Object.values(altasNoLeito).reduce((sum, arr) => sum + arr.length, 0);
  const totalGeral = pacientesProvavelAlta.length + totalAltasNoLeito;

  const getSetorNome = (setorId: string) => {
    const setor = setores.find(s => s.id === setorId);
    return setor ? setor.nomeSetor : 'Setor não encontrado';
  };

  const getSetorSigla = (setorId: string) => {
    const setor = setores.find(s => s.id === setorId);
    return setor ? setor.siglaSetor : 'Setor?';
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

  const pacientesProvavelAltaPorSetor = agruparPorSetor(pacientesProvavelAlta);

  const abrirObservacoes = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setModalOpen(true);
  };

  return (
    <>
      <AccordionItem value="fluxo-alta">
        <AccordionTrigger className="text-left">
          <div className="flex items-center gap-2">
            <PlaneTakeoff className="h-5 w-5 text-green-600" />
            <span className="font-medium">Pacientes em Fluxo de Alta</span>
            <Badge variant="secondary">{totalGeral}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Alta Provável</h3>
                <Badge variant="outline">{pacientesProvavelAlta.length}</Badge>
              </div>
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
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <PlaneTakeoff className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Alta no leito</h3>
                <Badge variant="outline">{totalAltasNoLeito}</Badge>
              </div>
              {totalAltasNoLeito === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum paciente com alta no leito
                </p>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {Object.entries(altasNoLeito).map(([tipo, pacientes]) => (
                    <AccordionItem key={tipo} value={tipo}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{motivoLabels[tipo] || tipo}</span>
                          <Badge variant="outline">{pacientes.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {pacientes.map(paciente => (
                            <div key={paciente.id} className="border rounded-lg p-4 bg-blue-50/50">
                              <h4 className="font-medium">{paciente.nomeCompleto}</h4>
                              <p className="text-sm text-muted-foreground">
                                {getSetorSigla(paciente.setorId)} - {getLeitoNome(paciente.leitoId)}
                              </p>
                              {paciente.altaNoLeito?.timestamp && (
                                <p className="text-xs text-muted-foreground">
                                  Espera: {formatarDuracao(paciente.altaNoLeito.timestamp)}
                                </p>
                              )}
                              {paciente.altaNoLeito?.pendencia && (
                                <p className="mt-1 text-sm font-medium">
                                  {paciente.altaNoLeito.pendencia}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </section>
          </div>
        </AccordionContent>
      </AccordionItem>

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
