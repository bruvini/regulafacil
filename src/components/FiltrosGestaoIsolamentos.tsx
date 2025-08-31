import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSetores } from '@/hooks/useSetores';
import { useIsolamentos } from '@/hooks/useIsolamentos';

interface Props {
  filtros: {
    nome: string;
    setor: string;
    sexo: string;
    isolamentos: string[];
    dias: string;
  };
  setFiltros: React.Dispatch<React.SetStateAction<{
    nome: string;
    setor: string;
    sexo: string;
    isolamentos: string[];
    dias: string;
  }>>;
}

const FiltrosGestaoIsolamentos = ({ filtros, setFiltros }: Props) => {
  const { setores } = useSetores();
  const { isolamentos } = useIsolamentos();

  const handleMultiSelectChange = (id: string) => {
    const current = filtros.isolamentos;
    const isSelected = current.includes(id);
    if (isSelected) {
      setFiltros({ ...filtros, isolamentos: current.filter(isoId => isoId !== id) });
    } else {
      setFiltros({ ...filtros, isolamentos: [...current, id] });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <Input
        placeholder="Buscar por nome..."
        value={filtros.nome}
        onChange={(e) => setFiltros(prev => ({ ...prev, nome: e.target.value }))}
      />
      <Select value={filtros.setor} onValueChange={(v) => setFiltros(prev => ({ ...prev, setor: v }))}>
        <SelectTrigger>
          <SelectValue placeholder="Setor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          {setores.map(setor => (
            <SelectItem key={setor.id} value={setor.id!}>{setor.nomeSetor}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filtros.sexo} onValueChange={(v) => setFiltros(prev => ({ ...prev, sexo: v }))}>
        <SelectTrigger>
          <SelectValue placeholder="Sexo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="Masculino">Masculino</SelectItem>
          <SelectItem value="Feminino">Feminino</SelectItem>
        </SelectContent>
      </Select>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start font-normal">
            {filtros.isolamentos.length > 0 ? `${filtros.isolamentos.length} selecionado(s)` : 'Tipo de Isolamento'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar isolamento..." />
            <CommandList>
              <CommandEmpty>Nenhum isolamento encontrado.</CommandEmpty>
              <CommandGroup>
                {isolamentos.map(iso => (
                  <CommandItem
                    key={iso.id}
                    value={iso.nomeMicroorganismo}
                    onSelect={() => handleMultiSelectChange(iso.id!)}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        filtros.isolamentos.includes(iso.id!) ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <Badge style={{ backgroundColor: iso.cor, color: 'white' }} className="mr-2 text-xs border-none">{iso.sigla}</Badge>
                    <span>{iso.nomeMicroorganismo}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        type="number"
        placeholder="Tempo (dias)"
        value={filtros.dias}
        onChange={(e) => setFiltros(prev => ({ ...prev, dias: e.target.value }))}
      />
    </div>
  );
};

export default FiltrosGestaoIsolamentos;
