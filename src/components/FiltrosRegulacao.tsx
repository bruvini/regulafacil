
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { ESPECIALIDADES_MEDICAS } from '@/lib/constants';

interface FiltrosRegulacaoProps {
    filtrosAvancados: {
        especialidade: string;
        sexo: string;
        idadeMin: string;
        idadeMax: string;
        tempoInternacaoMin: string;
        tempoInternacaoMax: string;
        unidadeTempo: string;
    };
    setFiltrosAvancados: (filtros: any) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    resetFiltros: () => void;
    sortConfig: { key: string; direction: string };
    setSortConfig: (config: { key: string; direction: string }) => void;
}

export const FiltrosRegulacao = ({ 
    filtrosAvancados, 
    setFiltrosAvancados, 
    searchTerm, 
    setSearchTerm, 
    resetFiltros, 
    sortConfig, 
    setSortConfig 
}: FiltrosRegulacaoProps) => {
    const handleSort = (key: string) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="p-4 border rounded-lg bg-card mb-6">
            <div className="relative">
              <Input 
                placeholder="Pesquisar por nome do paciente..." 
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
            <Collapsible>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="text-sm mt-2">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Filtros Avançados
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Select value={filtrosAvancados?.especialidade || ''} onValueChange={(v) => setFiltrosAvancados({...filtrosAvancados, especialidade: v})}>
                            <SelectTrigger><SelectValue placeholder="Especialidade" /></SelectTrigger>
                            <SelectContent>
                                {ESPECIALIDADES_MEDICAS.map(e => (
                                    <SelectItem key={e} value={e}>{e}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filtrosAvancados?.sexo || ''} onValueChange={(v) => setFiltrosAvancados({...filtrosAvancados, sexo: v})}>
                            <SelectTrigger><SelectValue placeholder="Sexo" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Masculino">Masculino</SelectItem>
                                <SelectItem value="Feminino">Feminino</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-xs text-muted-foreground">Idade</label>
                            <div className="flex gap-2">
                                <Input 
                                    type="number" 
                                    placeholder="Min" 
                                    value={filtrosAvancados?.idadeMin || ''} 
                                    onChange={e => setFiltrosAvancados({...filtrosAvancados, idadeMin: e.target.value})} 
                                />
                                <Input 
                                    type="number" 
                                    placeholder="Max" 
                                    value={filtrosAvancados?.idadeMax || ''} 
                                    onChange={e => setFiltrosAvancados({...filtrosAvancados, idadeMax: e.target.value})} 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Tempo de Internação</label>
                            <div className="flex gap-2">
                                <Input 
                                    type="number" 
                                    placeholder="Min" 
                                    value={filtrosAvancados?.tempoInternacaoMin || ''} 
                                    onChange={e => setFiltrosAvancados({...filtrosAvancados, tempoInternacaoMin: e.target.value})} 
                                />
                                <Input 
                                    type="number" 
                                    placeholder="Max" 
                                    value={filtrosAvancados?.tempoInternacaoMax || ''} 
                                    onChange={e => setFiltrosAvancados({...filtrosAvancados, tempoInternacaoMax: e.target.value})} 
                                />
                            </div>
                        </div>
                        <Select value={filtrosAvancados?.unidadeTempo || 'dias'} onValueChange={v => setFiltrosAvancados({...filtrosAvancados, unidadeTempo: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dias">Dias</SelectItem>
                                <SelectItem value="horas">Horas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" size="sm" onClick={resetFiltros}>
                        <X className="mr-2 h-4 w-4"/>
                        Limpar Filtros
                    </Button>
                </CollapsibleContent>
            </Collapsible>
            
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm font-medium">Ordenar por:</span>
                <Button 
                    variant={sortConfig.key === 'nome' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => handleSort('nome')}
                >
                    Nome {sortConfig.key === 'nome' && <ArrowUpDown className="h-4 w-4 ml-2" />}
                </Button>
                <Button 
                    variant={sortConfig.key === 'idade' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => handleSort('idade')}
                >
                    Idade {sortConfig.key === 'idade' && <ArrowUpDown className="h-4 w-4 ml-2" />}
                </Button>
                <Button 
                    variant={sortConfig.key === 'tempo' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => handleSort('tempo')}
                >
                    Tempo Internação {sortConfig.key === 'tempo' && <ArrowUpDown className="h-4 w-4 ml-2" />}
                </Button>
            </div>
        </div>
    );
};
