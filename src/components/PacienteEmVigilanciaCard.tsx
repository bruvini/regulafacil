
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useSetores } from '@/hooks/useSetores';
import { useIsolamentos } from '@/hooks/useIsolamentos';
import { Shield, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PacienteEmVigilanciaCardProps {
  paciente: any;
  setorId: string;
  leitoId: string;
}

export const PacienteEmVigilanciaCard = ({ paciente, setorId, leitoId }: PacienteEmVigilanciaCardProps) => {
  const { atualizarRegrasIsolamento } = useSetores();
  const { isolamentos } = useIsolamentos();
  const [regrasLocais, setRegrasLocais] = useState<Record<string, string[]>>({});

  const handleRegraChange = (isolamentoId: string, regraId: string, checked: boolean) => {
    const regrasAtuais = regrasLocais[isolamentoId] || paciente.isolamentosVigentes?.find(i => i.isolamentoId === isolamentoId)?.regrasCumpridas || [];
    
    let novasRegras;
    if (checked) {
      novasRegras = [...regrasAtuais, regraId];
    } else {
      novasRegras = regrasAtuais.filter(id => id !== regraId);
    }
    
    setRegrasLocais({
      ...regrasLocais,
      [isolamentoId]: novasRegras
    });
    
    atualizarRegrasIsolamento(setorId, leitoId, isolamentoId, novasRegras);
  };

  const obterRegrasDoIsolamento = (isolamentoId: string) => {
    const tipoIsolamento = isolamentos.find(t => t.id === isolamentoId);
    if (!tipoIsolamento) return [];
    
    // Extrair regras dos grupos de regras
    const todasRegras = tipoIsolamento.regrasPrecaucao.grupos.flatMap(grupo => 
      grupo.regras.map(regra => ({
        id: regra.id,
        descricao: regra.descricao,
        tipo: regra.tipo
      }))
    );
    
    return todasRegras;
  };

  const calcularIdade = (dataNascimento: string): string => {
    if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return '?';
    const [dia, mes, ano] = dataNascimento.split('/').map(Number);
    const hoje = new Date();
    const nascimento = new Date(ano, mes - 1, dia);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade.toString();
  };

  return (
    <Card className="w-full">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center justify-between w-full mr-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-medical-danger" />
                <div className="text-left">
                  <p className="font-semibold">{paciente.nomePaciente}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{paciente.sexoPaciente?.charAt(0)} - {calcularIdade(paciente.dataNascimento)}a</Badge>
                    <span>{paciente.leitoCodigo}</span>
                    <span>•</span>
                    <span>{paciente.especialidadePaciente}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {paciente.isolamentosVigentes?.map((isolamento: any) => {
                  const tipo = isolamentos.find(t => t.id === isolamento.isolamentoId);
                  return (
                    <Badge 
                      key={isolamento.isolamentoId}
                      className="text-white"
                      style={{ backgroundColor: tipo?.cor || '#666' }}
                    >
                      {isolamento.sigla}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {paciente.isolamentosVigentes?.map((isolamento: any) => {
                const tipo = isolamentos.find(t => t.id === isolamento.isolamentoId);
                const regras = obterRegrasDoIsolamento(isolamento.isolamentoId);
                const regrasCumpridas = regrasLocais[isolamento.isolamentoId] || isolamento.regrasCumpridas || [];
                const todasRegrasCumpridas = regras.length > 0 && regras.every(regra => regrasCumpridas.includes(regra.id));

                return (
                  <div key={isolamento.isolamentoId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: tipo?.cor || '#666' }}
                        />
                        <div>
                          <p className="font-medium">{tipo?.nomeMicroorganismo}</p>
                          <p className="text-sm text-muted-foreground">
                            Início: {format(parseISO(isolamento.dataInicioVigilancia), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      {todasRegrasCumpridas && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pronto para Finalizar
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Regras de Precaução:</Label>
                      {regras.length > 0 ? (
                        <div className="space-y-2">
                          {regras.map(regra => (
                            <div key={regra.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${isolamento.isolamentoId}-${regra.id}`}
                                checked={regrasCumpridas.includes(regra.id)}
                                onCheckedChange={(checked) => handleRegraChange(isolamento.isolamentoId, regra.id, checked as boolean)}
                              />
                              <Label 
                                htmlFor={`${isolamento.isolamentoId}-${regra.id}`}
                                className="text-sm cursor-pointer"
                              >
                                {regra.descricao}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Nenhuma regra específica configurada para este isolamento.
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button 
                        size="sm" 
                        disabled={!todasRegrasCumpridas}
                        variant={todasRegrasCumpridas ? "default" : "secondary"}
                      >
                        Finalizar Isolamento
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};
