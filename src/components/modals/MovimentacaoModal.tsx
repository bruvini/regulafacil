
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { BedDouble } from 'lucide-react';
import { useSetores } from '@/hooks/useSetores';
import { Leito } from '@/types/hospital';

type LeitoDestino = Leito & { setorId: string; setorNome: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNome: string;
  onConfirm: (leitoDestino: LeitoDestino) => void;
}

export const MovimentacaoModal = ({ open, onOpenChange, pacienteNome, onConfirm }: Props) => {
  const { setores } = useSetores();
  const [busca, setBusca] = useState('');
  const [leitoSelecionado, setLeitoSelecionado] = useState<LeitoDestino | null>(null);

  const leitosVagosAgrupados = useMemo(() => {
    const agrupados: Record<string, LeitoDestino[]> = {};
    setores.forEach(setor => {
      const leitosFiltrados = setor.leitos
        .filter(leito =>
          ['Vago', 'Higienizacao'].includes(leito.statusLeito) &&
          leito.codigoLeito.toLowerCase().includes(busca.toLowerCase())
        )
        .map(l => ({
          ...l,
          setorId: setor.id,
          setorNome: setor.nomeSetor
        }));
      if (leitosFiltrados.length > 0) {
        agrupados[setor.nomeSetor] = leitosFiltrados;
      }
    });
    return agrupados;
  }, [setores, busca]);

  const handleConfirmar = () => {
    if (leitoSelecionado) {
      onConfirm(leitoSelecionado);
      setLeitoSelecionado(null);
      setBusca('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Movimentar Paciente: {pacienteNome}</DialogTitle>
          <DialogDescription>Selecione o leito de destino.</DialogDescription>
        </DialogHeader>
        <div className="py-4 flex-grow min-h-0 space-y-4">
          <Input placeholder="Buscar por código do leito..." value={busca} onChange={e => setBusca(e.target.value)} />
          <ScrollArea className="h-full pr-4 -mr-4">
            <Accordion type="multiple" className="w-full space-y-2">
              {Object.entries(leitosVagosAgrupados).map(([setorNome, leitos]) => (
                <AccordionItem key={setorNome} value={setorNome} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">{setorNome}</AccordionTrigger>
                  <AccordionContent className="p-2 space-y-1">
                    {leitos.map(leito => (
                      <Card 
                        key={leito.id}
                        className={`cursor-pointer transition-colors ${leitoSelecionado?.id === leito.id ? 'bg-medical-primary/20 border-medical-primary' : 'hover:bg-muted/50'}`}
                        onClick={() => setLeitoSelecionado(leito)}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <BedDouble className="h-5 w-5 text-medical-success" />
                          <p className="font-semibold">{leito.codigoLeito}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirmar} disabled={!leitoSelecionado}>Confirmar Movimentação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
