import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSetores } from "@/hooks/useSetores";
import { useLeitos } from "@/hooks/useLeitos";
import { usePacientes } from "@/hooks/usePacientes";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast";
import { useAuditoria } from "@/hooks/useAuditoria";
import { Search, Users, BedDouble, AlertTriangle, RefreshCcw, Plus } from "lucide-react";

interface Setor {
  id: string;
  nomeSetor: string;
  siglaSetor: string;
  totalLeitos: number;
  leitosOcupados: number;
  leitosDisponiveis: number;
  leitosBloqueados: number;
  leitosHigienizacao: number;
  leitosPCP: number;
  observacoes?: string;
}

const MapaLeitos = () => {
  const { setores, loading: setoresLoading, adicionarSetor } = useSetores();
  const { leitos, loading: leitosLoading, adicionarLeito, atualizarStatusLeito } = useLeitos();
  const { pacientes, loading: pacientesLoading } = usePacientes();
  const { registrarLog } = useAuditoria();
  const { toast } = useToast();

  const loading = setoresLoading || leitosLoading || pacientesLoading;

  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyOccupied, setShowOnlyOccupied] = useState(false);
  const [showOnlyPCP, setShowOnlyPCP] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredSetores = useMemo(() => {
    if (!setores) return [];

    return setores.filter(setor => {
      const matchesSearchTerm = setor.nomeSetor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                setor.siglaSetor.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearchTerm;
    });
  }, [setores, searchTerm]);

  const leitosEnriquecidos = useMemo(() => {
    if (leitosLoading || pacientesLoading) return [];
    const mapaPacientes = new Map(pacientes.map(p => [p.leitoId, p]));
    return leitos.map(leito => {
        const historicoRecente = leito.historicoMovimentacao[leito.historicoMovimentacao.length - 1];
        const pacienteId = historicoRecente?.pacienteId;
        const paciente = pacienteId ? pacientes.find(p => p.id === pacienteId) : null;
        return {
            ...leito,
            statusLeito: historicoRecente?.statusLeito || 'Vago',
            dadosPaciente: paciente
        };
    });
}, [leitos, pacientes, leitosLoading, pacientesLoading]);

  const setoresComLeitos = useMemo(() => {
    if (setoresLoading || leitosLoading) return [];

    return filteredSetores.map(setor => {
      const leitosDoSetor = leitosEnriquecidos.filter(leito => leito.setorId === setor.id);
      const leitosFiltrados = leitosDoSetor.filter(leito => {
        if (showOnlyOccupied && leito.statusLeito !== 'Ocupado') return false;
        if (showOnlyPCP && !leito.leitoPCP) return false;
        return true;
      });

      const totalLeitos = leitosDoSetor.length;
      const leitosOcupados = leitosDoSetor.filter(leito => leito.statusLeito === 'Ocupado').length;
      const leitosDisponiveis = leitosDoSetor.filter(leito => leito.statusLeito === 'Vago').length;
      const leitosBloqueados = leitosDoSetor.filter(leito => leito.statusLeito === 'Bloqueado').length;
      const leitosHigienizacao = leitosDoSetor.filter(leito => leito.statusLeito === 'Higienizacao').length;
      const leitosPCP = leitosDoSetor.filter(leito => leito.leitoPCP).length;

      return {
        ...setor,
        leitos: leitosFiltrados,
        totalLeitos,
        leitosOcupados,
        leitosDisponiveis,
        leitosBloqueados,
        leitosHigienizacao,
        leitosPCP
      };
    });
  }, [filteredSetores, leitosEnriquecidos, showOnlyOccupied, showOnlyPCP, setoresLoading, leitosLoading]);

  const [novoSetor, setNovoSetor] = useState({
    nomeSetor: '',
    siglaSetor: '',
  });

  const [novoLeito, setNovoLeito] = useState({
    setorId: '',
    codigoLeito: '',
    leitoPCP: false,
    leitoIsolamento: false,
  });

  const [isSetorModalOpen, setIsSetorModalOpen] = useState(false);
  const [isLeitoModalOpen, setIsLeitoModalOpen] = useState(false);

  const handleAdicionarSetor = async () => {
    if (novoSetor.nomeSetor && novoSetor.siglaSetor) {
      await adicionarSetor(novoSetor.nomeSetor, novoSetor.siglaSetor);
      setNovoSetor({ nomeSetor: '', siglaSetor: '' });
      setIsSetorModalOpen(false);
      registrarLog(`Adicionou novo setor: ${novoSetor.nomeSetor}`, "Mapa de Leitos");
      toast({ title: "Sucesso!", description: "Setor adicionado com sucesso." });
    }
  };

  const handleAdicionarLeito = async () => {
    if (novoLeito.setorId && novoLeito.codigoLeito) {
      await adicionarLeito(novoLeito.setorId, novoLeito.codigoLeito, novoLeito.leitoPCP, novoLeito.leitoIsolamento);
      setNovoLeito({ setorId: '', codigoLeito: '', leitoPCP: false, leitoIsolamento: false });
      setIsLeitoModalOpen(false);
      registrarLog(`Adicionou novo leito: ${novoLeito.codigoLeito} no setor ${novoLeito.setorId}`, "Mapa de Leitos");
      toast({ title: "Sucesso!", description: "Leito adicionado com sucesso." });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-medical-primary">Mapa de Leitos</h1>
              <p className="text-muted-foreground">Visão geral e gerenciamento dos leitos.</p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Setor
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Setor</DialogTitle>
                    <DialogDescription>
                      Preencha os campos abaixo para adicionar um novo setor ao mapa de leitos.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nome" className="text-right">
                        Nome
                      </Label>
                      <Input id="nome" value={novoSetor.nomeSetor} onChange={(e) => setNovoSetor({ ...novoSetor, nomeSetor: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="sigla" className="text-right">
                        Sigla
                      </Label>
                      <Input id="sigla" value={novoSetor.siglaSetor} onChange={(e) => setNovoSetor({ ...novoSetor, siglaSetor: e.target.value })} className="col-span-3" />
                    </div>
                  </div>
                  <Button onClick={handleAdicionarSetor}>Adicionar Setor</Button>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Leito
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Leito</DialogTitle>
                    <DialogDescription>
                      Preencha os campos abaixo para adicionar um novo leito ao mapa.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="setor" className="text-right">
                        Setor
                      </Label>
                      <select
                        id="setor"
                        className="col-span-3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={novoLeito.setorId}
                        onChange={(e) => setNovoLeito({ ...novoLeito, setorId: e.target.value })}
                      >
                        <option value="">Selecione um setor</option>
                        {setores?.map(setor => (
                          <option key={setor.id} value={setor.id}>{setor.nomeSetor}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="codigo" className="text-right">
                        Código
                      </Label>
                      <Input id="codigo" value={novoLeito.codigoLeito} onChange={(e) => setNovoLeito({ ...novoLeito, codigoLeito: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="pcp" className="text-right">
                        Leito PCP
                      </Label>
                      <Checkbox id="pcp" checked={novoLeito.leitoPCP} onCheckedChange={(checked) => setNovoLeito({ ...novoLeito, leitoPCP: checked || false })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="isolamento" className="text-right">
                        Leito Isolamento
                      </Label>
                      <Checkbox id="isolamento" checked={novoLeito.leitoIsolamento} onCheckedChange={(checked) => setNovoLeito({ ...novoLeito, leitoIsolamento: checked || false })} className="col-span-3" />
                    </div>
                  </div>
                  <Button onClick={handleAdicionarLeito}>Adicionar Leito</Button>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por setor..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="occupied">Ocupados</Label>
              <Switch id="occupied" checked={showOnlyOccupied} onCheckedChange={setShowOnlyOccupied} />
              <Label htmlFor="pcp">Leitos PCP</Label>
              <Switch id="pcp" checked={showOnlyPCP} onCheckedChange={setShowOnlyPCP} />
            </div>
          </div>

          {/* Mapa dos Setores */}
          <div className="space-y-4">
            <Accordion 
              type="single" 
              collapsible 
              value={accordionValue} 
              onValueChange={setAccordionValue}
              className="space-y-4"
            >
              {setoresComLeitos.map(setor => (
                <AccordionItem key={setor.id} value={setor.id}>
                  <AccordionTrigger>
                    <div className="flex justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        {setor.nomeSetor} ({setor.siglaSetor})
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BedDouble className="w-4 h-4" />
                          {setor.leitosOcupados} / {setor.totalLeitos}
                        </div>
                        {setor.leitosBloqueados > 0 && (
                          <div className="flex items-center gap-1 text-destructive">
                            <AlertTriangle className="w-4 h-4" />
                            {setor.leitosBloqueados}
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card className="mb-4">
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <div className="text-xs font-semibold">Total de Leitos:</div>
                            <div className="text-sm">{setor.totalLeitos}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold">Leitos Ocupados:</div>
                            <div className="text-sm">{setor.leitosOcupados}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold">Leitos Disponíveis:</div>
                            <div className="text-sm">{setor.leitosDisponiveis}</div>
                          </div>
                           <div>
                            <div className="text-xs font-semibold">Leitos em Higienização:</div>
                            <div className="text-sm">{setor.leitosHigienizacao}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold">Leitos Bloqueados:</div>
                            <div className="text-sm">{setor.leitosBloqueados}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold">Leitos PCP:</div>
                            <div className="text-sm">{setor.leitosPCP}</div>
                          </div>
                          {setor.observacoes && (
                            <div className="col-span-2 md:col-span-4">
                              <div className="text-xs font-semibold">Observações:</div>
                              <div className="text-sm">{setor.observacoes}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {setor.leitos.map(leito => (
                        <Card key={leito.id} className="shadow-sm">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-semibold">{leito.codigoLeito}</div>
                              {leito.leitoPCP && (
                                <Badge variant="outline">PCP</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Status: {leito.statusLeito}
                            </div>
                            {leito.dadosPaciente && (
                              <>
                                <Separator className="my-2" />
                                <div className="text-xs">
                                  Paciente: {leito.dadosPaciente.nomeCompleto}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Internado em: {new Date(leito.dadosPaciente.dataInternacao).toLocaleDateString()}
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Listas Laterais e Modais (se necessário) */}
        </div>
      </div>
    </div>
  );
};

export default MapaLeitos;
