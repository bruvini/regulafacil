
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RemanejamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motivo: string) => void;
}

export const RemanejamentoModal = ({ open, onOpenChange, onConfirm }: RemanejamentoModalProps) => {
  const [motivo, setMotivo] = useState('');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar Remanejamento</DialogTitle>
          <DialogDescription>Descreva o motivo da solicitação de remanejamento do paciente.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="motivo-remanejamento">Motivo</Label>
          <Textarea 
            id="motivo-remanejamento" 
            value={motivo} 
            onChange={(e) => setMotivo(e.target.value)} 
            placeholder="Ex: Paciente necessita de isolamento de contato..." 
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={() => { 
              onConfirm(motivo); 
              onOpenChange(false); 
              setMotivo('');
            }} 
            disabled={!motivo.trim()}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
