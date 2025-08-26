import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paciente } from '@/types/hospital';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientes: Paciente[];
  existentes: string[]; // ids já presentes no Kanban
  onSelect: (paciente: Paciente) => void;
}

export const AdicionarPacienteModal = ({ open, onOpenChange, pacientes, existentes, onSelect }: Props) => {
  const [busca, setBusca] = useState('');

  const resultados = useMemo(() => {
    const termo = busca.toUpperCase();
    return pacientes.filter(p =>
      p.nomeCompleto.toUpperCase().includes(termo) && !existentes.includes(p.id)
    );
  }, [busca, pacientes, existentes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Paciente</DialogTitle>
        </DialogHeader>
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar pelo nome"
          className="mb-4"
        />
        <div className="max-h-64 overflow-auto space-y-2">
          {resultados.map(p => (
            <Button
              key={p.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                onSelect(p);
                setBusca('');
                onOpenChange(false);
              }}
            >
              {p.nomeCompleto}
            </Button>
          ))}
          {resultados.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum paciente encontrado</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
