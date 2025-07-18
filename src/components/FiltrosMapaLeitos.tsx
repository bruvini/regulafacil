// src/components/FiltrosMapaLeitos.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { SlidersHorizontal, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsolamentos } from '@/hooks/useIsolamentos';
import { Setor } from '@/types/hospital';

interface FiltrosMapaLeitosProps {
  setores: Setor[];
  filtros: {
    especialidade: string;
    setor: string;
    sexo: string;
    status: string;
    provavelAlta: string;
    aguardaUTI: string;
    isolamentos: string[];
  };
  setFiltros: (filtros: any) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  resetFiltros: () => void;
  especialidades: string[];
  todosStatus: string[];
}

export const FiltrosMapaLeitos = ({ 
  setores, 
  // CORREÇÃO: Adicionado um objeto padrão para a prop 'filtros'
  filtros = { especialidade: '', setor: '', sexo: '', status: '', provavelAlta: '', aguardaUTI: '', isolamentos: [] }, 
  setFiltros, 
  searchTerm, 
  setSearchTerm, 
  resetFiltros, 
  especialidades, 
  todosStatus 
}: FiltrosMapaLeitosProps) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { isolamentos: tiposDeIsolamento } = useIsolamentos();

  // CORREÇÃO: Camada extra de segurança para evitar renderização sem os filtros
  if (!filtros) {
    return null; 
  }

  const handleMultiSelectChange = (id: string) => {
    const currentIsolamentos = filtros.isolamentos || [];
    const isSelected = currentIsolamentos.includes(id);

    if (isSelected) {
      setFiltros({ ...filtros, isolamentos: currentIsolamentos.filter(isoId => isoId !== id) });
    } else {
      setFiltros({ ...filtros, isolamentos: [...currentIsolamentos, id] });
    }
  };

  return (
    <Card className="shadow-card border border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-medical-primary">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input 
            placeholder="Pesquisar por paciente ou leito..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-8"
          />
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="text-sm">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filtros Avançados
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 p-4 border rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select value={filtros.especialidade} onValueChange={(v) => setFiltros({...filtros, especialidade: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Especialidade" />
                </SelectTrigger>
                <SelectContent>
                  {especialidades.map(e => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filtros.setor} onValueChange={(v) => setFiltros({...filtros, setor: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map(s => (
                    <SelectItem key={s.id} value={s.id!}>{s.nomeSetor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filtros.sexo} onValueChange={(v) => setFiltros({...filtros, sexo: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filtros.status} onValueChange={(v) => setFiltros({...filtros, status: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Status do Leito" />
                </SelectTrigger>
                <SelectContent>
                  {todosStatus.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtros.provavelAlta} onValueChange={(v) => setFiltros({...filtros, provavelAlta: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Alta Provável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtros.aguardaUTI} onValueChange={(v) => setFiltros({...filtros, aguardaUTI: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Aguardando UTI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="lg:col-span-3">
              <Label>Isolamento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal mt-2">
                    {filtros.isolamentos.length > 0
                      ? `${filtros.isolamentos.length} selecionado(s)`
                      : "Selecione um ou mais isolamentos"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar isolamento..." />
                    <CommandList>
                      <CommandEmpty>Nenhum isolamento encontrado.</CommandEmpty>
                      <CommandGroup>
                        {tiposDeIsolamento.map(iso => (
                          <CommandItem
                            key={iso.id}
                            value={iso.nomeMicroorganismo}
                            onSelect={() => handleMultiSelectChange(iso.id!)}
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                filtros.isolamentos.includes(iso.id!)
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}
                            >
                              <Check className={cn("h-4 w-4")} />
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
            </div>
            
            <Button variant="outline" size="sm" onClick={resetFiltros}>
              <X className="mr-2 h-4 w-4"/>
              Limpar Filtros
            </Button>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};