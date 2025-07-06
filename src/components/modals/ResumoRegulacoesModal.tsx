
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResumoRegulacoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientesRegulados: any[];
}

const groupBy = (array: any[], key: string) => {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
    return result;
  }, {} as Record<string, any[]>);
};

export const ResumoRegulacoesModal = ({ open, onOpenChange, pacientesRegulados }: ResumoRegulacoesModalProps) => {
    const { toast } = useToast();

    const { origens, destinos } = useMemo(() => {
        const reguladosComDados = pacientesRegulados.filter(p => p.regulacao);
        const origensAgrupadas = groupBy(reguladosComDados, 'siglaSetorOrigem');
        const destinosAgrupados = groupBy(reguladosComDados.map(p => ({...p, setorDestinoSigla: p.regulacao.paraSetorSigla})), 'setorDestinoSigla');
        return { origens: origensAgrupadas, destinos: destinosAgrupados };
    }, [pacientesRegulados]);

    const gerarTextoOrigem = (pacientes: any[]) => {
        const listaPacientes = pacientes.map(p => 
            `_${p.leitoCodigo}_ - *${p.nomePaciente}* / VAI PARA: *${p.regulacao.paraSetorSigla} - ${p.regulacao.paraLeito}*`
        ).join('\n');

        return `*REGULAÇÕES PENDENTES*
${listaPacientes}

- Passar plantão para o destino, se ainda não realizado;
- Informar ao NIR sobre as transferências realizadas ou se houver dificuldades na passagem de plantão;
- Informar equipe de limpeza para higienização dos leitos liberados;`;
    };

    const gerarTextoDestino = (pacientes: any[]) => {
        const listaPacientes = pacientes.map(p => 
            `_${p.regulacao.paraLeito}_ - *${p.nomePaciente}* / VEM DE: *${p.siglaSetorOrigem} - ${p.leitoCodigo}*`
        ).join('\n');

        return `*REGULAÇÕES PENDENTES*
${listaPacientes}

- Checar se os leitos estão disponíveis para receber os pacientes regulados;
- Informar ao NIR se houver dificuldades na passagem de plantão;
- Puxar pacientes para o leito no sistema assim que possível;`;
    };

    const handleCopy = (texto: string) => {
        navigator.clipboard.writeText(texto);
        toast({ title: "Copiado!", description: "A mensagem de plantão foi copiada." });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Resumo de Regulações Pendentes</DialogTitle>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 py-4 flex-grow min-h-0">
                    <Card className="flex flex-col">
                        <CardHeader><CardTitle className="text-base">ORIGENS (QUEM ESTÁ ENVIANDO)</CardTitle></CardHeader>
                        <CardContent className="flex-grow overflow-hidden p-2">
                            <ScrollArea className="h-full">
                                <div className="space-y-2 pr-4">
                                    {Object.entries(origens as Record<string, any[]>).map(([setor, pacientes]) => (
                                        <div key={setor} className="flex items-center justify-between p-2 border rounded-lg">
                                            <h4 className="font-semibold text-sm">{setor}</h4>
                                            <Button size="sm" variant="ghost" onClick={() => handleCopy(gerarTextoOrigem(pacientes))}>
                                                <Copy className="mr-2 h-4 w-4" /> Copiar
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader><CardTitle className="text-base">DESTINOS (QUEM ESTÁ RECEBENDO)</CardTitle></CardHeader>
                        <CardContent className="flex-grow overflow-hidden p-2">
                            <ScrollArea className="h-full">
                                <div className="space-y-2 pr-4">
                                    {Object.entries(destinos as Record<string, any[]>).map(([setor, pacientes]) => (
                                        <div key={setor} className="flex items-center justify-between p-2 border rounded-lg">
                                            <h4 className="font-semibold text-sm">{setor}</h4>
                                            <Button size="sm" variant="ghost" onClick={() => handleCopy(gerarTextoDestino(pacientes))}>
                                                <Copy className="mr-2 h-4 w-4" /> Copiar
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
};
