import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PassagemPlantaoData, SetorPassagem } from '@/hooks/usePassagemPlantao';
import { X } from 'lucide-react';

interface PassagemPlantaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dados: PassagemPlantaoData;
  onExport: () => void;
}

const renderSetores = (setores: SetorPassagem[]) => (
  <Accordion type="single" collapsible className="space-y-4">
    {setores.map((s, idx) => (
      <AccordionItem key={idx} value={(s.setor?.id || idx).toString()}>
        <AccordionTrigger>{s.setor?.nomeSetor || 'Setor'}</AccordionTrigger>
        <AccordionContent>
          {s.blocos.map((b) => (
            <Card key={b.titulo} className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm font-medium">{b.titulo}</CardTitle>
              </CardHeader>
              <CardContent>
                {b.itens.length ? (
                  <ul className="list-disc pl-4 space-y-1">
                    {b.itens.map((i, iIdx) => (
                      <li key={iIdx} className="text-sm">
                        {i}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados</p>
                )}
              </CardContent>
            </Card>
          ))}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

export const PassagemPlantaoModal = ({ open, onOpenChange, dados, onExport }: PassagemPlantaoModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full p-0">
        <div className="flex flex-col h-screen bg-background">
          <header className="flex items-center justify-between p-4 border-b">
            <DialogTitle className="text-xl font-bold">Passagem de Plantão</DialogTitle>
            <div className="flex items-center gap-2">
              <Button onClick={onExport}>Exportar</Button>
              <DialogClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-6 w-6" />
                </Button>
              </DialogClose>
            </div>
          </header>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              <section>
                <h2 className="text-lg font-semibold mb-2">Enfermarias</h2>
                {renderSetores(dados.enfermarias)}
              </section>
              <section>
                <h2 className="text-lg font-semibold mb-2">UTI</h2>
                {renderSetores(dados.uti)}
              </section>
              <section>
                <h2 className="text-lg font-semibold mb-2">CC - Recuperação</h2>
                {renderSetores(dados.ccRecuperacao)}
              </section>
              <section>
                <h2 className="text-lg font-semibold mb-2">CC - Salas Cirúrgicas</h2>
                {renderSetores(dados.ccSalas)}
              </section>
              <section>
                <h2 className="text-lg font-semibold mb-2">UNID. AVC AGUDO</h2>
                {renderSetores(dados.avcAgudo)}
              </section>
              <section>
                <h2 className="text-lg font-semibold mb-2">Pronto Socorro</h2>
                {renderSetores(dados.ps)}
              </section>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PassagemPlantaoModal;
