import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, BedDouble, Ambulance, X, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSetores } from '@/hooks/useSetores';
import { ImportacaoMVModal } from '@/components/modals/ImportacaoMVModal';
import { ResultadoValidacao } from '@/components/modals/ValidacaoImportacao';
import { ListaPacientesPendentes } from '@/components/ListaPacientesPendentes';
import { DadosPaciente } from '@/types/hospital';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { intervalToDuration, parse } from 'date-fns';

interface PacienteDaPlanilha {
  nomeCompleto: string;
  dataNascimento: string;
  sexo: 'Masculino' | 'Feminino';
  dataInternacao: string;
  setorNome: string;
  leitoCodigo: string;
  especialidade: string;
}

interface SyncSummary {
  novasInternacoes: PacienteDaPlanilha[];
  transferencias: { paciente: PacienteDaPlanilha; leitoAntigo: string }[];
  altas: { nomePaciente: string; leitoAntigo: string }[];
}

const RegulacaoLeitos = () => {
  const { setores, loading: setoresLoading, cancelarPedidoUTI, cancelarTransferencia, altaAposRecuperacao } = useSetores();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<ResultadoValidacao | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dadosPlanilhaProcessados, setDadosPlanilhaProcessados] = useState<PacienteDaPlanilha[]>([]);
  const { toast } = useToast();

  // Lógica para extrair e filtrar os pacientes
  const todosPacientesOcupados: (DadosPaciente & { setorOrigem: string; setorId: string; leitoId: string })[] = setores
    .flatMap(setor => 
      setor.leitos
        .filter(leito => leito.statusLeito === 'Ocupado' && leito.dadosPaciente)
        .map(leito => ({ 
          ...leito.dadosPaciente!,
          setorOrigem: setor.nomeSetor,
          setorId: setor.id!,
          leitoId: leito.id
        }))
    );

  const decisaoCirurgica = todosPacientesOcupados.filter(p => p.setorOrigem === "PS DECISÃO CIRURGICA");
  const decisaoClinica = todosPacientesOcupados.filter(p => p.setorOrigem === "PS DECISÃO CLINICA");
  const recuperacaoCirurgica = todosPacientesOcupados.filter(p => p.setorOrigem === "CC - RECUPERAÇÃO");
  const pacientesAguardandoUTI = todosPacientesOcupados.filter(p => p.aguardaUTI);
  const pacientesAguardandoTransferencia = todosPacientesOcupados.filter(p => p.transferirPaciente);

  const totalPendentes = decisaoCirurgica.length + decisaoClinica.length + recuperacaoCirurgica.length;

  // Função para calcular tempo de espera
  const calcularTempoEspera = (dataInicio: string): string => {
    const inicio = new Date(dataInicio);
    const duracao = intervalToDuration({ start: inicio, end: new Date() });
    const partes = [];
    if (duracao.days && duracao.days > 0) partes.push(`${duracao.days}d`);
    if (duracao.hours && duracao.hours > 0) partes.push(`${duracao.hours}h`);
    if (duracao.minutes) partes.push(`${duracao.minutes}m`);
    return partes.length > 0 ? partes.join(' ') : 'Recente';
  };

  const handleProcessFileRequest = (file: File) => {
    setProcessing(true);
    setValidationResult(null);
    setSyncSummary(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // A leitura dos dados começa da linha 4 (índice 3 do array)
        const dadosPlanilha = jsonData.slice(3);
        
        const setoresPlanilha = new Set<string>();
        const leitosPlanilha: Record<string, Set<string>> = {};

        dadosPlanilha.forEach((row: any) => {
          const nomeSetor = row[4]?.trim();
          const nomeLeito = row[6]?.trim();
          
          if (nomeSetor) {
            setoresPlanilha.add(nomeSetor);
            if (nomeLeito) {
              if (!leitosPlanilha[nomeSetor]) {
                leitosPlanilha[nomeSetor] = new Set<string>();
              }
              leitosPlanilha[nomeSetor].add(nomeLeito);
            }
          }
        });
        
        const setoresCadastrados = new Set(setores.map(s => s.nomeSetor));
        const leitosCadastrados: Record<string, Set<string>> = {};
        setores.forEach(s => {
          leitosCadastrados[s.nomeSetor] = new Set(s.leitos.map(l => l.codigoLeito));
        });

        const setoresFaltantes = [...setoresPlanilha].filter(s => !setoresCadastrados.has(s));
        
        const leitosFaltantes: Record<string, string[]> = {};
        Object.entries(leitosPlanilha).forEach(([setor, leitos]) => {
          if (setoresCadastrados.has(setor)) {
            const faltantes = [...leitos].filter(l => !leitosCadastrados[setor]?.has(l));
            if (faltantes.length > 0) {
              leitosFaltantes[setor] = faltantes;
            }
          }
        });

        const temInconsistencias = setoresFaltantes.length > 0 || Object.keys(leitosFaltantes).length > 0;

        if (temInconsistencias) {
          // Show validation errors
          setValidationResult({ setoresFaltantes, leitosFaltantes });
        } else {
          // If validation passes, proceed to sync summary generation
          const pacientesPlanilha: PacienteDaPlanilha[] = dadosPlanilha
            .map((row: any) => ({
              nomeCompleto: row[0]?.trim(),
              dataNascimento: row[1]?.trim(),
              sexo: (row[2]?.trim() === 'F' ? 'Feminino' : 'Masculino') as 'Masculino' | 'Feminino',
              dataInternacao: row[3]?.trim(),
              setorNome: row[4]?.trim(),
              leitoCodigo: row[6]?.trim(),
              especialidade: row[7]?.trim()
            }))
            .filter(p => p.nomeCompleto && p.leitoCodigo);

          const todosLeitos = setores.flatMap(s => s.leitos.map(l => ({ ...l, setorNome: s.nomeSetor })));
          const leitosOcupados = todosLeitos.filter(l => l.statusLeito === 'Ocupado');

          const summary: SyncSummary = { novasInternacoes: [], transferencias: [], altas: [] };

          // 1. Identificar Altas: Pacientes no sistema que não estão na planilha
          leitosOcupados.forEach(leitoOcupado => {
            if (leitoOcupado.dadosPaciente && !pacientesPlanilha.some(p => p.nomeCompleto === leitoOcupado.dadosPaciente?.nomePaciente)) {
              summary.altas.push({ 
                nomePaciente: leitoOcupado.dadosPaciente.nomePaciente, 
                leitoAntigo: leitoOcupado.codigoLeito 
              });
            }
          });

          // 2. Identificar Novas Internações e Transferências
          pacientesPlanilha.forEach(pacientePlanilha => {
            const leitoAtual = leitosOcupados.find(l => l.dadosPaciente?.nomePaciente === pacientePlanilha.nomeCompleto);
            const leitoDaPlanilha = todosLeitos.find(l => l.codigoLeito === pacientePlanilha.leitoCodigo);

            if (!leitoDaPlanilha) return; // Leito inválido, já foi pego na validação

            if (leitoAtual) {
              // Paciente já existe - verifica transferência
              if (leitoAtual.id !== leitoDaPlanilha.id) {
                summary.transferencias.push({ 
                  paciente: pacientePlanilha, 
                  leitoAntigo: leitoAtual.codigoLeito
                });
              }
            } else {
              // Paciente novo - nova internação
              summary.novasInternacoes.push(pacientePlanilha);
            }
          });

          setSyncSummary(summary);
          setDadosPlanilhaProcessados(pacientesPlanilha);
        }

      } catch (error) {
        console.error("Erro ao processar o arquivo Excel:", error);
        toast({
          title: 'Erro de Processamento',
          description: 'Ocorreu um erro ao ler a planilha. Verifique o formato do arquivo.',
          variant: 'destructive',
        });
      } finally {
        setProcessing(false);
      }
    };
    reader.onerror = (error) => {
      console.error("Erro ao ler o arquivo:", error);
      toast({
        title: 'Erro de Leitura',
        description: 'Não foi possível ler o arquivo selecionado.',
        variant: 'destructive',
      });
      setProcessing(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleSync = async () => {
    if (!dadosPlanilhaProcessados || setoresLoading) return;
    setIsSyncing(true);

    const agora = new Date().toISOString();
    const batch = writeBatch(db);

    // Cria uma cópia profunda dos setores para manipulação segura
    const setoresAtualizados = JSON.parse(JSON.stringify(setores));

    try {
      // 1. LIMPEZA: Percorre todos os leitos e desocupa todos que não estão bloqueados.
      // Isso garante que pacientes que tiveram alta sejam removidos.
      for (const setor of setoresAtualizados) {
        for (const leito of setor.leitos) {
          if (leito.statusLeito === 'Ocupado') {
            leito.statusLeito = 'Vago';
            leito.dadosPaciente = null;
            leito.dataAtualizacaoStatus = agora;
          }
        }
      }

      // 2. OCUPAÇÃO: Preenche os leitos com os dados da planilha
      dadosPlanilhaProcessados.forEach((pacientePlanilha: any) => {
        const setorTarget = setoresAtualizados.find(s => s.nomeSetor === pacientePlanilha.setorNome);
        if (setorTarget) {
          const leitoTarget = setorTarget.leitos.find(l => l.codigoLeito === pacientePlanilha.leitoCodigo);
          if (leitoTarget) {
            leitoTarget.statusLeito = 'Ocupado';
            leitoTarget.dataAtualizacaoStatus = agora;
            leitoTarget.dadosPaciente = {
              nomePaciente: pacientePlanilha.nomeCompleto,
              dataNascimento: pacientePlanilha.dataNascimento,
              sexoPaciente: pacientePlanilha.sexo,
              dataInternacao: pacientePlanilha.dataInternacao,
              especialidadePaciente: pacientePlanilha.especialidade
            };
          }
        }
      });

      // 3. Prepara o batch para enviar as atualizações ao Firestore
      setoresAtualizados.forEach(setor => {
        const setorRef = doc(db, 'setoresRegulaFacil', setor.id);
        batch.update(setorRef, { leitos: setor.leitos });
      });

      // Simulação de tempo para a barra de progresso ser visível
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Executar todas as operações atomicamente
      await batch.commit();
      
      toast({ 
        title: 'Sucesso!', 
        description: `Sincronização concluída! ${dadosPlanilhaProcessados.length} operações realizadas.`,
      });
      
      setImportModalOpen(false);
      
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      toast({ 
        title: 'Erro!', 
        description: 'Não foi possível sincronizar os dados.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSyncing(false);
      setSyncSummary(null);
      setValidationResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho da Página */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-medical-primary">Central de Regulação</h1>
          <p className="text-muted-foreground">Visão geral e controle das solicitações e pendências de leitos.</p>
        </header>

        {/* --- Bloco 1: Indicadores --- */}
        <Card className="shadow-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-medical-primary">Indicadores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">Funcionalidade em desenvolvimento.</p>
          </CardContent>
        </Card>

        {/* --- Bloco 2: Filtros e Ações --- */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Coluna da Esquerda (70%) */}
          <div className="w-full md:w-[70%]">
            <Card className="h-full shadow-card border border-border/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground italic text-center md:text-left">Área destinada aos filtros de busca (em desenvolvimento).</p>
              </CardContent>
            </Card>
          </div>
          {/* Coluna da Direita (30%) */}
          <div className="w-full md:w-[30%]">
            <Card className="h-full shadow-card border border-border/50">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => setImportModalOpen(true)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Importar pacientes MV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* --- Bloco 3: Listas de Espera --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Aguardando UTI */}
          <Card className="shadow-card border border-border/50">
            <CardHeader className="flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-base font-semibold">Aguardando UTI</CardTitle>
              <Badge variant="secondary">{pacientesAguardandoUTI.length}</Badge>
            </CardHeader>
            <CardContent className="p-2">
              {pacientesAguardandoUTI.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pacientesAguardandoUTI.map(p => (
                    <div key={`${p.setorId}-${p.leitoId}`} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div className="flex-grow">
                        <p className="font-medium text-sm">{p.nomePaciente}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{p.especialidadePaciente}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {p.dataPedidoUTI && calcularTempoEspera(p.dataPedidoUTI)}
                          </div>
                        </div>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => cancelarPedidoUTI(p.setorId, p.leitoId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Cancelar Solicitação</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">Nenhum paciente aguardando UTI.</p>
              )}
            </CardContent>
          </Card>

          {/* Aguardando Transferência */}
          <Card className="shadow-card border border-border/50">
            <CardHeader className="flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-base font-semibold">Aguardando Transferência</CardTitle>
              <Badge variant="secondary">{pacientesAguardandoTransferencia.length}</Badge>
            </CardHeader>
            <CardContent className="p-2">
              {pacientesAguardandoTransferencia.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pacientesAguardandoTransferencia.map(p => (
                    <div key={`${p.setorId}-${p.leitoId}`} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div className="flex-grow">
                        <p className="font-medium text-sm">{p.nomePaciente}</p>
                        <div className="text-xs text-muted-foreground">
                          <div>Destino: {p.destinoTransferencia}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {p.dataTransferencia && calcularTempoEspera(p.dataTransferencia)}
                          </div>
                        </div>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => cancelarTransferencia(p.setorId, p.leitoId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Cancelar Transferência</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">Nenhuma transferência pendente.</p>
              )}
            </CardContent>
          </Card>

          {/* Cirurgias Eletivas */}
          <Card className="shadow-card border border-border/50">
            <CardHeader><CardTitle>Cirurgias Eletivas</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground italic">Aqui serão listados os pacientes que aguardam leito para cirurgia eletiva.</p></CardContent>
          </Card>
        </div>

        {/* --- Bloco 4 & 5: Acordeões de Pendências --- */}
        <Accordion type="multiple" className="w-full space-y-4">
          <AccordionItem value="item-1" className="border rounded-lg bg-card shadow-card">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">REGULAÇÕES PENDENTES</h3>
                <Badge>{totalPendentes}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ListaPacientesPendentes titulo="Decisão Cirúrgica" pacientes={decisaoCirurgica} />
                <ListaPacientesPendentes titulo="Decisão Clínica" pacientes={decisaoClinica} />
                <ListaPacientesPendentes 
                  titulo="Recuperação Cirúrgica" 
                  pacientes={recuperacaoCirurgica} 
                  onAlta={altaAposRecuperacao}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2" className="border rounded-lg bg-card shadow-card">
            <AccordionTrigger className="px-4 hover:no-underline">
              <h3 className="font-semibold text-foreground">REMANEJAMENTOS PENDENTES</h3>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-sm text-muted-foreground italic">Aqui serão listados os pacientes que aguardam remanejamento dentro dos setores.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Modal de Importação */}
        <ImportacaoMVModal 
          open={importModalOpen}
          onOpenChange={(isOpen) => {
            setImportModalOpen(isOpen);
            if (!isOpen) {
              setValidationResult(null);
              setSyncSummary(null);
            }
          }}
          onProcessFileRequest={handleProcessFileRequest}
          validationResult={validationResult}
          syncSummary={syncSummary}
          processing={processing}
          isSyncing={isSyncing}
          onConfirmSync={handleSync}
        />

      </div>
    </div>
  );
};

export default RegulacaoLeitos;
