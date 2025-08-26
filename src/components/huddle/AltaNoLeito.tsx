import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { PlaneTakeoff } from 'lucide-react';
import { Paciente, Leito, Setor } from '@/types/hospital';
import { formatarDuracao } from '@/lib/utils';

interface AltaNoLeitoProps {
  altasPendentes: Record<string, Paciente[]>;
  leitos: Leito[];
  setores: Setor[];
}

const motivoLabels: Record<string, string> = {
  medicacao: 'Finalizando Medicação',
  transporte: 'Aguardando Transporte',
  familiar: 'Aguardando Familiar',
  emad: 'Aguardando EMAD',
  outros: 'Outros',
};

export const AltaNoLeito = ({ altasPendentes, leitos, setores }: AltaNoLeitoProps) => {
  const total = Object.values(altasPendentes).reduce((sum, arr) => sum + arr.length, 0);

  const getSetorSigla = (setorId: string) => {
    const setor = setores.find(s => s.id === setorId);
    return setor ? setor.siglaSetor : 'Setor?';
  };

  const getLeitoCodigo = (leitoId: string) => {
    const leito = leitos.find(l => l.id === leitoId);
    return leito ? leito.codigoLeito : 'Leito?';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlaneTakeoff className="h-5 w-5 text-blue-600" />
          Radar de Altas Pendentes
          <Badge variant="secondary">{total}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum paciente com alta pendente
          </p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {Object.entries(altasPendentes).map(([tipo, pacientes]) => (
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
                          {getSetorSigla(paciente.setorId)} - {getLeitoCodigo(paciente.leitoId)}
                        </p>
                        {paciente.altaPendente?.timestamp && (
                          <p className="text-xs text-muted-foreground">
                            Espera: {formatarDuracao(paciente.altaPendente.timestamp)}
                          </p>
                        )}
                        {paciente.altaPendente?.detalhe && (
                          <p className="mt-1 text-sm font-medium">
                            {paciente.altaPendente.detalhe}
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
      </CardContent>
    </Card>
  );
};
