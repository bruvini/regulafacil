
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, UserPlus, BarChart2, Bell, Shield } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FiltrosGestaoIsolamentos } from '@/components/FiltrosGestaoIsolamentos';
import { PacienteVigilanciaCard } from '@/components/PacienteVigilanciaCard';
import GerenciamentoIsolamentoModal from '@/components/modals/GerenciamentoIsolamentoModal';
import { GerenciarPacientesIsolamentoModal } from '@/components/modals/GerenciarPacientesIsolamentoModal';
import { AlertaIncompatibilidadeItem } from '@/components/AlertaIncompatibilidadeItem';
import { useSetores } from '@/hooks/useSetores';
import { useLeitos } from '@/hooks/useLeitos';
import { usePacientes } from '@/hooks/usePacientes';
import { useAlertasIsolamento } from '@/hooks/useAlertasIsolamento';

const GestaoIsolamentos = () => {
  const [gerenciarTiposModalOpen, setGerenciarTiposModalOpen] = useState(false);
  const [gerenciarPacientesModalOpen, setGerenciarPacientesModalOpen] = useState(false);
  const [alertasAberto, setAlertasAberto] = useState(false);
  const [vigilanciaAberta, setVigilanciaAberta] = useState(false);
  
  // Estados dos filtros
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState({
    sexo: '',
    setor: '',
    isolamentos: []
  });

  const { setores } = useSetores();
  const { leitos } = useLeitos();
  const { pacientes } = usePacientes();
  const { alertas, loading: alertasLoading } = useAlertasIsolamento();
  
  // Lógica para encontrar pacientes em vigilância (usando as 3 coleções separadas)
  const pacientesEmVigilancia = useMemo(() => {
    const mapaLeitos = new Map(leitos.map(l => [l.id, l]));
    const mapaSetores = new Map(setores.map(s => [s.id, s]));

    return pacientes
      .filter(p => p.isolamentosVigentes && p.isolamentosVigentes.length > 0)
      .map(paciente => {
        const leito = mapaLeitos.get(paciente.leitoId);
        const setor = leito ? mapaSetores.get(leito.setorId) : undefined;
        return {
          ...paciente,
          leitoCodigo: leito?.codigoLeito || 'N/A',
          setorNome: setor?.nomeSetor || 'N/A',
          setorId: setor?.id || '',
          leitoId: leito?.id || ''
        };
      })
      .filter(paciente => {
        // Aplicar filtros
        const matchBusca = busca === '' || 
          paciente.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
          paciente.leitoCodigo.toLowerCase().includes(busca.toLowerCase());
        
        const matchSexo = filtros.sexo === '' || paciente.sexoPaciente === filtros.sexo;
        const matchSetor = filtros.setor === '' || paciente.setorNome === filtros.setor;
        
        const matchIsolamentos = filtros.isolamentos.length === 0 || 
          paciente.isolamentosVigentes?.some((iso: any) => 
            filtros.isolamentos.includes(iso.isolamentoId)
          );

        return matchBusca && matchSexo && matchSetor && matchIsolamentos;
      });
  }, [pacientes, leitos, setores, busca, filtros]);

  const totalPacientesVigilancia = pacientesEmVigilancia.length;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-lg bg-medical-danger flex items-center justify-center">
                <Settings className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-medical-primary text-center mb-4">
              Gestão de Isolamentos
            </h1>
            <p className="text-lg text-muted-foreground text-center">
              Controle e monitore os pacientes em precauções especiais
            </p>
          </header>

          {/* Bloco 1: Indicadores */}
          <Card className="shadow-card border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                Indicadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-medical-primary">{totalPacientesVigilancia}</p>
                  <p className="text-sm text-muted-foreground">Em Vigilância</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-medical-warning">{alertas.length}</p>
                  <p className="text-sm text-muted-foreground">Alertas Ativos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-medical-success">0</p>
                  <p className="text-sm text-muted-foreground">Finalizados Hoje</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-medical-danger">0</p>
                  <p className="text-sm text-muted-foreground">Vencidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bloco 2: Filtros */}
          <FiltrosGestaoIsolamentos
            busca={busca}
            setBusca={setBusca}
            filtros={filtros}
            setFiltros={setFiltros}
            setores={setores}
          />

          {/* Bloco 3: Ações */}
          <Card className="shadow-card border border-border/50">
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => setGerenciarTiposModalOpen(true)} 
                  variant="medical-outline"
                  className="flex-1"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Gerenciar Tipos
                </Button>
                <Button 
                  onClick={() => setGerenciarPacientesModalOpen(true)}
                  variant="medical"
                  className="flex-1"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Gerenciar Pacientes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bloco 4: Alertas */}
          <Card className="shadow-card border border-border/50">
            <Collapsible open={alertasAberto} onOpenChange={setAlertasAberto}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Alertas de Incompatibilidade Biológica
                    <Badge variant="destructive">{alertas.length}</Badge>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {alertasLoading ? (
                    <p className="italic text-muted-foreground">Analisando compatibilidade entre pacientes...</p>
                  ) : (
                    alertas.length > 0 ? (
                      <div className="space-y-2">
                        {alertas.map(alerta => (
                          <AlertaIncompatibilidadeItem key={alerta.pacienteId} alerta={alerta} />
                        ))}
                      </div>
                    ) : (
                      <p className="italic text-muted-foreground">Nenhum risco de incompatibilidade detectado.</p>
                    )
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
          
          {/* Bloco 5: Pacientes em Vigilância */}
          <Card className="shadow-card border border-border/50">
            <Collapsible open={vigilanciaAberta} onOpenChange={setVigilanciaAberta}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Pacientes em Vigilância
                    <Badge variant="secondary">{totalPacientesVigilancia}</Badge>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {pacientesEmVigilancia.length > 0 ? (
                    <div className="space-y-4">
                      {pacientesEmVigilancia.map((paciente) => (
                        <PacienteVigilanciaCard 
                          key={paciente.id}
                          paciente={paciente}
                          setorId={paciente.setorId}
                          leitoId={paciente.leitoId}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                        <Bell className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        Nenhum paciente em vigilância no momento.
                      </p>
                      <Button 
                        onClick={() => setGerenciarPacientesModalOpen(true)}
                        className="mt-4"
                        variant="medical"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Adicionar Paciente
                      </Button>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>
      </div>

      <GerenciamentoIsolamentoModal 
        open={gerenciarTiposModalOpen} 
        onOpenChange={setGerenciarTiposModalOpen} 
      />
      <GerenciarPacientesIsolamentoModal 
        open={gerenciarPacientesModalOpen} 
        onOpenChange={setGerenciarPacientesModalOpen} 
      />
    </div>
  );
};

export default GestaoIsolamentos;
