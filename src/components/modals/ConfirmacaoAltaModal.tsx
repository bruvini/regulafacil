
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmacaoAltaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: any;
  onConfirmar: () => void;
}

export const ConfirmacaoAltaModal = ({
  open,
  onOpenChange,
  paciente,
  onConfirmar,
}: ConfirmacaoAltaModalProps) => {
  if (!paciente) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Alta</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem certeza que deseja dar alta para{' '}
            <strong>{paciente.nomeCompleto}</strong>?
            <br />
            <br />
            Esta ação irá remover o paciente do sistema e liberar o leito{' '}
            <strong>{paciente.leitoCodigo}</strong> para higienização.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmar}
            className="bg-medical-danger hover:bg-medical-danger/90"
          >
            Confirmar Alta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
