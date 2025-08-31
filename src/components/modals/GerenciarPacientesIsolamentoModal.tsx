// src/components/modals/GerenciarPacientesIsolamentoModal.tsx

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { UserPlus, ArrowRight, Search } from 'lucide-react';
import { useSetores } from '@/hooks/useSetores';
import { useLeitos } from '@/hooks/useLeitos'; // NOVO
import { usePacientes } from '@/hooks/usePacientes'; // NOVO
import { useIsolamentos } from '@/hooks/useIsolamentos';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'; // NOVO
import { db } from '@/lib/firebase'; // NOVO
import { useToast } from '@/hooks/use-toast'; // NOVO
import { Paciente } from '@/types/hospital';
import { PacienteIsolamento } from '@/types/isolamento';
import { useAuditoria } from '@/hooks/useAuditoria';

interface GerenciarPacientesIsolamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'adicionar' | 'editar';
  paciente?: Paciente;
  isolamento?: PacienteIsolamento;
}

export const GerenciarPacientesIsolamentoModal = ({ open, onOpenChange, mode = 'adicionar', paciente, isolamento }: GerenciarPacientesIsolamentoModalProps) => {
  const [busca, setBusca] = useState('');
  const [setorFiltro, setSetorFiltro] = useState<string>('todos');
  const [etapa, setEtapa] = useState<'lista' | 'isolamentos'>('lista');
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(paciente || null);
  interface DetalheIsolamento {
    id: string;
    dataInicio: string;
    status: 'suspeita' | 'confirmada';
  }
  const [isolamentosSelecionados, setIsolamentosSelecionados] = useState<Record<string, DetalheIsolamento>>({});
  const [buscaIsolamento, setBuscaIsolamento] = useState('');
  const [dataEdicao, setDataEdicao] = useState<string>(isolamento?.dataInicio || '');

  // CORREÇÃO: Usando os hooks corretos
  const { setores } = useSetores();
  const { leitos } = useLeitos();
  const { pacientes } = usePacientes();
  const { isolamentos } = useIsolamentos();
  const { toast } = useToast();
  const { registrarLog } = useAuditoria();

  useEffect(() => {
    if (mode === 'editar' && paciente) {
      setPacienteSelecionado(paciente);
      setDataEdicao(isolamento?.dataInicio || '');
    }
  }, [mode, paciente, isolamento, open]);

  // CORREÇÃO: Lógica de dados refatorada para usar as coleções separadas
  const pacientesDisponiveis = useMemo(() => {
    const mapaLeitos = new Map(leitos.map(l => [l.id, l]));
    const mapaSetores = new Map(setores.map(s => [s.id, s]));

    return pacientes
      .map(paciente => {
        const leito = mapaLeitos.get(paciente.leitoId);
        const setor = leito ? mapaSetores.get(leito.setorId) : undefined;
        return {
          ...paciente,
          setorNome: setor?.nomeSetor || 'N/A',
          leitoCodigo: leito?.codigoLeito || 'N/A',
        };
      })
      .filter(paciente => {
        const matchBusca = paciente.nomeCompleto.toLowerCase().includes(busca.toLowerCase());
        const matchSetor = setorFiltro === 'todos' || paciente.setorNome === setorFiltro;
        return matchBusca && matchSetor;
      });
  }, [pacientes, leitos, setores, busca, setorFiltro]);

  const isolamentosFiltrados = isolamentos.filter(iso => 
    iso.nomeMicroorganismo.toLowerCase().includes(buscaIsolamento.toLowerCase()) ||
    iso.sigla.toLowerCase().includes(buscaIsolamento.toLowerCase())
  );

  const handleAdicionarVigilancia = (paciente: any) => {
    setPacienteSelecionado(paciente);
    setEtapa('isolamentos');
  };
  
  // CORREÇÃO: Função de confirmação atualizada para usar updateDoc
  const handleConfirmarIsolamentos = async () => {
    if (mode === 'editar') {
      if (!pacienteSelecionado || !isolamento) return;
      try {
        const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteSelecionado.id);
        const novosIsolamentos = pacienteSelecionado.isolamentosVigentes!.map((iso: PacienteIsolamento) =>
          iso.isolamentoId === isolamento.isolamentoId ? { ...iso, dataInicio: dataEdicao } : iso
        );
        await updateDoc(pacienteRef, { isolamentosVigentes: novosIsolamentos });
        toast({ title: 'Sucesso!', description: 'Data do isolamento atualizada.' });
        registrarLog(
          'Data de isolamento alterada',
          `Paciente ${pacienteSelecionado.nomeCompleto} - isolamento ${isolamento.sigla} alterado para ${dataEdicao}`
        );
        onOpenChange(false);
      } catch (error) {
        console.error('Erro ao atualizar isolamento:', error);
        toast({ title: 'Erro', description: 'Não foi possível atualizar o isolamento.', variant: 'destructive' });
      }
      return;
    }

    if (!pacienteSelecionado || Object.keys(isolamentosSelecionados).length === 0) return;

    const temDatasCompletas = Object.values(isolamentosSelecionados).every(
      iso => iso.dataInicio && iso.dataInicio.trim() !== ''
    );

    if (!temDatasCompletas) {
      toast({ title: 'Atenção', description: 'Preencha a data de início para todos os isolamentos selecionados.', variant: 'destructive' });
      return;
    }

    const isolamentosParaAdicionar = Object.values(isolamentosSelecionados).map(det => {
      const tipoIsolamento = isolamentos.find(t => t.id === det.id);
      return {
        isolamentoId: det.id,
        sigla: tipoIsolamento!.sigla,
        dataInicio: det.dataInicio,
        status: det.status,
        regrasCumpridas: []
      };
    });

    try {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteSelecionado.id);
      await updateDoc(pacienteRef, {
        isolamentosVigentes: arrayUnion(...isolamentosParaAdicionar)
      });
      toast({ title: 'Sucesso!', description: 'Isolamentos adicionados ao paciente.' });
      registrarLog(
        'Isolamento adicionado',
        `Paciente ${pacienteSelecionado.nomeCompleto} - isolamentos ${isolamentosParaAdicionar.map(i => i.sigla).join(', ')}`
      );

      // Reset do modal
      voltarParaLista();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao adicionar isolamento:', error);
      toast({ title: 'Erro', description: 'Não foi possível adicionar os isolamentos.', variant: 'destructive' });
    }
  };


  const voltarParaLista = () => {
    setEtapa('lista');
    setPacienteSelecionado(null);
    setIsolamentosSelecionados({});
    setBuscaIsolamento('');
  };

  const handleIsolamentoToggle = (isolamentoId: string, checked: boolean) => {
    const novosSelecionados = { ...isolamentosSelecionados };
    if (checked) {
      novosSelecionados[isolamentoId] = { id: isolamentoId, dataInicio: '', status: 'suspeita' };
    } else {
      delete novosSelecionados[isolamentoId];
    }
    setIsolamentosSelecionados(novosSelecionados);
  };

  const handleDetalheChange = (isolamentoId: string, campo: 'dataInicio' | 'status', valor: string) => {
    setIsolamentosSelecionados(prev => ({
      ...prev,
      [isolamentoId]: {
        ...prev[isolamentoId],
        [campo]: valor,
      },
    }));
  };

  const todasDatasPreenchidas = Object.values(isolamentosSelecionados).length > 0 &&
    Object.values(isolamentosSelecionados).every(iso => iso.dataInicio && iso.dataInicio.trim() !== '');

  if (mode === 'editar' && pacienteSelecionado && isolamento) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Isolamento - {pacienteSelecionado.nomeCompleto}</DialogTitle>
            <DialogDescription>
              Altere a data de início do isolamento {isolamento.sigla}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-edicao">Data de Início</Label>
              <Input
                id="data-edicao"
                type="date"
                value={dataEdicao}
                onChange={(e) => setDataEdicao(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleConfirmarIsolamentos} disabled={!dataEdicao}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {etapa === 'lista' ? 'Gerenciar Pacientes em Vigilância' : `Adicionar Isolamento - ${pacienteSelecionado?.nomeCompleto}`}
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
                {pacientesDisponiveis.map(p => (
                  <Card key={p.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{p.nomeCompleto}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{p.sexoPaciente?.charAt(0)}</Badge>
                          <span>{p.setorNome}</span>
                          <span>•</span>
                          <span>Leito {p.leitoCodigo}</span>
                          <span>•</span>
                          <span>{p.especialidadePaciente}</span>
                        </div>
                      </div>
                      <Button onClick={() => handleAdicionarVigilancia(p)}>
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
                  {isolamentosFiltrados.map(tipo => {
                    const jaTemEsteIsolamento = pacienteSelecionado?.isolamentosVigentes?.some(
                      (iso: any) => iso.isolamentoId === tipo.id
                    );

                    return (
                      <div key={tipo.id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={tipo.id}
                            checked={jaTemEsteIsolamento || Boolean(isolamentosSelecionados[tipo.id!])}
                            disabled={jaTemEsteIsolamento}
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
                            {jaTemEsteIsolamento && (
                              <span className="text-xs text-green-600 font-medium">(Em vigilância)</span>
                            )}
                          </Label>
                        </div>

                        {isolamentosSelecionados[tipo.id!] && (
                          <div className="ml-6 mt-2 grid grid-cols-2 gap-4 items-end">
                            <div>
                              <Label htmlFor={`data-${tipo.id}`} className="text-sm">Data de Início</Label>
                              <Input
                                id={`data-${tipo.id}`}
                                type="date"
                                value={isolamentosSelecionados[tipo.id!].dataInicio}
                                onChange={(e) => handleDetalheChange(tipo.id!, 'dataInicio', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Status</Label>
                              <RadioGroup
                                value={isolamentosSelecionados[tipo.id!].status}
                                onValueChange={(value) => handleDetalheChange(tipo.id!, 'status', value)}
                                className="flex gap-4 mt-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="suspeita" id={`suspeita-${tipo.id}`} />
                                  <Label htmlFor={`suspeita-${tipo.id}`}>Suspeita</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="confirmada" id={`confirmada-${tipo.id}`} />
                                  <Label htmlFor={`confirmada-${tipo.id}`}>Confirmado</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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