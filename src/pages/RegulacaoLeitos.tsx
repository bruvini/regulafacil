
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSetores } from '@/hooks/useSetores';
import { usePacientes } from '@/hooks/usePacientes';
import { ImportacaoMVModal } from '@/components/modals/ImportacaoMVModal';
import { ResultadoValidacao } from '@/components/modals/ValidacaoImportacao';
import { useToast } from '@/hooks/use-toast';
import { Paciente, HistoricoLeito, SyncSummary, PacienteDaPlanilha } from '@/types/hospital';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const RegulacaoLeitos = () => {
  const { setores, loading: setoresLoading } = useSetores();
  const { pacientes } = usePacientes();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<ResultadoValidacao | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dadosPlanilhaProcessados, setDadosPlanilhaProcessados] = useState<PacienteDaPlanilha[]>([]);
  const { toast } = useToast();

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
            const pacienteNoLeito = pacientes.find(p => p.id === leitoOcupado.pacienteId);
            if (pacienteNoLeito && !pacientesPlanilha.some(p => p.nomeCompleto === pacienteNoLeito.nomeCompleto)) {
              summary.altas.push({ 
                nomePaciente: pacienteNoLeito.nomeCompleto, 
                leitoAntigo: leitoOcupado.codigoLeito 
              });
            }
          });

          // 2. Identificar Novas Internações e Transferências
          pacientesPlanilha.forEach(pacientePlanilha => {
            const pacienteExistente = pacientes.find(p => p.nomeCompleto === pacientePlanilha.nomeCompleto);
            const leitoDaPlanilha = todosLeitos.find(l => l.codigoLeito === pacientePlanilha.leitoCodigo);

            if (!leitoDaPlanilha) return; // Leito inválido, já foi pego na validação

            if (pacienteExistente) {
              // Paciente já existe - verifica transferência
              if (pacienteExistente.leitoAtualId !== leitoDaPlanilha.id) {
                const leitoAntigo = todosLeitos.find(l => l.id === pacienteExistente.leitoAtualId);
                summary.transferencias.push({ 
                  paciente: pacientePlanilha, 
                  leitoAntigo: leitoAntigo?.codigoLeito || 'N/A' 
                });
              }
            } else {
              // Paciente novo - nova internação
              if (leitoDaPlanilha.statusLeito === 'Vago') {
                summary.novasInternacoes.push(pacientePlanilha);
              }
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

  // Nova função de sincronização corrigida
  const handleSync = async () => {
    if (!syncSummary || setoresLoading) {
      toast({ title: 'Aguarde', description: 'Dados ainda estão sendo carregados.' });
      return;
    }
    
    setIsSyncing(true);

    try {
      const batch = writeBatch(db);
      const agora = new Date().toISOString();

      // Criamos uma cópia profunda dos setores para manipular em memória
      const setoresAtualizados = new Map(setores.map(s => [s.id!, JSON.parse(JSON.stringify(s))]));
      
      // 1. Lógica de Altas
      syncSummary.altas.forEach(alta => {
        setoresAtualizados.forEach(setor => {
          const leito = setor.leitos.find(l => l.codigoLeito === alta.leitoAntigo);
          if (leito) {
            leito.statusLeito = 'Vago';
            leito.pacienteId = undefined;
            leito.dataAtualizacaoStatus = agora;
            leito.historico.push({ statusLeito: 'Vago', data: agora });
          }
        });
      });

      // 2. Lógica de Transferências
      syncSummary.transferencias.forEach(transf => {
        // Libera leito antigo
        setoresAtualizados.forEach(setor => {
          const leitoAntigo = setor.leitos.find(l => l.codigoLeito === transf.leitoAntigo);
          if (leitoAntigo) {
            leitoAntigo.statusLeito = 'Vago';
            leitoAntigo.pacienteId = undefined;
            leitoAntigo.dataAtualizacaoStatus = agora;
            leitoAntigo.historico.push({ statusLeito: 'Vago', data: agora });
          }
        });
        // Ocupa leito novo
        setoresAtualizados.forEach(setor => {
           if(setor.nomeSetor === transf.paciente.setorNome) {
              const leitoNovo = setor.leitos.find(l => l.codigoLeito === transf.paciente.leitoCodigo);
              if (leitoNovo) {
                  leitoNovo.statusLeito = 'Ocupado';
                  leitoNovo.pacienteId = transf.paciente.nomeCompleto;
                  leitoNovo.dataAtualizacaoStatus = agora;
                  leitoNovo.historico.push({ statusLeito: 'Ocupado', data: agora, pacienteId: leitoNovo.pacienteId });
              }
          }
        });
      });
      
      // 3. Lógica de Novas Internações
      syncSummary.novasInternacoes.forEach(internacao => {
        setoresAtualizados.forEach(setor => {
          if(setor.nomeSetor === internacao.setorNome) {
            const leito = setor.leitos.find(l => l.codigoLeito === internacao.leitoCodigo);
            if (leito) {
              leito.statusLeito = 'Ocupado';
              leito.pacienteId = internacao.nomeCompleto;
              leito.dataAtualizacaoStatus = agora;
              leito.historico.push({ statusLeito: 'Ocupado', data: agora, pacienteId: leito.pacienteId });
            }
          }
        });
      });
      
      // 4. Adicionar todas as atualizações ao batch
      setoresAtualizados.forEach(setorAtualizado => {
        const setorRef = doc(db, 'setoresRegulaFacil', setorAtualizado.id);
        batch.update(setorRef, { leitos: setorAtualizado.leitos });
      });

      // Simulação de tempo para a barra de progresso ser visível
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Executar todas as operações atomicamente
      await batch.commit();
      
      toast({ 
        title: 'Sucesso!', 
        description: `Sincronização concluída! ${syncSummary.novasInternacoes.length + syncSummary.transferencias.length + syncSummary.altas.length} operações realizadas.`,
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
          <Card className="shadow-card border border-border/50">
            <CardHeader><CardTitle>Aguardando UTI</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground italic">Aqui serão listados os pacientes que aguardam UTI.</p></CardContent>
          </Card>
          <Card className="shadow-card border border-border/50">
            <CardHeader><CardTitle>Aguardando Transferência</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground italic">Aqui serão listados os pacientes que aguardam transferência.</p></CardContent>
          </Card>
          <Card className="shadow-card border border-border/50">
            <CardHeader><CardTitle>Cirurgias Eletivas</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground italic">Aqui serão listados os pacientes que aguardam leito para cirurgia eletiva.</p></CardContent>
          </Card>
        </div>

        {/* --- Bloco 4 & 5: Acordeões de Pendências --- */}
        <Accordion type="multiple" className="w-full space-y-4">
          <AccordionItem value="item-1" className="border rounded-lg bg-card shadow-card">
            <AccordionTrigger className="px-4 hover:no-underline">
              <h3 className="font-semibold text-foreground">REGULAÇÕES PENDENTES</h3>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-sm text-muted-foreground italic">Aqui serão listados os pacientes do PS ou da Recuperação Cirúrgica que aguardam leito.</p>
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
