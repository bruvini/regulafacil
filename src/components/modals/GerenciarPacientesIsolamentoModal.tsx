
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
import { UserPlus, ArrowRight } from 'lucide-react';

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
  const [dataInicio, setDataInicio] = useState('');

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

  const handleAdicionarVigilancia = (paciente: any) => {
    setPacienteSelecionado(paciente);
    setEtapa('isolamentos');
  };

  const handleConfirmarIsolamentos = async () => {
    if (!pacienteSelecionado || isolamentosSelecionados.length === 0 || !dataInicio) return;

    for (const isolamentoId of isolamentosSelecionados) {
      const tipoIsolamento = isolamentos.find(t => t.id === isolamentoId);
      if (tipoIsolamento) {
        const novoIsolamento = {
          isolamentoId,
          sigla: tipoIsolamento.sigla,
          dataInicioVigilancia: dataInicio,
          regrasCumpridas: []
        };
        
        await adicionarIsolamentoPaciente(pacienteSelecionado.setorId, pacienteSelecionado.leitoId, novoIsolamento);
      }
    }

    // Reset do modal
    setEtapa('lista');
    setPacienteSelecionado(null);
    setIsolamentosSelecionados([]);
    setDataInicio('');
    onOpenChange(false);
  };

  const voltarParaLista = () => {
    setEtapa('lista');
    setPacienteSelecionado(null);
    setIsolamentosSelecionados([]);
    setDataInicio('');
  };

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
              : 'Selecione os tipos de isolamento e defina a data de início'
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
            <div>
              <Label htmlFor="data-inicio">Data de Início da Vigilância</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div>
              <Label>Tipos de Isolamento</Label>
              <ScrollArea className="h-48 border rounded-md p-4 mt-2">
                <div className="space-y-3">
                  {isolamentos.map(tipo => (
                    <div key={tipo.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={tipo.id}
                        checked={isolamentosSelecionados.includes(tipo.id!)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setIsolamentosSelecionados([...isolamentosSelecionados, tipo.id!]);
                          } else {
                            setIsolamentosSelecionados(isolamentosSelecionados.filter(id => id !== tipo.id));
                          }
                        }}
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
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={voltarParaLista}>
                Voltar
              </Button>
              <Button 
                onClick={handleConfirmarIsolamentos}
                disabled={isolamentosSelecionados.length === 0 || !dataInicio}
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
