
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { usePacientes } from '@/hooks/usePacientes';
import { useSetores } from '@/hooks/useSetores';
import { useLeitos } from '@/hooks/useLeitos';
import { RegulacaoLeitoItem } from '@/components/RegulacaoLeitoItem';
import { RemanejamentosPendentesBloco } from '@/components/RemanejamentosPendentesBloco';
import { Paciente } from '@/types/hospital';
import { Search, Filter } from 'lucide-react';

const RegulacaoLeitos = () => {
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('');
  const [filtroData, setFiltroData] = useState<Date | undefined>();
  const [activeTab, setActiveTab] = useState('pendentes');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Hooks para dados - accessing the correct properties
  const { pacientes } = usePacientes();
  const { setores } = useSetores();
  const { leitos } = useLeitos();

  // Mock de dados para desenvolvimento
  const mockPacientes = useMemo(() => [
    {
      id: '1',
      leitoId: 'leito1',
      setorId: 'setor1',
      nomeCompleto: 'João Silva',
      dataNascimento: '1980-05-15',
      sexoPaciente: 'Masculino' as const,
      dataInternacao: '2024-01-15T10:30:00Z',
      especialidadePaciente: 'Cardiologia',
      aguardaUTI: true,
      dataPedidoUTI: '2024-01-16T08:00:00Z'
    },
    {
      id: '2',
      leitoId: 'leito2',
      setorId: 'setor2',
      nomeCompleto: 'Maria Santos',
      dataNascimento: '1975-08-22',
      sexoPaciente: 'Feminino' as const,
      dataInternacao: '2024-01-14T14:15:00Z',
      especialidadePaciente: 'Neurologia',
      remanejarPaciente: true,
      dataPedidoRemanejamento: '2024-01-17T09:30:00Z'
    }
  ], []);

  const remanejamentosPendentes = useMemo(() => 
    mockPacientes.filter(p => p.remanejarPaciente)
  , [mockPacientes]);

  const pacientesPendentesRegulacao = useMemo(() => {
    return mockPacientes.filter(paciente => {
      const matchNome = !filtroNome || 
        paciente.nomeCompleto.toLowerCase().includes(filtroNome.toLowerCase());
      const matchSetor = !filtroSetor || paciente.setorId === filtroSetor;
      
      return matchNome && matchSetor;
    });
  }, [mockPacientes, filtroNome, filtroSetor]);

  const adicionarPaciente = useMutation({
    mutationFn: async (novoPaciente: Omit<Paciente, 'id'>) => {
      // Simulação de API call
      return Promise.resolve({ id: Date.now().toString(), ...novoPaciente });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast({
        title: "Paciente adicionado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar paciente",
        variant: "destructive",
      });
    }
  });

  const confirmarRemanejamento = async (paciente: Paciente) => {
    try {
      toast({
        title: `Remanejamento confirmado para ${paciente.nomeCompleto}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao confirmar remanejamento",
        variant: "destructive",
      });
    }
  };

  const cancelarRemanejamento = async (paciente: Paciente) => {
    try {
      toast({
        title: `Remanejamento cancelado para ${paciente.nomeCompleto}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao cancelar remanejamento",
        variant: "destructive",
      });
    }
  };

  const observacoesRemanejamento = (paciente: Paciente) => {
    try {
      toast({
        title: `Observações para ${paciente.nomeCompleto}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar observações",
        variant: "destructive",
      });
    }
  };

  const regulacoesConcluidas = async (paciente: Paciente) => {
    try {
      toast({
        title: `Regulação concluída para ${paciente.nomeCompleto}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao concluir regulação",
        variant: "destructive",
      });
    }
  };

  const cancelarRegulacao = async (paciente: Paciente) => {
    try {
      toast({
        title: `Regulação cancelada para ${paciente.nomeCompleto}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao cancelar regulação",
        variant: "destructive",
      });
    }
  };

  const editarObservacoes = (paciente: Paciente) => {
    toast({
      title: `Editando observações para ${paciente.nomeCompleto}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-medical-primary">Regulação de Leitos</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filtro-nome">Nome do Paciente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="filtro-nome"
                  placeholder="Buscar por nome..."
                  value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Setor</Label>
              <Select value={filtroSetor} onValueChange={setFiltroSetor}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os setores</SelectItem>
                  {setores.map((setor) => (
                    <SelectItem key={setor.id} value={setor.id}>
                      {setor.nomeSetor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Internação</Label>
              <Calendar
                mode="single"
                selected={filtroData}
                onSelect={setFiltroData}
                className="rounded-md border"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remanejamentos Pendentes */}
      <RemanejamentosPendentesBloco
        remanejamentosPendentes={remanejamentosPendentes}
        onConfirmarRemanejamento={confirmarRemanejamento}
        onCancelarRemanejamento={cancelarRemanejamento}
        onObservacoesRemanejamento={observacoesRemanejamento}
      />

      {/* Lista de Pacientes */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pendentes">
            Pendentes de Regulação
            <Badge variant="secondary" className="ml-2">
              {pacientesPendentesRegulacao.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            Regulações Concluídas
            <Badge variant="secondary" className="ml-2">
              0
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="space-y-4">
          {pacientesPendentesRegulacao.map((paciente) => (
            <RegulacaoLeitoItem
              key={paciente.id}
              paciente={paciente}
              onConcluir={() => regulacoesConcluidas(paciente)}
              onCancelar={() => cancelarRegulacao(paciente)}
              onObservacoes={() => editarObservacoes(paciente)}
            />
          ))}
          
          {pacientesPendentesRegulacao.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhum paciente pendente de regulação encontrado.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="concluidas" className="space-y-4">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma regulação concluída encontrada.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RegulacaoLeitos;
