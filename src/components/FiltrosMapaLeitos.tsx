
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SlidersHorizontal, X } from 'lucide-react';
import { useIsolamentos } from '@/hooks/useIsolamentos';
import { Setor } from '@/types/hospital';

interface FiltrosMapaLeitosProps {
  setores: Setor[];
  filtros: {
    especialidade: string;
    setor: string;
    sexo: string;
    status: string;
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
  filtros, 
  setFiltros, 
  searchTerm, 
  setSearchTerm, 
  resetFiltros, 
  especialidades, 
  todosStatus 
}: FiltrosMapaLeitosProps) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { isolamentos: tiposDeIsolamento } = useIsolamentos();

  const handleMultiSelectChange = (id: string, checked: boolean) => {
    const currentIsolamentos = filtros.isolamentos || [];
    if (checked) {
      setFiltros({ ...filtros, isolamentos: [...currentIsolamentos, id] });
    } else {
      setFiltros({ ...filtros, isolamentos: currentIsolamentos.filter(isoId => isoId !== id) });
    }
  };

  return (
    <Card className="shadow-card border border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-medical-primary">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
          placeholder="Pesquisar por paciente ou leito..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
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
            </div>
            
            <div>
              <Label>Isolamento</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {tiposDeIsolamento.map(iso => (
                  <div key={iso.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={iso.id} 
                      checked={filtros.isolamentos.includes(iso.id!)} 
                      onCheckedChange={(c) => handleMultiSelectChange(iso.id!, !!c)} 
                    />
                    <Label htmlFor={iso.id} className="text-sm font-normal">{iso.sigla}</Label>
                  </div>
                ))}
              </div>
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
