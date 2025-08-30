import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { DetalhesRemanejamento, TipoRemanejamento } from '@/types/hospital';

interface RemanejamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (detalhes: DetalhesRemanejamento) => void;
}

const options: { value: TipoRemanejamento; label: string }[] = [
  { value: 'priorizacao', label: 'Pedido de Priorização' },
  { value: 'adequacao_perfil', label: 'Adequação de Perfil Clínico' },
  { value: 'melhoria_assistencia', label: 'Melhoria na Assistência' },
  { value: 'contra_fluxo', label: 'Contra-fluxo' },
  { value: 'liberado_isolamento', label: 'Liberado de Isolamento' },
  { value: 'reserva_oncologia', label: 'Reserva para Oncologia' },
  { value: 'alta_uti', label: 'Alta da UTI' },
];

export const RemanejamentoModal = ({ open, onOpenChange, onConfirm }: RemanejamentoModalProps) => {
  const [tipo, setTipo] = useState<TipoRemanejamento>('priorizacao');
  const [justificativa, setJustificativa] = useState('');
  const isValid = () => {
    const precisaJustificativa = [
      'priorizacao',
      'melhoria_assistencia',
      'adequacao_perfil',
      'contra_fluxo',
    ].includes(tipo);

    if (precisaJustificativa) {
      return justificativa.trim().length > 0;
    }

    return true;
  };

  const handleConfirm = () => {
    const precisaJustificativa = [
      'priorizacao',
      'melhoria_assistencia',
      'adequacao_perfil',
      'contra_fluxo',
    ].includes(tipo);

    const detalhes: DetalhesRemanejamento = { tipo };
    if (precisaJustificativa) {
      detalhes.justificativa = justificativa;
    }

    onConfirm(detalhes);
    onOpenChange(false);
    setTipo('priorizacao');
    setJustificativa('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar Remanejamento</DialogTitle>
          <DialogDescription>
            Selecione o motivo e preencha as informações necessárias.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as TipoRemanejamento)}>
            {options.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={opt.value} />
                <Label htmlFor={opt.value}>{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>

          {['priorizacao', 'melhoria_assistencia', 'adequacao_perfil', 'contra_fluxo'].includes(tipo) && (
            <div className="space-y-2">
              <Label htmlFor="justificativa">
                {tipo === 'priorizacao'
                  ? 'Quem solicitou e o motivo'
                  : tipo === 'melhoria_assistencia'
                  ? 'Justificativa clínica'
                  : 'Justificativa'}
              </Label>
              <Textarea
                id="justificativa"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid()}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
