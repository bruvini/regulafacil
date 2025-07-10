
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useSetores } from '@/hooks/useSetores';
import { useIsolamentos } from '@/hooks/useIsolamentos';
import { UserPlus, ArrowRight, Search } from 'lucide-react';

interface GerenciarPacientesIsolamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GerenciarPacientesIsolamentoModal = ({ open, onOpenChange }: GerenciarPacientesIsolamentoModalProps) => {
  const [busca, setBusca] = useState('');
  const [setorFiltro, setSetorFiltro] = useState<string>('todos');
  const [etapa, setEtapa] = useState<'lista' | 'isolamentos'>('lista');
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  const [isolamentosSelecionados, setIsolamentosSelecionados] = useState<string[]>([]);
  const [datasIsolamentos, setDatasIsolamentos] = useState<Record<string, string>>({});
  const [buscaIsolamento, setBuscaIsolamento] = useState('');

  const { setores, adicionarIsolamentoPaciente } = useSetores();
  const { isolamentos } = useIsolamentos();

  // Pacientes ocupando leitos sem isolamentos vigentes
  const pacientesDisponiveis = setores
    .flatMap(setor => 
      setor.leitos
        .filter(leito => 
          leito.statusLeito === 'Ocupado' && 
          leito.dadosPaciente &&
          (!leito.dadosPaciente.isolamentosVigentes || leito.dadosPaciente.isolamentosVigentes.length === 0)
        )
        .map(leito => ({
          ...leito.dadosPaciente!,
          setorNome: setor.nomeSetor,
          setorId: setor.id,
          leitoId: leito.id,
          leitoCodigo: leito.codigoLeito
        }))
    )
    .filter(paciente => {
      const matchBusca = paciente.nomePaciente.toLowerCase().includes(busca.toLowerCase());
      const matchSetor = setorFiltro === 'todos' || paciente.setorNome === setorFiltro;
      return matchBusca && matchSetor;
    });

  // Filtrar isolamentos com base na busca
  const isolamentosFiltrados = isolamentos.filter(iso => 
    iso.nomeMicroorganismo.toLowerCase().includes(buscaIsolamento.toLowerCase()) ||
    iso.sigla.toLowerCase().includes(buscaIsolamento.toLowerCase())
  );

  const handleAdicionarVigilancia = (paciente: any) => {
    setPacienteSelecionado(paciente);
    setEtapa('isolamentos');
  };

  const handleConfirmarIsolamentos = async () => {
    if (!pacienteSelecionado || isolamentosSelecionados.length === 0) return;

    // Verificar se todos os isolamentos selecionados têm data preenchida
    const temDatasCompletas = isolamentosSelecionados.every(isolamentoId => 
      datasIsolamentos[isolamentoId] && datasIsolamentos[isolamentoId].trim() !== ''
    );

    if (!temDatasCompletas) return;

    for (const isolamentoId of isolamentosSelecionados) {
      const tipoIsolamento = isolamentos.find(t => t.id === isolamentoId);
      if (tipoIsolamento) {
        const novoIsolamento = {
          isolamentoId,
          sigla: tipoIsolamento.sigla,
          dataInicioVigilancia: datasIsolamentos[isolamentoId],
          regrasCumpridas: []
        };
        
        await adicionarIsolamentoPaciente(pacienteSelecionado.setorId, pacienteSelecionado.leitoId, novoIsolamento);
      }
    }

    // Reset do modal
    setEtapa('lista');
    setPacienteSelecionado(null);
    setIsolamentosSelecionados([]);
    setDatasIsolamentos({});
    setBuscaIsolamento('');
    onOpenChange(false);
  };

  const voltarParaLista = () => {
    setEtapa('lista');
    setPacienteSelecionado(null);
    setIsolamentosSelecionados([]);
    setDatasIsolamentos({});
    setBuscaIsolamento('');
  };

