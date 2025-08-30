import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ReservaOncologia, TentativaContato } from '@/types/reservaOncologia';
import { LeitoEnriquecido } from '@/types/hospital';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: ReservaOncologia | null;
  leitos: LeitoEnriquecido[];
  registrarTentativa: (id: string, tentativa: TentativaContato) => Promise<void>;
  onConfirmarReserva: (paciente: ReservaOncologia, leito: LeitoEnriquecido) => Promise<void>;
  onMarcarInternado: (id: string) => Promise<void>;
}

const motivosFalha = [
  'CAIXA POSTAL',
  'NÃO RESPONDEU',
  'SINTOMAS RESPIRATÓRIOS',
  'RECUSA PARA INTERNAÇÃO',
  'ÓBITO',
  'SEM MEDICAÇÃO',
  'JÁ INTERNADO',
] as const;

export const ContatoReservaModal = ({
  open,
  onOpenChange,
  paciente,
  leitos,
  registrarTentativa,
  onConfirmarReserva,
  onMarcarInternado,
}: Props) => {
  const [contatoSucesso, setContatoSucesso] = useState<boolean | null>(null);
  const [motivo, setMotivo] = useState<typeof motivosFalha[number] | ''>('');
  const [leitoSelecionado, setLeitoSelecionado] = useState<string>('');

  const reset = () => {
    setContatoSucesso(null);
    setMotivo('');
    setLeitoSelecionado('');
  };

  const fechar = () => {
    reset();
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!paciente) return;
    const agora = new Date().toISOString();

    if (contatoSucesso === false) {
      await registrarTentativa(paciente.id, { data: agora, sucesso: false, motivoFalha: motivo });
      fechar();
      return;
    }

    const leito = leitos.find(l => l.id === leitoSelecionado);
    if (!leito) return;

    await registrarTentativa(paciente.id, { data: agora, sucesso: true });
    await onConfirmarReserva(paciente, leito);
    await onMarcarInternado(paciente.id);
    fechar();
  };

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contato - {paciente?.nomeCompleto}</DialogTitle>
        </DialogHeader>
        {contatoSucesso === null && (
          <div className="space-y-4 py-4">
            <p className="text-sm">Contato com sucesso?</p>
            <div className="flex justify-between">
              <Button onClick={() => setContatoSucesso(true)}>Sim</Button>
              <Button variant="destructive" onClick={() => setContatoSucesso(false)}>
                Não
              </Button>
            </div>
          </div>
        )}

        {contatoSucesso === false && (
          <div className="space-y-4 py-4">
            <Select value={motivo} onValueChange={(v) => setMotivo(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {motivosFalha.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {contatoSucesso === true && (
          <div className="space-y-4 py-4">
            <Select value={leitoSelecionado} onValueChange={setLeitoSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o leito" />
              </SelectTrigger>
              <SelectContent>
                {leitos.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.codigoLeito}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {contatoSucesso !== null && (
          <DialogFooter>
            <Button variant="outline" onClick={fechar}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={contatoSucesso === false && !motivo || contatoSucesso === true && !leitoSelecionado}>
              Confirmar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
