
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

// Função para agrupar dados. Pode ser colocada aqui ou em um arquivo de utils.
const groupBy = (array: any[], key: string) => {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
    return result;
  }, {});
};

export const ResumoRegulacoesModal = ({ open, onOpenChange, pacientesRegulados }: ResumoRegulacoesModalProps) => {
    const { toast } = useToast();

    // 1. Processa e agrupa os dados
    const { origens, destinos } = useMemo(() => {
        const reguladosComDados = pacientesRegulados.filter(p => p.regulacao);
        const origensAgrupadas = groupBy(reguladosComDados, 'setorOrigem');
        const destinosAgrupados = groupBy(reguladosComDados.map(p => ({...p, setorDestino: p.regulacao.paraSetor})), 'setorDestino');
        return { origens: origensAgrupadas, destinos: destinosAgrupados };
    }, [pacientesRegulados]);

    // 2. Funções para gerar os textos personalizados
    const gerarTextoOrigem = (pacientes: any[]) => {
        const listaPacientes = pacientes.map(p => 
            `${p.leitoCodigo} - ${p.nomePaciente} / VAI PARA: ${p.regulacao.paraSetor} - ${p.regulacao.paraLeito}`
        ).join('\n');

        return `*REGULAÇÕES PENDENTES*
${listaPacientes}

- Passar plantão para o destino, se ainda não realizado;
- Informar ao NIR sobre as transferências realizadas ou se houver dificuldades na passagem de plantão;
- Informar equipe de limpeza para higienização dos leitos liberados;`;
    };

    const gerarTextoDestino = (pacientes: any[]) => {
        const listaPacientes = pacientes.map(p => 
            `${p.regulacao.paraLeito} - ${p.nomePaciente} / VEM DE: ${p.setorOrigem} - ${p.leitoCodigo}`
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
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Resumo de Regulações Pendentes</DialogTitle>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 py-4 flex-grow min-h-0">
                    {/* Coluna de Origens */}
                    <Card className="flex flex-col">
                        <CardHeader><CardTitle className="text-lg">Setores de Origem</CardTitle></CardHeader>
                        <CardContent className="flex-grow overflow-hidden">
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-4">
                                    {Object.entries(origens as Record<string, any[]>).map(([setor, pacientes]) => (
                                        <div key={setor} className="p-3 border rounded-lg">
                                            <h4 className="font-semibold text-sm mb-2">{setor}</h4>
                                            <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-2 rounded-md">{gerarTextoOrigem(pacientes)}</pre>
                                            <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => handleCopy(gerarTextoOrigem(pacientes))}>
                                                <Copy className="mr-2 h-4 w-4" /> Copiar para a Origem
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Coluna de Destinos */}
                    <Card className="flex flex-col">
                        <CardHeader><CardTitle className="text-lg">Setores de Destino</CardTitle></CardHeader>
                        <CardContent className="flex-grow overflow-hidden">
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-4">
                                    {Object.entries(destinos as Record<string, any[]>).map(([setor, pacientes]) => (
                                        <div key={setor} className="p-3 border rounded-lg">
                                            <h4 className="font-semibold text-sm mb-2">{setor}</h4>
                                            <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-2 rounded-md">{gerarTextoDestino(pacientes)}</pre>
                                            <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => handleCopy(gerarTextoDestino(pacientes))}>
                                                <Copy className="mr-2 h-4 w-4" /> Copiar para o Destino
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
