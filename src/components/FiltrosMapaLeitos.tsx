
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
import { ESPECIALIDADES_MEDICAS } from '@/lib/constants';

interface FiltrosMapaLeitosProps {
  setores: Setor[];
  filtrosAvancados: {
    especialidade: string;
    setor: string;
    sexo: string;
    status: string;
    provavelAlta: string;
    aguardaUTI: string;
    pcp: string;
    altaNoLeito: string;
    solicitacaoRemanejamento: string;
    isolamentos: string[];
  };
  setFiltrosAvancados: (filtros: any) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  resetFiltros: () => void;
  todosStatus: string[];
}

export const FiltrosMapaLeitos = ({
  setores,
  filtrosAvancados,
  setFiltrosAvancados,
  searchTerm,
  setSearchTerm,
  resetFiltros,
  todosStatus
}: FiltrosMapaLeitosProps) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { isolamentos: tiposDeIsolamento } = useIsolamentos();

  if (!filtrosAvancados) {
    return null; 
  }

  const handleMultiSelectChange = (id: string) => {
    const currentIsolamentos = filtrosAvancados.isolamentos || [];
    const isSelected = currentIsolamentos.includes(id);

    if (isSelected) {
      setFiltrosAvancados({ ...filtrosAvancados, isolamentos: currentIsolamentos.filter(isoId => isoId !== id) });
    } else {
      setFiltrosAvancados({ ...filtrosAvancados, isolamentos: [...currentIsolamentos, id] });
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
              <Select value={filtrosAvancados.especialidade} onValueChange={(v) => setFiltrosAvancados({...filtrosAvancados, especialidade: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Especialidade" />
                </SelectTrigger>
                <SelectContent>
                  {ESPECIALIDADES_MEDICAS.map(e => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filtrosAvancados.setor} onValueChange={(v) => setFiltrosAvancados({...filtrosAvancados, setor: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map(s => (
                    <SelectItem key={s.id} value={s.id!}>{s.nomeSetor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filtrosAvancados.sexo} onValueChange={(v) => setFiltrosAvancados({...filtrosAvancados, sexo: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filtrosAvancados.status} onValueChange={(v) => setFiltrosAvancados({...filtrosAvancados, status: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Status do Leito" />
                </SelectTrigger>
                <SelectContent>
                  {todosStatus.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtrosAvancados.provavelAlta} onValueChange={(v) => setFiltrosAvancados({...filtrosAvancados, provavelAlta: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Alta Provável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtrosAvancados.aguardaUTI} onValueChange={(v) => setFiltrosAvancados({...filtrosAvancados, aguardaUTI: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Aguardando UTI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtrosAvancados.pcp} onValueChange={(v) => setFiltrosAvancados({...filtrosAvancados, pcp: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Leito PCP?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtrosAvancados.altaNoLeito} onValueChange={(v) => setFiltrosAvancados({...filtrosAvancados, altaNoLeito: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Alta no Leito?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtrosAvancados.solicitacaoRemanejamento} onValueChange={(v) => setFiltrosAvancados({...filtrosAvancados, solicitacaoRemanejamento: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Solicitação de Remanejamento?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
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
                    {filtrosAvancados.isolamentos.length > 0
                      ? `${filtrosAvancados.isolamentos.length} selecionado(s)`
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
                                filtrosAvancados.isolamentos.includes(iso.id!)
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
