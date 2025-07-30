
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Observacao } from '@/types/observacao';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNome: string;
  observacoes: Observacao[];
  onConfirm: (novaObservacao: string) => void;
  onDelete: (observacaoId: string) => void;
}

export const ObservacoesAprimoradaModal = ({ 
  open, 
  onOpenChange, 
  pacienteNome, 
  observacoes, 
  onConfirm, 
  onDelete 
}: Props) => {
  const [novaObs, setNovaObs] = useState('');

  const handleConfirm = () => {
    if (novaObs.trim()) {
      onConfirm(novaObs.trim());
      setNovaObs('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Observações: {pacienteNome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="font-medium text-sm">Histórico:</p>
            <ScrollArea className="h-60 border rounded-md p-4">
              {observacoes?.length > 0 ? (
                <div className="space-y-3">
                  {observacoes.map((obs) => (
                    <div key={obs.id} className="border-b pb-3 last:border-b-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm">{obs.texto}</p>
                          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{format(new Date(obs.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                            <span>{obs.usuario}</span>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Observação</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta observação? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onDelete(obs.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma observação registrada.
                </p>
              )}
            </ScrollArea>
          </div>
          <div className="flex gap-2">
            <Input 
              value={novaObs} 
              onChange={e => setNovaObs(e.target.value)} 
              placeholder="Adicionar nova observação..." 
            />
            <Button onClick={handleConfirm} disabled={!novaObs.trim()}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
