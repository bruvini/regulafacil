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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSetores } from '@/hooks/useSetores';
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
  { value: 'liberado_isolamento', label: 'Liberado de Isolamento' },
];

export const RemanejamentoModal = ({ open, onOpenChange, onConfirm }: RemanejamentoModalProps) => {
  const [tipo, setTipo] = useState<TipoRemanejamento>('priorizacao');
  const [justificativa, setJustificativa] = useState('');
  const [setoresSelecionados, setSetoresSelecionados] = useState<string[]>([]);
  const { setores } = useSetores();

  const toggleSetor = (id: string) => {
    setSetoresSelecionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const isValid = () => {
    switch (tipo) {
      case 'priorizacao':
      case 'melhoria_assistencia':
        return justificativa.trim().length > 0;
      case 'adequacao_perfil':
        return setoresSelecionados.length > 0;
      default:
        return true;
    }
  };

  const handleConfirm = () => {
    const detalhes: DetalhesRemanejamento = { tipo };
    if (tipo === 'priorizacao' || tipo === 'melhoria_assistencia') {
      detalhes.justificativa = justificativa;
    }
    if (tipo === 'adequacao_perfil') {
      detalhes.setoresSugeridos = setoresSelecionados;
    }
    onConfirm(detalhes);
    onOpenChange(false);
    setTipo('priorizacao');
    setJustificativa('');
    setSetoresSelecionados([]);
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

          {tipo === 'priorizacao' && (
            <div className="space-y-2">
              <Label htmlFor="just-priorizacao">Quem solicitou e o motivo</Label>
              <Textarea
                id="just-priorizacao"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />
            </div>
          )}

          {tipo === 'melhoria_assistencia' && (
            <div className="space-y-2">
              <Label htmlFor="just-melhoria">Justificativa clínica</Label>
              <Textarea
                id="just-melhoria"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />
            </div>
          )}

          {tipo === 'adequacao_perfil' && (
            <div className="space-y-2">
              <Label>Setor(es) sugerido(s)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-normal"
                  >
                    {setoresSelecionados.length > 0
                      ? `${setoresSelecionados.length} selecionado(s)`
                      : 'Selecione o(s) setor(es)'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Buscar setor..." />
                    <CommandList>
                      <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                      <CommandGroup>
                        {setores.map((setor) => (
                          <CommandItem
                            key={setor.id}
                            value={setor.nomeSetor}
                            onSelect={() => toggleSetor(setor.id)}
                          >
                            <div
                              className={cn(
                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                setoresSelecionados.includes(setor.id)
                                  ? 'bg-primary text-primary-foreground'
                                  : 'opacity-50 [&_svg]:invisible'
                              )}
                            >
                              <Check className="h-4 w-4" />
                            </div>
                            {setor.nomeSetor}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
