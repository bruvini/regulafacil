
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsolamentos } from '@/hooks/useIsolamentos';

interface FiltrosGestaoIsolamentosProps {
  busca: string;
  setBusca: (busca: string) => void;
  filtros: {
    sexo: string;
    setor: string;
    isolamentos: string[];
  };
  setFiltros: (filtros: any) => void;
  setores: any[];
}

export const FiltrosGestaoIsolamentos = ({ 
  busca, 
  setBusca, 
  filtros, 
  setFiltros, 
  setores 
}: FiltrosGestaoIsolamentosProps) => {
  const [filtroAvancadoAberto, setFiltroAvancadoAberto] = useState(false);
  const { isolamentos } = useIsolamentos();

  const handleIsolamentoToggle = (isolamentoId: string, checked: boolean) => {
    const novosIsolamentos = checked
      ? [...filtros.isolamentos, isolamentoId]
      : filtros.isolamentos.filter(id => id !== isolamentoId);
    
    setFiltros({
      ...filtros,
      isolamentos: novosIsolamentos
    });
  };

  const limparFiltros = () => {
    setFiltros({
      sexo: '',
      setor: '',
      isolamentos: []
    });
    setBusca('');
  };

  const filtrosAtivos = [
    filtros.sexo && 'Sexo',
    filtros.setor && 'Setor',
    filtros.isolamentos.length > 0 && 'Isolamentos'
  ].filter(Boolean).length;

  return (
    <Card className="shadow-card border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
          {filtrosAtivos > 0 && (
            <Badge variant="secondary">{filtrosAtivos} ativo{filtrosAtivos > 1 ? 's' : ''}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do paciente ou número do leito..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        <Collapsible open={filtroAvancadoAberto} onOpenChange={setFiltroAvancadoAberto}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros Avançados
              </span>
              {filtroAvancadoAberto ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sexo-filter">Sexo</Label>
                <Select 
                  value={filtros.sexo} 
                  onValueChange={(value) => setFiltros({...filtros, sexo: value})}
                >
                  <SelectTrigger id="sexo-filter">
                    <SelectValue placeholder="Selecione o sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="setor-filter">Setor</Label>
                <Select 
                  value={filtros.setor} 
                  onValueChange={(value) => setFiltros({...filtros, setor: value})}
                >
                  <SelectTrigger id="setor-filter">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os setores</SelectItem>
                    {setores.map(setor => (
                      <SelectItem key={setor.id} value={setor.nomeSetor}>
                        {setor.nomeSetor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Isolamentos Ativos</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                {isolamentos.map(isolamento => (
                  <div key={isolamento.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`isolamento-${isolamento.id}`}
                      checked={filtros.isolamentos.includes(isolamento.id!)}
                      onCheckedChange={(checked) => 
                        handleIsolamentoToggle(isolamento.id!, !!checked)
                      }
                    />
                    <Label 
                      htmlFor={`isolamento-${isolamento.id}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: isolamento.cor }}
                      />
                      <span className="text-sm">{isolamento.sigla}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={limparFiltros}
                className="flex-1"
              >
                Limpar Filtros
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
