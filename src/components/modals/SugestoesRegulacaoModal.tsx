
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Bed, Shield, Users, Lightbulb } from 'lucide-react';
import { Leito, Paciente } from '@/types/hospital';

interface SugestaoRegulacao {
  leito: Leito & {
    setorNome?: string;
    statusLeito?: string;
  };
  pacientesElegiveis: (Paciente & {
    setorOrigem?: string;
    siglaSetorOrigem?: string;
  })[];
}

interface SugestaoAgrupada {
  setorNome: string;
  sugestoes: SugestaoRegulacao[];
}

interface SugestoesRegulacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sugestoes: SugestaoAgrupada[];
}

export const SugestoesRegulacaoModal = ({
  open,
  onOpenChange,
  sugestoes,
}: SugestoesRegulacaoModalProps) => {
  const totalLeitos = sugestoes.reduce((acc, grupo) => acc + grupo.sugestoes.length, 0);
  const totalPacientes = sugestoes.reduce(
    (acc, grupo) => acc + grupo.sugestoes.reduce((acc2, s) => acc2 + s.pacientesElegiveis.length, 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-medical-primary" />
            Sugestões Inteligentes de Regulação
          </DialogTitle>
          <DialogDescription>
            Sistema de auxílio à decisão baseado em compatibilidade de leitos e
            pacientes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-medical-primary" />
              <span className="text-sm font-medium">
                {totalLeitos} leitos disponíveis
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-medical-secondary" />
              <span className="text-sm font-medium">
                {totalPacientes} pacientes compatíveis
              </span>
            </div>
          </div>

          {sugestoes.length > 0 ? (
            <div className="space-y-6">
              {sugestoes.map((grupo, grupoIndex) => (
                <Card key={grupo.setorNome} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-medical-primary">
                      {grupo.setorNome}
                      <Badge variant="secondary" className="ml-2">
                        {grupo.sugestoes.length} leitos
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <div className="px-6 pb-6">
                    <Accordion type="multiple" className="w-full">
                      {grupo.sugestoes.map((sugestao, index) => (
                        <AccordionItem key={sugestao.leito.id} value={`${grupoIndex}-${index}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Bed className="h-4 w-4 text-medical-primary" />
                                  <span className="font-semibold">
                                    {sugestao.leito.codigoLeito}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  {sugestao.leito.leitoPCP && (
                                    <Badge variant="secondary" className="text-xs">
                                      PCP
                                    </Badge>
                                  )}
                                  {sugestao.leito.leitoIsolamento && (
                                    <Badge variant="outline" className="text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Isolamento
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge variant="default">
                                {sugestao.pacientesElegiveis.length} pacientes
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4">
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-muted-foreground">
                                Pacientes Compatíveis (ordenados por prioridade):
                              </h4>
                              <div className="space-y-2">
                                {sugestao.pacientesElegiveis.map((paciente, idx) => (
                                  <div
                                    key={paciente.id}
                                    className="flex items-center justify-between p-3 bg-card border rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">
                                          {paciente.nomeCompleto}
                                        </span>
                                        {idx === 0 && (
                                          <Badge
                                            variant="default"
                                            className="text-xs bg-medical-success"
                                          >
                                            Prioridade
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>
                                          Origem: {paciente.siglaSetorOrigem || 'N/A'}
                                        </span>
                                        <span>
                                          Especialidade:{' '}
                                          {paciente.especialidadePaciente || 'N/A'}
                                        </span>
                                        <span>Sexo: {paciente.sexoPaciente}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-3">
                <Lightbulb className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Nenhuma sugestão disponível</h3>
                  <p className="text-sm text-muted-foreground">
                    Não há pacientes compatíveis com os leitos disponíveis no
                    momento.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
