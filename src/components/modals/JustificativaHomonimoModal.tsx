import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

interface JustificativaHomonimoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (justificativa: string) => void;
  pacienteNome: string;
  leitoCodigo: string;
}

export const JustificativaHomonimoModal = ({
  open,
  onOpenChange,
  onConfirm,
  pacienteNome,
  leitoCodigo,
}: JustificativaHomonimoModalProps) => {
  const [justificativa, setJustificativa] = useState('');

  const handleConfirm = () => {
    onConfirm(justificativa);
    setJustificativa('');
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) setJustificativa('');
    onOpenChange(o);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Justificativa Obrigatória</AlertDialogTitle>
          <AlertDialogDescription>
            Você está regulando "{pacienteNome}" para o leito {leitoCodigo}, que já contém um paciente homônimo. Por favor,
            justifique o motivo para prosseguir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={justificativa}
          onChange={e => setJustificativa(e.target.value)}
          placeholder="Descreva a justificativa..."
          className="mt-4"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!justificativa.trim()}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
