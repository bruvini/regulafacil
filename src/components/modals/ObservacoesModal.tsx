
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNome: string;
  observacoes: string[];
  onConfirm: (novaObservacao: string) => void;
}

export const ObservacoesModal = ({ open, onOpenChange, pacienteNome, observacoes, onConfirm }: Props) => {
  const [novaObs, setNovaObs] = useState('');

  const handleConfirm = () => {
    if (novaObs.trim()) {
      onConfirm(novaObs.trim());
      setNovaObs('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Observações: {pacienteNome}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="font-medium text-sm">Histórico:</p>
            <ScrollArea className="h-40 border rounded-md p-2">
              {observacoes?.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {observacoes.map((obs, i) => <li key={i}>{obs}</li>)}
                </ul>
              ) : <p className="text-sm text-muted-foreground text-center py-4">Nenhuma observação registrada.</p>}
            </ScrollArea>
          </div>
          <div className="flex gap-2">
            <Input value={novaObs} onChange={e => setNovaObs(e.target.value)} placeholder="Adicionar nova observação..." />
            <Button onClick={handleConfirm} disabled={!novaObs.trim()}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
