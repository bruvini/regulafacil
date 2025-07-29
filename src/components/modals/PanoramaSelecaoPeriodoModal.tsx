
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGerarPanorama: (dataInicio: string, dataFim: string) => void;
}

export const PanoramaSelecaoPeriodoModal = ({ open, onOpenChange, onGerarPanorama }: Props) => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const handleSubmit = () => {
    if (dataInicio && dataFim) {
      onGerarPanorama(dataInicio, dataFim);
      onOpenChange(false);
    }
  };

  const agora = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Período - Panorama de Regulações</DialogTitle>
          <DialogDescription>
            Escolha o período para gerar o panorama das regulações realizadas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dataInicio">Data e Hora Inicial</Label>
            <Input
              id="dataInicio"
              type="datetime-local"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              max={agora}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataFim">Data e Hora Final</Label>
            <Input
              id="dataFim"
              type="datetime-local"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              max={agora}
              min={dataInicio}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!dataInicio || !dataFim}
          >
            Gerar Panorama
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
