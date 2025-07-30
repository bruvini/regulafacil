
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNome: string;
  onConfirm: (pendencia: string) => void;
}

export const AltaNoLeitoModal = ({ 
  open, 
  onOpenChange, 
  pacienteNome, 
  onConfirm 
}: Props) => {
  const [pendencia, setPendencia] = useState('');

  const handleConfirm = () => {
    if (pendencia.trim()) {
      onConfirm(pendencia.trim());
      setPendencia('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alta no Leito - {pacienteNome}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pendencia">Descreva a pendência para a alta:</Label>
            <Textarea
              id="pendencia"
              value={pendencia}
              onChange={(e) => setPendencia(e.target.value)}
              placeholder="Ex: Aguardando familiar, Aguardando transporte, Realizando medicação..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!pendencia.trim()}>
            Confirmar Alta no Leito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
