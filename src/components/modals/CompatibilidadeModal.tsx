
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface CompatibilidadeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientesSemLeitoCompativel: any[];
  pacientesComLeitoCompativel: any[];
  leitosDisponiveis: any[];
}

export const CompatibilidadeModal = ({
  open,
  onOpenChange,
  pacientesSemLeitoCompativel,
  pacientesComLeitoCompativel,
  leitosDisponiveis
}: CompatibilidadeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Análise de Compatibilidade de Leitos
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          <div className="space-y-6">
            {/* Pacientes sem vaga */}
            <Card className="border-destructive/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Pacientes Sem Leito Compatível
                  <Badge variant="destructive">{pacientesSemLeitoCompativel.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pacientesSemLeitoCompativel.length > 0 ? (
                  <div className="space-y-2">
                    {pacientesSemLeitoCompativel.map((paciente, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-destructive/5 rounded">
                        <span className="font-medium">{paciente.nomeCompleto}</span>
                        <div className="text-sm text-muted-foreground">
                          {paciente.especialidadePaciente} • {paciente.sexoPaciente}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Todos os pacientes têm leitos compatíveis disponíveis</p>
                )}
              </CardContent>
            </Card>

            {/* Leitos disponíveis e pacientes elegíveis */}
            <Card className="border-success/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-4 w-4" />
                  Leitos Disponíveis e Pacientes Elegíveis
                  <Badge variant="secondary">{leitosDisponiveis.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leitosDisponiveis.length > 0 ? (
                  <div className="space-y-4">
                    {leitosDisponiveis.map((leito, index) => {
                      const pacientesElegiveis = pacientesComLeitoCompativel.filter(paciente => {
                        // Aqui você pode implementar a lógica de compatibilidade específica
                        // Por simplicidade, vamos mostrar todos por enquanto
                        return true;
                      });

                      return (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="font-medium text-sm mb-2">
                            {leito.codigoLeito} - {leito.setorNome}
                            <Badge variant="outline" className="ml-2">{leito.statusLeito}</Badge>
                          </div>
                          <div className="pl-3 space-y-1">
                            {pacientesElegiveis.slice(0, 3).map((paciente, pIndex) => (
                              <div key={pIndex} className="text-sm text-muted-foreground">
                                • {paciente.nomeCompleto} ({paciente.especialidadePaciente})
                              </div>
                            ))}
                            {pacientesElegiveis.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                ... e mais {pacientesElegiveis.length - 3} pacientes elegíveis
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Nenhum leito disponível no momento</p>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
