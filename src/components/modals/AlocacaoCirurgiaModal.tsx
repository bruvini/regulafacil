
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BedDouble, Calendar, Stethoscope, User } from 'lucide-react';
import { SolicitacaoCirurgica } from '@/types/hospital';
import { useLeitoFinderCirurgico } from '@/hooks/useLeitoFinderCirurgico';
import { format } from 'date-fns';

interface AlocacaoCirurgiaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cirurgia: SolicitacaoCirurgica | null;
  onAlocarLeito: (cirurgia: SolicitacaoCirurgica, leito: any) => void;
}

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

export const AlocacaoCirurgiaModal = ({ open, onOpenChange, cirurgia, onAlocarLeito }: AlocacaoCirurgiaModalProps) => {
  const { findLeitosParaCirurgia } = useLeitoFinderCirurgico();
  const [leitosDisponiveis, setLeitosDisponiveis] = useState<any[]>([]);
  const [leitoSelecionado, setLeitoSelecionado] = useState<any | null>(null);

  useEffect(() => {
    if (open && cirurgia) {
      setLeitosDisponiveis(findLeitosParaCirurgia(cirurgia));
    }
    if (!open) {
      setLeitoSelecionado(null);
    }
  }, [open, cirurgia, findLeitosParaCirurgia]);

  const leitosAgrupadosPorSetor = leitosDisponiveis.reduce((acc, leito) => {
    (acc[leito.setorNome] = acc[leito.setorNome] || []).push(leito);
    return acc;
  }, {} as Record<string, any[]>);

  const handleSelectLeito = (leito: any) => {
    setLeitoSelecionado(leito);
  };

  const handleConfirmar = () => {
    if (cirurgia && leitoSelecionado) {
      onAlocarLeito(cirurgia, leitoSelecionado);
      onOpenChange(false);
    }
  };

  if (!cirurgia) return null;

  const idade = calcularIdade(cirurgia.dataNascimento);
  const dataInternacaoFormatada = cirurgia.dataPrevistaInternacao?.toDate ? 
    format(cirurgia.dataPrevistaInternacao.toDate(), 'dd/MM/yyyy') : 
    'Data inválida';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Alocar Leito para Cirurgia Eletiva</DialogTitle>
          <DialogDescription>
            Selecione um leito disponível para reservar para o paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-lg">{cirurgia.nomeCompleto}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{idade} anos • {cirurgia.sexo}</span>
                    <span className="flex items-center gap-1">
                      <Stethoscope className="h-4 w-4" />
                      {cirurgia.especialidade}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Internação: {dataInternacaoFormatada}
                    </span>
                    <Badge variant="outline">{cirurgia.tipoLeitoNecessario}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Leitos Disponíveis</h4>
              <ScrollArea className="h-80">
                <Accordion type="multiple" className="w-full">
                  {Object.entries(leitosAgrupadosPorSetor).map(([setorNome, leitos]) => (
                    <AccordionItem key={setorNome} value={setorNome}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex justify-between items-center w-full pr-4">
                          <span className="font-semibold">{setorNome}</span>
                          <Badge variant="secondary">{leitos.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        {leitos.map(leito => (
                          <Card 
                            key={leito.id} 
                            className={`cursor-pointer transition-colors ${
                              leitoSelecionado?.id === leito.id ? 'bg-blue-100 border-blue-300' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleSelectLeito(leito)}
                          >
                            <CardContent className="p-3">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <BedDouble className="h-4 w-4" />
                                  <span className="font-medium">{leito.codigoLeito}</span>
                                  {leito.leitoPCP && <Badge variant="outline">PCP</Badge>}
                                  {leito.leitoIsolamento && <Badge variant="destructive">Isolamento</Badge>}
                                </div>
                                <Badge variant={leito.statusLeito === 'Vago' ? 'default' : 'secondary'}>
                                  {leito.statusLeito}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </div>

            <div>
              <h4 className="font-medium mb-2">Leito Selecionado</h4>
              {leitoSelecionado ? (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-lg">{leitoSelecionado.codigoLeito}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Setor: {leitoSelecionado.setorNome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {leitoSelecionado.statusLeito}
                      </p>
                      {leitoSelecionado.leitoPCP && (
                        <Badge variant="outline">Leito PCP</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Selecione um leito da lista ao lado
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={!leitoSelecionado}>
            Reservar Leito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
