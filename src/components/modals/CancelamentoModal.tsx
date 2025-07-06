
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Função para calcular idade
const calcularIdade = (dataNascimento: string): string => {
  if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return '?';
  const [dia, mes, ano] = dataNascimento.split('/').map(Number);
  const hoje = new Date();
  const nascimento = new Date(ano, mes - 1, dia);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade.toString();
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motivo: string) => void;
  paciente?: any;
}

export const CancelamentoModal = ({ open, onOpenChange, onConfirm, paciente }: Props) => {
  const [motivo, setMotivo] = useState('');

  const handleConfirm = () => {
    onConfirm(motivo);
    setMotivo('');
  };

  const getMensagemCancelamento = () => {
    if (!paciente) return "";
    const idade = calcularIdade(paciente.dataNascimento);
    return `⚠️ CANCELAMENTO DE REGULAÇÃO ⚠️
Paciente: ${paciente.nomePaciente} - ${paciente.sexoPaciente} - ${idade} anos
Origem: ${paciente.setorOrigem} - ${paciente.leitoCodigo}
Destino Cancelado: ${paciente.regulacao?.paraSetorSigla || 'N/A'} - ${paciente.regulacao?.paraLeito || 'N/A'}
Motivo do Cancelamento: ${motivo || '(preencha o motivo abaixo)'}

Data e hora do cancelamento: ${new Date().toLocaleString('pt-BR')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Regulação</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/50 rounded-lg border border-red-200 font-mono text-xs whitespace-pre-wrap">
            {getMensagemCancelamento()}
          </div>
          <div>
            <Label htmlFor="motivo-cancelamento">Motivo do Cancelamento</Label>
            <Textarea 
              id="motivo-cancelamento" 
              value={motivo} 
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo do cancelamento..."
              className="mt-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!motivo.trim()}>
            Confirmar Cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
