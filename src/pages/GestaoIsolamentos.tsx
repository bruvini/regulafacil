
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, UserPlus, BarChart2, Bell } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import GerenciamentoIsolamentoModal from '@/components/modals/GerenciamentoIsolamentoModal';
import { GerenciarPacientesIsolamentoModal } from '@/components/modals/GerenciarPacientesIsolamentoModal';
import { PacienteEmVigilanciaCard } from '@/components/PacienteEmVigilanciaCard';
import { useSetores } from '@/hooks/useSetores';
import { useAlertasIsolamento } from '@/hooks/useAlertasIsolamento';
import { AlertaIncompatibilidadeItem } from '@/components/AlertaIncompatibilidadeItem';

const GestaoIsolamentos = () => {
  const [gerenciarTiposModalOpen, setGerenciarTiposModalOpen] = useState(false);
  const [gerenciarPacientesModalOpen, setGerenciarPacientesModalOpen] = useState(false);
  const { setores } = useSetores();
  const { alertas, loading: alertasLoading } = useAlertasIsolamento();
  
  // Lógica para encontrar pacientes em vigilância
  const pacientesEmVigilancia = setores
    .flatMap(setor => 
      setor.leitos
        .filter(leito => leito.statusLeito === 'Ocupado' && leito.dadosPaciente?.isolamentosVigentes && leito.dadosPaciente.isolamentosVigentes.length > 0)
        .map(leito => ({ 
          paciente: leito.dadosPaciente!, 
          setorNome: setor.nomeSetor, 
          setorId: setor.id!,
          leitoId: leito.id,
          leitoCodigo: leito.codigoLeito 
        }))
    )
    .reduce((acc, item) => {
        (acc[item.setorNome] = acc[item.setorNome] || []).push(item);
        return acc;
    }, {} as Record<string, any[]>);

  const totalPacientesVigilancia = Object.values(pacientesEmVigilancia).reduce((total, setor) => total + setor.length, 0);

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

          {/* Bloco 1: Indicadores (Simplificado) */}
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

          {/* Bloco 2: Filtros e Ações */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-card border border-border/50">
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="italic text-muted-foreground">
                  Filtros avançados serão implementados em desenvolvimento futuro.
                </p>
              </CardContent>
            </Card>
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
          </div>

          {/* Bloco 3: Alertas */}
          <Card className="shadow-card border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertas de Incompatibilidade Biológica
              </CardTitle>
            </CardHeader>
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
          </Card>
          
          {/* Bloco 4: Pacientes em Vigilância (com Accordion) */}
          <Card className="shadow-card border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pacientes em Vigilância</span>
                {totalPacientesVigilancia > 0 && (
                  <Badge variant="secondary">{totalPacientesVigilancia}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(pacientesEmVigilancia).length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-2">
                  {Object.entries(pacientesEmVigilancia).map(([setorNome, pacientes]) => (
                    <AccordionItem key={setorNome} value={setorNome} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex justify-between items-center w-full pr-4">
                          <h3 className="text-lg font-semibold text-foreground">{setorNome}</h3>
                          <Badge variant="outline">{pacientes.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 space-y-2">
                        {pacientes.map((item: any) => (
                          <PacienteEmVigilanciaCard 
                            key={`${item.setorId}-${item.leitoId}`}
                            paciente={{ ...item.paciente, leitoCodigo: item.leitoCodigo }}
                            setorId={item.setorId}
                            leitoId={item.leitoId}
                          />
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
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
