
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SlidersHorizontal, X } from 'lucide-react';

// Lista de especialidades atualizada
const especialidades = [
  "CIRURGIA CABECA E PESCOCO", "CIRURGIA GERAL", "CIRURGIA TORACICA",
  "CIRURGIA VASCULAR", "CLINICA GERAL", "HEMATOLOGIA", "INTENSIVISTA",
  "NEFROLOGIA", "NEUROCIRURGIA", "NEUROLOGIA", "ODONTOLOGIA C.TRAUM.B.M.F.",
  "ONCOLOGIA CIRURGICA", "ONCOLOGIA CLINICA/CANCEROLOGIA",
  "ORTOPEDIA/TRAUMATOLOGIA", "PROCTOLOGIA", "UROLOGIA"
];

interface FiltrosRegulacaoProps {
    filtros: {
        especialidade: string;
        sexo: string;
        idadeMin: string;
        idadeMax: string;
        tempoInternacaoMin: string;
        tempoInternacaoMax: string;
        unidadeTempo: string;
    };
    setFiltros: (filtros: any) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    resetFiltros: () => void;
}

export const FiltrosRegulacao = ({ filtros, setFiltros, searchTerm, setSearchTerm, resetFiltros }: FiltrosRegulacaoProps) => {
    return (
        <div className="p-4 border rounded-lg bg-card mb-6">
            <Input 
                placeholder="Pesquisar por nome do paciente..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <Collapsible>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="text-sm mt-2">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Filtros Avançados
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Select value={filtros.especialidade} onValueChange={(v) => setFiltros({...filtros, especialidade: v})}>
                            <SelectTrigger><SelectValue placeholder="Especialidade" /></SelectTrigger>
                            <SelectContent>
                                {especialidades.map(e => (
                                    <SelectItem key={e} value={e}>{e}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filtros.sexo} onValueChange={(v) => setFiltros({...filtros, sexo: v})}>
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
                                    value={filtros.idadeMin} 
                                    onChange={e => setFiltros({...filtros, idadeMin: e.target.value})} 
                                />
                                <Input 
                                    type="number" 
                                    placeholder="Max" 
                                    value={filtros.idadeMax} 
                                    onChange={e => setFiltros({...filtros, idadeMax: e.target.value})} 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Tempo de Internação</label>
                            <div className="flex gap-2">
                                <Input 
                                    type="number" 
                                    placeholder="Min" 
                                    value={filtros.tempoInternacaoMin} 
                                    onChange={e => setFiltros({...filtros, tempoInternacaoMin: e.target.value})} 
                                />
                                <Input 
                                    type="number" 
                                    placeholder="Max" 
                                    value={filtros.tempoInternacaoMax} 
                                    onChange={e => setFiltros({...filtros, tempoInternacaoMax: e.target.value})} 
                                />
                            </div>
                        </div>
                        <Select value={filtros.unidadeTempo} onValueChange={v => setFiltros({...filtros, unidadeTempo: v})}>
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
        </div>
    );
};
