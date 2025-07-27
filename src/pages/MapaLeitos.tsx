import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { FiltrosMapaLeitos } from "@/components/FiltrosMapaLeitos";
import { SetorCard } from "@/components/SetorCard";
import { useSetores } from "@/hooks/useSetores";
import { useLeitos } from "@/hooks/useLeitos";
import { usePacientes } from "@/hooks/usePacientes";
import { useFiltrosMapaLeitos } from "@/hooks/useFiltrosMapaLeitos";
import { Bed, Users, AlertTriangle, Clock, Filter, BarChart3 } from "lucide-react";

const MapaLeitos = () => {
  const { setores, loading: setoresLoading } = useSetores();
  const { leitos, loading: leitosLoading } = useLeitos();
  const { pacientes, loading: pacientesLoading } = usePacientes();
  const { filtros, setFiltros } = useFiltrosMapaLeitos();

  // Força scroll para o topo ao carregar a página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const loading = setoresLoading || leitosLoading || pacientesLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4"></div>
            <div className="h-4 bg-muted rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="h-24 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cálculos e métricas
  const totalLeitos = leitos.length;
  const leitosOcupados = leitos.filter(l => 
    l.historicoMovimentacao[l.historicoMovimentacao.length - 1]?.statusLeito === 'Ocupado'
  ).length;
  const leitosVagos = leitos.filter(l => 
    l.historicoMovimentacao[l.historicoMovimentacao.length - 1]?.statusLeito === 'Vago'
  ).length;
  const leitosBloqueados = leitos.filter(l => 
    l.historicoMovimentacao[l.historicoMovimentacao.length - 1]?.statusLeito === 'Bloqueado'
  ).length;
  const leitosHigienizacao = leitos.filter(l => 
    l.historicoMovimentacao[l.historicoMovimentacao.length - 1]?.statusLeito === 'Higienizacao'
  ).length;
  const leitosRegulados = leitos.filter(l => 
    l.historicoMovimentacao[l.historicoMovimentacao.length - 1]?.statusLeito === 'Regulado'
  ).length;
  const leitosReservados = leitos.filter(l => 
    l.historicoMovimentacao[l.historicoMovimentacao.length - 1]?.statusLeito === 'Reservado'
  ).length;

  const taxaOcupacao = totalLeitos > 0 ? ((leitosOcupados / totalLeitos) * 100).toFixed(1) : '0';

  // Filtros aplicados
  const setoresFiltrados = setores.filter(setor => {
    const leitosDoSetor = leitos.filter(l => l.setorId === setor.id);
    
    if (filtros.setorSelecionado && filtros.setorSelecionado !== setor.id) {
      return false;
    }
    
    if (filtros.statusSelecionado && filtros.statusSelecionado !== 'Todos') {
      const temLeitoComStatus = leitosDoSetor.some(l => 
        l.historicoMovimentacao[l.historicoMovimentacao.length - 1]?.statusLeito === filtros.statusSelecionado
      );
      if (!temLeitoComStatus) return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-medical-primary">
              Mapa de Leitos
            </h1>
            <p className="text-muted-foreground">
              Visualização em tempo real da ocupação dos leitos hospitalares
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50">
              {leitosVagos} Vagos
            </Badge>
            <Badge variant="outline" className="bg-blue-50">
              {leitosOcupados} Ocupados
            </Badge>
          </div>
        </header>

        {/* Indicadores */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeitos}</div>
              <p className="text-xs text-muted-foreground">
                leitos cadastrados
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{leitosOcupados}</div>
              <p className="text-xs text-muted-foreground">
                {taxaOcupacao}% ocupação
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vagos</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{leitosVagos}</div>
              <p className="text-xs text-muted-foreground">
                disponíveis
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bloqueados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{leitosBloqueados}</div>
              <p className="text-xs text-muted-foreground">
                manutenção
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Higienização</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{leitosHigienizacao}</div>
              <p className="text-xs text-muted-foreground">
                limpeza
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regulados</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{leitosRegulados + leitosReservados}</div>
              <p className="text-xs text-muted-foreground">
                em processo
              </p>
            </CardContent>
          </Card>
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
            <FiltrosMapaLeitos 
              setores={setores} 
              filtros={filtros} 
              setFiltros={setFiltros} 
            />
          </CardContent>
        </Card>

        {/* Setores - Todos os acordeões começam fechados */}
        <Accordion type="single" collapsible className="w-full" defaultValue={[]}>
          {setoresFiltrados.map((setor) => (
            <AccordionItem key={setor.id} value={setor.id!}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{setor.nomeSetor}</span>
                    <Badge variant="outline">{setor.siglaSetor}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {leitos.filter(l => l.setorId === setor.id).length} leitos
                    </Badge>
                    <Badge variant="outline" className="bg-green-50">
                      {leitos.filter(l => 
                        l.setorId === setor.id && 
                        l.historicoMovimentacao[l.historicoMovimentacao.length - 1]?.statusLeito === 'Vago'
                      ).length} vagos
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <SetorCard
                  setor={setor}
                  leitos={leitos.filter(l => l.setorId === setor.id)}
                  pacientes={pacientes}
                  filtros={filtros}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default MapaLeitos;
