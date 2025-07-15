
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSetores } from '@/hooks/useSetores';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: any;
}

export const GerenciarTransferenciaModal = ({ open, onOpenChange, paciente }: Props) => {
  const { adicionarRegistroTransferencia, concluirTransferenciaExterna, cancelarTransferencia } = useSetores();
  const [novaEtapa, setNovaEtapa] = useState('');

  if (!paciente) return null;

  const handleAddEtapa = async () => {
    if (novaEtapa.trim()) {
      await adicionarRegistroTransferencia(paciente.setorId, paciente.leitoId, novaEtapa);
      setNovaEtapa('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Transferência de: {paciente.nomePaciente}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Registrar Nova Etapa:</label>
            <div className="flex gap-2 mt-1">
              <Input 
                value={novaEtapa} 
                onChange={e => setNovaEtapa(e.target.value)} 
                placeholder="Ex: Aguardando ambulância..." 
              />
              <Button onClick={handleAddEtapa} disabled={!novaEtapa.trim()}>
                Salvar
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Histórico:</p>
            <ScrollArea className="h-48 border rounded-md p-2">
              {paciente.historicoTransferencia?.length > 0 ? (
                paciente.historicoTransferencia.map((item: any, index: number) => (
                  <p key={index} className="text-sm border-b pb-1 mb-1">
                    <strong>{new Date(item.data).toLocaleString('pt-BR')}:</strong> {item.etapa}
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum registro de etapa.
                </p>
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Cancelar Transferência</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Cancelamento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação removerá o paciente da fila de transferência e apagará todo o histórico. Deseja continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { 
                  cancelarTransferencia(paciente.setorId, paciente.leitoId); 
                  onOpenChange(false); 
                }}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">Concluir Transferência</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Conclusão?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação finalizará a transferência e liberará o leito para higienização. Deseja continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { 
                  concluirTransferenciaExterna(paciente.setorId, paciente.leitoId); 
                  onOpenChange(false); 
                }}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