  const handleIsolamentoToggle = (isolamentoId: string, checked: boolean) => {
    if (checked) {
      setIsolamentosSelecionados([...isolamentosSelecionados, isolamentoId]);
    } else {
      setIsolamentosSelecionados(isolamentosSelecionados.filter(id => id !== isolamentoId));
      // Remove a data quando desmarca o isolamento
      const novasDatas = { ...datasIsolamentos };
      delete novasDatas[isolamentoId];
      setDatasIsolamentos(novasDatas);
    }
  };

  const handleDataChange = (isolamentoId: string, data: string) => {
    setDatasIsolamentos(prev => ({
      ...prev,
      [isolamentoId]: data
    }));
  };

  // Verificar se todos os isolamentos selecionados têm data preenchida
  const todasDatasPreenchidas = isolamentosSelecionados.length > 0 && 
    isolamentosSelecionados.every(isolamentoId => 
      datasIsolamentos[isolamentoId] && datasIsolamentos[isolamentoId].trim() !== ''
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {etapa === 'lista' ? 'Gerenciar Pacientes em Vigilância' : `Adicionar Isolamento - ${pacienteSelecionado?.nomePaciente}`}
          </DialogTitle>
          <DialogDescription>
            {etapa === 'lista' 
              ? 'Selecione pacientes para iniciar vigilância de isolamento'
              : 'Selecione os tipos de isolamento e defina a data de início para cada um'
            }
          </DialogDescription>
        </DialogHeader>

        {etapa === 'lista' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Buscar paciente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <Select value={setorFiltro} onValueChange={setSetorFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os setores</SelectItem>
                  {setores.map(setor => (
                    <SelectItem key={setor.id} value={setor.nomeSetor}>
                      {setor.nomeSetor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {pacientesDisponiveis.map(paciente => (
                  <Card key={`${paciente.setorId}-${paciente.leitoId}`} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{paciente.nomePaciente}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{paciente.sexoPaciente.charAt(0)}</Badge>
                          <span>{paciente.setorNome}</span>
                          <span>•</span>
                          <span>Leito {paciente.leitoCodigo}</span>
                          <span>•</span>
                          <span>{paciente.especialidadePaciente}</span>
                        </div>
                      </div>
                      <Button onClick={() => handleAdicionarVigilancia(paciente)}>
                        Adicionar Vigilância
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
                {pacientesDisponiveis.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum paciente encontrado para os critérios de busca.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar isolamento por nome ou sigla..."
                value={buscaIsolamento}
                onChange={(e) => setBuscaIsolamento(e.target.value)}
                className="pl-10"
              />
            </div>

            <div>
              <Label>Tipos de Isolamento</Label>
              <ScrollArea className="h-48 border rounded-md p-4 mt-2">
                <div className="space-y-4">
                  {isolamentosFiltrados.map(tipo => (
                    <div key={tipo.id} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={tipo.id}
                          checked={isolamentosSelecionados.includes(tipo.id!)}
                          onCheckedChange={(checked) => handleIsolamentoToggle(tipo.id!, !!checked)}
                        />
                        <Label htmlFor={tipo.id} className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: tipo.cor }}
                          />
                          <span className="font-medium">{tipo.sigla}</span>
                          <span className="text-sm text-muted-foreground">
                            {tipo.nomeMicroorganismo}
                          </span>
                        </Label>
                      </div>
                      
                      {isolamentosSelecionados.includes(tipo.id!) && (
                        <div className="ml-6 mt-2">
                          <Label htmlFor={`data-${tipo.id}`} className="text-sm">
                            Data de Início da Vigilância
                          </Label>
                          <Input
                            id={`data-${tipo.id}`}
                            type="date"
                            value={datasIsolamentos[tipo.id!] || ''}
                            onChange={(e) => handleDataChange(tipo.id!, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  {isolamentosFiltrados.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum isolamento encontrado para a busca.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={voltarParaLista}>
                Voltar
              </Button>
              <Button 
                onClick={handleConfirmarIsolamentos}
                disabled={!todasDatasPreenchidas}
              >
                Confirmar Vigilância
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
