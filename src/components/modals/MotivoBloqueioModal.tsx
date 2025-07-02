
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface MotivoBloqueioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motivo: string) => void;
  leitoCodigoLeito: string;
}

const MotivoBloqueioModal = ({ open, onOpenChange, onConfirm, leitoCodigoLeito }: MotivoBloqueioModalProps) => {
  const [motivo, setMotivo] = useState('');

  const handleConfirm = () => {
    if (motivo.trim()) {
      onConfirm(motivo.trim());
      setMotivo('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setMotivo('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-medical-primary">
            Motivo do Bloqueio - {leitoCodigoLeito}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">Informe o motivo do bloqueio:</Label>
            <Textarea
              id="motivo"
              placeholder="Ex: Manutenção preventiva, limpeza profunda, aguardando reparo..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            variant="medical" 
            onClick={handleConfirm}
            disabled={!motivo.trim()}
          >
            Confirmar Bloqueio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MotivoBloqueioModal;
