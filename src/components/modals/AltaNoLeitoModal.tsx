import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNome: string;
  onConfirm: (pendencia: string) => void;
}

export const AltaNoLeitoModal = ({ open, onOpenChange, pacienteNome, onConfirm }: Props) => {
  const [tipo, setTipo] = useState<'medicacao' | 'transporte' | 'familiar' | 'emad' | 'outros'>('medicacao');
  const [detalhe, setDetalhe] = useState('');

  const resetar = () => {
    setTipo('medicacao');
    setDetalhe('');
  };

  const handleConfirm = () => {
    let pendencia = '';
    switch (tipo) {
      case 'medicacao':
        pendencia = `Finalizando medicação${detalhe ? ` às ${detalhe}` : ''}`;
        break;
      case 'transporte':
        pendencia = `Aguardando transporte${detalhe ? ` de ${detalhe}` : ''}`;
        break;
      case 'familiar':
        pendencia = 'Aguardando Familiar';
        break;
      case 'emad':
        pendencia = 'Aguardando EMAD';
        break;
      case 'outros':
        pendencia = detalhe;
        break;
    }

    onConfirm(pendencia);
    resetar();
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetar();
    onOpenChange(false);
  };

  const confirmDisabled = () => {
    if (tipo === 'medicacao' && !detalhe) return true;
    if (tipo === 'transporte' && !detalhe.trim()) return true;
    if (tipo === 'outros' && !detalhe.trim()) return true;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-medical-primary">
            Alta no Leito - {pacienteNome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup
            value={tipo}
            onValueChange={(v) => {
              setTipo(v as 'medicacao' | 'transporte' | 'familiar' | 'emad' | 'outros');
              setDetalhe('');
            }}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medicacao" id="medicacao" />
              <Label htmlFor="medicacao">Finalizando Medicação</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="transporte" id="transporte" />
              <Label htmlFor="transporte">Aguardando Transporte</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="familiar" id="familiar" />
              <Label htmlFor="familiar">Aguardando Familiar</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="emad" id="emad" />
              <Label htmlFor="emad">Aguardando EMAD</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="outros" id="outros" />
              <Label htmlFor="outros">Outros</Label>
            </div>
          </RadioGroup>

          {tipo === 'medicacao' && (
            <div className="space-y-2">
              <Label htmlFor="horaMedicacao">Horário da Medicação</Label>
              <Input
                id="horaMedicacao"
                type="time"
                value={detalhe}
                onChange={(e) => setDetalhe(e.target.value)}
              />
            </div>
          )}
          {tipo === 'transporte' && (
            <div className="space-y-2">
              <Label htmlFor="municipio">Município</Label>
              <Input
                id="municipio"
                placeholder="Município..."
                value={detalhe}
                onChange={(e) => setDetalhe(e.target.value)}
              />
            </div>
          )}
          {tipo === 'outros' && (
            <div className="space-y-2">
              <Label htmlFor="detalhe">Detalhe</Label>
              <Textarea id="detalhe" value={detalhe} onChange={(e) => setDetalhe(e.target.value)} />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={confirmDisabled()}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

