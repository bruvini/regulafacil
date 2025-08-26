
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
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface JustificativaHomonimoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (justificativa: string) => void;
  pacienteNome: string;
  leitoCodigo: string;
  nomesHomonimos: string[];
}

export const JustificativaHomonimoModal = ({
  open,
  onOpenChange,
  onConfirm,
  pacienteNome,
  leitoCodigo,
  nomesHomonimos
}: JustificativaHomonimoModalProps) => {
  const [justificativa, setJustificativa] = useState('');

  const handleConfirm = () => {
    if (justificativa.trim()) {
      onConfirm(justificativa.trim());
      setJustificativa('');
    }
  };

  const handleCancel = () => {
    setJustificativa('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Justificativa Obrigatória - Alerta de Homônimo
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            <div className="space-y-3">
              <p>
                Você está regulando <strong>"{pacienteNome}"</strong> para o leito{' '}
                <strong>{leitoCodigo}</strong>, que já contém paciente(s) com o mesmo primeiro nome:
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-medium text-amber-800 mb-2">Pacientes homônimos no quarto:</p>
                <ul className="list-disc list-inside text-amber-700">
                  {nomesHomonimos.map((nome, index) => (
                    <li key={index}>{nome}</li>
                  ))}
                </ul>
              </div>
              <p className="text-red-600 font-medium">
                ⚠️ Este é um risco potencial para a segurança do paciente. Por favor, justifique o motivo para prosseguir com esta regulação.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <Label htmlFor="justificativa" className="text-base font-medium">
            Justificativa para regulação com homônimo *
          </Label>
          <Textarea
            id="justificativa"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Descreva detalhadamente o motivo pelo qual esta regulação deve prosseguir mesmo com a presença de homônimo no quarto..."
            className="min-h-[120px]"
            maxLength={500}
          />
          <p className="text-sm text-muted-foreground">
            {justificativa.length}/500 caracteres
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Cancelar Regulação
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!justificativa.trim()}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Confirmar com Justificativa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
