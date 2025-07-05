
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TransferenciaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (destino: string, motivo: string) => void;
}

export const TransferenciaModal = ({ open, onOpenChange, onConfirm }: TransferenciaModalProps) => {
  const [destino, setDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir Paciente</DialogTitle>
          <DialogDescription>Informe o destino e o motivo da transferência.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="destino-transferencia">Destino</Label>
            <Input 
              id="destino-transferencia" 
              value={destino} 
              onChange={(e) => setDestino(e.target.value)} 
              placeholder="Ex: Hospital Regional" 
            />
          </div>
          <div>
            <Label htmlFor="motivo-transferencia">Motivo</Label>
            <Textarea 
              id="motivo-transferencia" 
              value={motivo} 
              onChange={(e) => setMotivo(e.target.value)} 
              placeholder="Ex: Necessidade de exame específico..." 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={() => { 
              onConfirm(destino, motivo); 
              onOpenChange(false); 
              setDestino('');
              setMotivo('');
            }} 
            disabled={!destino.trim() || !motivo.trim()}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
