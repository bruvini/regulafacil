
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatarDuracao } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, Users, Target, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SugestoesRegulacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sugestoes: Array<{
    setorNome: string;
    sugestoes: Array<{
      leito: any;
      pacientesElegiveis: any[];
    }>;
  }>;
  totalPendentes: number;
}

export const SugestoesRegulacaoModal = ({
  open,
  onOpenChange,
  sugestoes,
  totalPendentes,
}: SugestoesRegulacaoModalProps) => {
  const contarLeitosVagos = () => {
    return sugestoes.reduce((total, grupo) => {
      return total + grupo.sugestoes.length;
    }, 0);
  };

  const contarPacientesUnicos = () => {
    const pacientesUnicos = new Set();
    sugestoes.forEach(grupo => {
      grupo.sugestoes.forEach(sugestao => {
        sugestao.pacientesElegiveis.forEach(paciente => {
          pacientesUnicos.add(paciente.id);
        });
      });
    });
    return pacientesUnicos.size;
  };

  const leitosVagosCount = contarLeitosVagos();
  const pacientesUnicosCount = contarPacientesUnicos();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-medical-primary" />
            Sugestões Inteligentes de Regulação
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Estatísticas resumidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pacientes Aguardando
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-medical-primary">
                  {totalPendentes}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Leitos Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-green-600">
                  {leitosVagosCount}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pacientes Compatíveis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-blue-600">
                  {pacientesUnicosCount}
                </div>
              </CardContent>
            </Card>
          </div>

          {sugestoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">Nenhuma sugestão disponível</p>
              <p className="text-sm">Todos os leitos estão ocupados ou não há pacientes compatíveis</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {sugestoes.map((grupo, index) => (
                <AccordionItem key={index} value={`setor-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-medical-primary" />
                        <span className="font-semibold">{grupo.setorNome}</span>
                      </div>
                      <Badge variant="secondary">
                        {grupo.sugestoes.length} leitos disponíveis
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {grupo.sugestoes.map((sugestao, leitoIndex) => (
                        <div
                          key={leitoIndex}
                          className="border rounded-lg p-4 bg-card"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-green-50">
                                {sugestao.leito.codigoLeito}
                              </Badge>
                              {sugestao.leito.leitoIsolamento && (
                                <Badge variant="secondary">Isolamento</Badge>
                              )}
                              {sugestao.leito.leitoPCP && (
                                <Badge variant="secondary">PCP</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              {sugestao.pacientesElegiveis.length} compatíveis
                            </div>
                          </div>
                          
                          {sugestao.pacientesElegiveis.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Pacientes Compatíveis:</h5>
                              <div className="space-y-2">
                                {sugestao.pacientesElegiveis.slice(0, 3).map((paciente, pacienteIndex) => (
                                  <div
                                    key={pacienteIndex}
                                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">
                                        {paciente.nomeCompleto}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {paciente.especialidadePaciente} • {paciente.siglaSetorOrigem}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {formatarDuracao(paciente.dataInternacao)}
                                    </div>
                                  </div>
                                ))}
                                {sugestao.pacientesElegiveis.length > 3 && (
                                  <div className="text-xs text-muted-foreground text-center">
                                    +{sugestao.pacientesElegiveis.length - 3} outros pacientes
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
