
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GerenciadorDeRegras } from './GerenciadorDeRegras';
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
                if (!tipo) return null;

                return (
                  <div key={isolamento.isolamentoId} className="border rounded-lg p-4 space-y-3">
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
                    
                    <GerenciadorDeRegras 
                      regrasDoIsolamento={tipo.regrasPrecaucao}
                      regrasJaCumpridas={isolamento.regrasCumpridas || []}
                      onRegrasChange={(novasRegras) => {
                        atualizarRegrasIsolamento(setorId, leitoId, isolamento.isolamentoId, novasRegras);
                      }}
                      setorId={setorId}
                      leitoId={leitoId}
                      isolamentoId={isolamento.isolamentoId}
                    />
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
