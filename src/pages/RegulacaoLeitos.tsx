import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, BedDouble, Ambulance, X, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSetores } from '@/hooks/useSetores';
import { useAlertasIsolamento } from '@/hooks/useAlertasIsolamento';
import { ImportacaoMVModal } from '@/components/modals/ImportacaoMVModal';
import { RegulacaoModal } from '@/components/modals/RegulacaoModal';
import { ResultadoValidacao } from '@/components/modals/ValidacaoImportacao';
import { ListaPacientesPendentes } from '@/components/ListaPacientesPendentes';
import { AguardandoUTIItem } from '@/components/AguardandoUTIItem';
import { AguardandoTransferenciaItem } from '@/components/AguardandoTransferenciaItem';
import { PacientePendenteItem } from '@/components/PacientePendenteItem';
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
  const { setores, loading: setoresLoading, cancelarPedidoUTI, cancelarTransferencia, altaAposRecuperacao, confirmarRegulacao } = useSetores();
  const { alertas: pacientesAguardandoRemanejamento } = useAlertasIsolamento();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [regulacaoModalOpen, setRegulacaoModalOpen] = useState(false);
  const [pacienteParaRegular, setPacienteParaRegular] = useState<any | null>(null);
  const [validationResult, setValidationResult] = useState<ResultadoValidacao | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dadosPlanilhaProcessados, setDadosPlanilhaProcessados] = useState<PacienteDaPlanilha[]>([]);
  const { toast } = useToast();

  const todosPacientesPendentes: (DadosPaciente & { setorOrigem: string; siglaSetorOrigem: string; setorId: string; leitoId: string; leitoCodigo: string; statusLeito: string; regulacao?: any })[] = setores
    .flatMap(setor => 
      setor.leitos
        .filter(leito => ['Ocupado', 'Regulado'].includes(leito.statusLeito) && leito.dadosPaciente)
        .map(leito => ({ 
          ...leito.dadosPaciente!,
          setorOrigem: setor.nomeSetor,
          siglaSetorOrigem: setor.siglaSetor,
          setorId: setor.id!,
          leitoId: leito.id,
          leitoCodigo: leito.codigoLeito,
          statusLeito: leito.statusLeito,
          regulacao: leito.regulacao
        }))
    );

  const decisaoCirurgica = todosPacientesPendentes.filter(p => p.setorOrigem === "PS DECISÃO CIRURGICA");
  const decisaoClinica = todosPacientesPendentes.filter(p => p.setorOrigem === "PS DECISÃO CLINICA");
  const recuperacaoCirurgica = todosPacientesPendentes.filter(p => p.setorOrigem === "CC - RECUPERAÇÃO");
  const pacientesAguardandoUTI = todosPacientesPendentes.filter(p => p.aguardaUTI);
  const pacientesAguardandoTransferencia = todosPacientesPendentes.filter(p => p.transferirPaciente);

  const totalPendentes = decisaoCirurgica.length + decisaoClinica.length + recuperacaoCirurgica.length;

  const calcularTempoEspera = (dataInicio: string): string => {
    const inicio = new Date(dataInicio);
    const duracao = intervalToDuration({ start: inicio, end: new Date() });
    const partes = [];
    if (duracao.days && duracao.days > 0) partes.push(`${duracao.days}d`);
    if (duracao.hours && duracao.hours > 0) partes.push(`${duracao.hours}h`);
    if (duracao.minutes) partes.push(`${duracao.minutes}m`);
    return partes.length > 0 ? partes.join(' ') : 'Recente';
  };

  // Função para agrupar pacientes por especialidade
  const agruparPorEspecialidade = (pacientes: any[]) => {
    return pacientes.reduce((acc, paciente) => {
      const especialidade = paciente.especialidadePaciente || 'Não especificada';
      (acc[especialidade] = acc[especialidade] || []).push(paciente);
      return acc;
    }, {} as Record<string, any[]>);
  };

  const renderListaComAgrupamento = (titulo: string, pacientes: any[], onRegularClick?: (paciente: any) => void, onAlta?: (setorId: string, leitoId: string) => void) => {
    const pacientesAgrupados = agruparPorEspecialidade(pacientes);
    
    return (
      <Card className="shadow-card border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            {titulo}
            <Badge variant="secondary">{pacientes.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {pacientes.length > 0 ? (
            <ScrollArea className="h-72 pr-4">
              <Accordion type="multiple" className="w-full">
                {Object.entries(pacientesAgrupados).map(([especialidade, pacientesDoGrupo]) => (
                  <AccordionItem key={especialidade} value={especialidade}>
                    <AccordionTrigger className="text-sm font-semibold py-2">
                      {especialidade} ({pacientesDoGrupo.length})
                    </AccordionTrigger>
                    <AccordionContent className="pl-2 space-y-1">
                      {pacientesDoGrupo.map(paciente => (
                        <PacientePendenteItem 
                          key={paciente.leitoId} 
                          paciente={paciente} 
                          onRegularClick={onRegularClick}
                          onAlta={onAlta}
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-8">Nenhum paciente aguardando regulação.</p>
          )}
        </CardContent>
      </Card>
    );
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
          setValidationResult({ setoresFaltantes, leitosFaltantes });
        } else {
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

          leitosOcupados.forEach(leitoOcupado => {
            if (leitoOcupado.dadosPaciente && !pacientesPlanilha.some(p => p.nomeCompleto === leitoOcupado.dadosPaciente?.nomePaciente)) {
              summary.altas.push({ 
                nomePaciente: leitoOcupado.dadosPaciente.nomePaciente, 
                leitoAntigo: leitoOcupado.codigoLeito 
              });
            }
          });

          pacientesPlanilha.forEach(pacientePlanilha => {
            const leitoAtual = leitosOcupados.find(l => l.dadosPaciente?.nomePaciente === pacientePlanilha.nomeCompleto);
            const leitoDaPlanilha = todosLeitos.find(l => l.codigoLeito === pacientePlanilha.leitoCodigo);

            if (!leitoDaPlanilha) return;

            if (leitoAtual) {
              if (leitoAtual.id !== leitoDaPlanilha.id) {
                summary.transferencias.push({ 
                  paciente: pacientePlanilha, 
                  leitoAntigo: leitoAtual.codigoLeito
                });
              }
            } else {
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

    const setoresAtualizados = JSON.parse(JSON.stringify(setores));

    try {
      for (const setor of setoresAtualizados) {
        for (const leito of setor.leitos) {
          if (leito.statusLeito === 'Ocupado') {
            leito.statusLeito = 'Vago';
            leito.dadosPaciente = null;
            leito.dataAtualizacaoStatus = agora;
          }
        }
      }

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

      setoresAtualizados.forEach(setor => {
        const setorRef = doc(db, 'setoresRegulaFacil', setor.id);
        batch.update(setorRef, { leitos: setor.leitos });
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      
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

  const handleOpenRegulacaoModal = (paciente: any) => {
    setPacienteParaRegular(paciente);
    setRegulacaoModalOpen(true);
  };

  const handleConfirmarRegulacao = async (leitoDestino: any, observacoes: string) => {
    if (!pacienteParaRegular) return;
    
    try {
      await confirmarRegulacao(pacienteParaRegular, pacienteParaRegular, leitoDestino, observacoes);
      setRegulacaoModalOpen(false);
      setPacienteParaRegular(null);
    } catch (error) {
      console.error('Erro ao confirmar regulação:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-medical-primary">Central de Regulação</h1>
          <p className="text-muted-foreground">Visão geral e controle das solicitações e pendências de leitos.</p>
        </header>

        <Card className="shadow-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-medical-primary">Indicadores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">Funcionalidade em desenvolvimento.</p>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-[70%]">
            <Card className="h-full shadow-card border border-border/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground italic text-center md:text-left">Área destinada aos filtros de busca (em desenvolvimento).</p>
              </CardContent>
            </Card>
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card border border-border/50">
            <CardHeader className="flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-base font-semibold">Aguardando UTI</CardTitle>
              <Badge variant="secondary">{pacientesAguardandoUTI.length}</Badge>
            </CardHeader>
            <CardContent className="p-2">
              {pacientesAguardandoUTI.length > 0 ? (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {pacientesAguardandoUTI.map(p => (
                    <AguardandoUTIItem 
                      key={p.leitoId}
                      paciente={p}
                      onCancel={() => cancelarPedidoUTI(p.setorId, p.leitoId)}
                      onTransfer={() => { /* lógica para abrir modal de transferência */ }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">Nenhum paciente aguardando UTI.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border border-border/50">
            <CardHeader className="flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-base font-semibold">Aguardando Transferência</CardTitle>
              <Badge variant="secondary">{pacientesAguardandoTransferencia.length}</Badge>
            </CardHeader>
            <CardContent className="p-2">
              {pacientesAguardandoTransferencia.length > 0 ? (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {pacientesAguardandoTransferencia.map(p => (
                    <AguardandoTransferenciaItem 
                      key={p.leitoId}
                      paciente={p}
                      onCancel={() => cancelarTransferencia(p.setorId, p.leitoId)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">Nenhuma transferência pendente.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border border-border/50">
            <CardHeader><CardTitle>Cirurgias Eletivas</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground italic">Aqui serão listados os pacientes que aguardam leito para cirurgia eletiva.</p></CardContent>
          </Card>
        </div>

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
                {renderListaComAgrupamento(
                  "Decisão Cirúrgica", 
                  decisaoCirurgica,
                  handleOpenRegulacaoModal
                )}
                {renderListaComAgrupamento(
                  "Decisão Clínica", 
                  decisaoClinica,
                  handleOpenRegulacaoModal
                )}
                {renderListaComAgrupamento(
                  "Recuperação Cirúrgica", 
                  recuperacaoCirurgica,
                  handleOpenRegulacaoModal,
                  altaAposRecuperacao
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2" className="border rounded-lg bg-card shadow-card">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">REMANEJAMENTOS PENDENTES</h3>
                <Badge variant="destructive">{pacientesAguardandoRemanejamento.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {pacientesAguardandoRemanejamento.length > 0 ? (
                <div className="space-y-2">
                  {pacientesAguardandoRemanejamento.map(alerta => (
                    <Card key={`${alerta.nomePaciente}-${alerta.leitoCodigo}`} className="p-3 border-medical-danger/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{alerta.nomePaciente}</p>
                          <p className="text-xs text-muted-foreground">{alerta.setorNome} - {alerta.leitoCodigo}</p>
                          <p className="text-xs text-medical-danger mt-1">{alerta.motivo}</p>
                        </div>
                        <div className="flex gap-1">
                          {alerta.isolamentos.map(iso => (
                            <Badge key={iso} variant="destructive" className="text-xs">{iso}</Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="italic text-muted-foreground text-center py-4">Nenhum remanejamento pendente.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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

        {pacienteParaRegular && (
          <RegulacaoModal
            open={regulacaoModalOpen}
            onOpenChange={setRegulacaoModalOpen}
            paciente={pacienteParaRegular}
            origem={{ setor: pacienteParaRegular.setorOrigem, leito: pacienteParaRegular.leitoCodigo }}
            onConfirmRegulacao={handleConfirmarRegulacao}
          />
        )}

      </div>
    </div>
  );
};

export default RegulacaoLeitos;
