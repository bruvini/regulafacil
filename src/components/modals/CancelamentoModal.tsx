
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motivo: string) => void;
}

export const CancelamentoModal = ({ open, onOpenChange, onConfirm }: Props) => {
  const [motivo, setMotivo] = useState('');

  const handleConfirm = () => {
    onConfirm(motivo);
    setMotivo('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Regulação</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="motivo-cancelamento">Motivo do Cancelamento</Label>
          <Textarea 
            id="motivo-cancelamento" 
            value={motivo} 
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Descreva o motivo do cancelamento..."
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!motivo.trim()}>
            Confirmar Cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
