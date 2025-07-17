// src/pages/RegulacaoLeitos.tsx

import { useState, useEffect, useMemo } from 'react'; // Adicionado useMemo e useEffect
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, BedDouble, Ambulance, X, Clock, Settings, CheckCircle, Pencil, XCircle, FileText, TrendingUp, Users, BrainCircuit, Scissors, Home, Menu, MessageSquarePlus, LogOut, LogIn, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useCirurgiasEletivas } from '@/hooks/useCirurgiasEletivas';
import { useCirurgias } from '@/hooks/useCirurgias';
import { useAlertasIsolamento } from '@/hooks/useAlertasIsolamento';
import { useFiltrosRegulacao } from '@/hooks/useFiltrosRegulacao';
import { FiltrosRegulacao } from '@/components/FiltrosRegulacao';
import { ImportacaoMVModal } from '@/components/modals/ImportacaoMVModal';
import { RegulacaoModal } from '@/components/modals/RegulacaoModal';
import { TransferenciaModal } from '@/components/modals/TransferenciaModal';
import { AlocacaoCirurgiaModal } from '@/components/modals/AlocacaoCirurgiaModal';
import { GerenciarTransferenciaModal } from '@/components/modals/GerenciarTransferenciaModal';
import { ResultadoValidacao } from '@/components/modals/ValidacaoImportacao';
import { AguardandoUTIItem } from '@/components/AguardandoUTIItem';
import { AguardandoTransferenciaItem } from '@/components/AguardandoTransferenciaItem';
import { PacientePendenteItem } from '@/components/PacientePendenteItem';
import { RemanejamentoPendenteItem } from '@/components/RemanejamentoPendenteItem';
import { CirurgiaEletivaItem } from '@/components/CirurgiaEletivaItem';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, writeBatch, arrayUnion, updateDoc, deleteDoc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isAfter, subDays, isValid, intervalToDuration, parse } from 'date-fns';
import { CancelamentoModal } from '@/components/modals/CancelamentoModal';
import { PacienteReguladoItem } from '@/components/PacienteReguladoItem';
import { ResumoRegulacoesModal } from '@/components/modals/ResumoRegulacoesModal';
import { useAuditoria } from '@/hooks/useAuditoria';

// --- Imports de Hooks (ATUALIZADO) ---
import { useSetores } from '@/hooks/useSetores';
import { useLeitos } from '@/hooks/useLeitos';
import { usePacientes } from '@/hooks/usePacientes';

// --- Tipos ---
import { Paciente, Leito, Setor, HistoricoMovimentacao, SolicitacaoCirurgicaFormData } from '@/types/hospital';

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
    altas: { paciente: Paciente, leitoAntigo: string }[];
}

const RegulacaoLeitos = () => {
  const { setores, loading: setoresLoading } = useSetores();
  const { leitos, loading: leitosLoading, atualizarStatusLeito } = useLeitos();
  const { pacientes, loading: pacientesLoading } = usePacientes();
  const { registrarLog } = useAuditoria();
  const { toast } = useToast();
  
  const { cirurgias, loading: cirurgiasLoading } = useCirurgiasEletivas();
  const { reservarLeitoParaCirurgia } = useCirurgias();
  const { alertas } = useAlertasIsolamento();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [regulacaoModalOpen, setRegulacaoModalOpen] = useState(false);
  const [cancelamentoModalOpen, setCancelamentoModalOpen] = useState(false);
  const [transferenciaModalOpen, setTransferenciaModalOpen] = useState(false);
  const [alocacaoCirurgiaModalOpen, setAlocacaoCirurgiaModalOpen] = useState(false);
  const [gerenciarTransferenciaOpen, setGerenciarTransferenciaOpen] = useState(false);
  const [pacienteParaRegular, setPacienteParaRegular] = useState<any | null>(null);
  const [pacienteParaAcao, setPacienteParaAcao] = useState<any | null>(null);
  const [cirurgiaParaAlocar, setCirurgiaParaAlocar] = useState<any | null>(null);
  const [isAlteracaoMode, setIsAlteracaoMode] = useState(false);
  const [validationResult, setValidationResult] = useState<ResultadoValidacao | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [dadosPlanilhaProcessados, setDadosPlanilhaProcessados] = useState<PacienteDaPlanilha[]>([]);
  const [modoRegulacao, setModoRegulacao] = useState<'normal' | 'uti'>('normal');
  const [resumoModalOpen, setResumoModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const pacientesComDadosCompletos = useMemo(() => {
    if (setoresLoading || leitosLoading || pacientesLoading) return [];

    const mapaSetores = new Map(setores.map(s => [s.id, s]));
    const mapaLeitos = new Map(leitos.map(l => [l.id, l]));

    return pacientes.map(paciente => {
      const leito = mapaLeitos.get(paciente.leitoId);
      const setor = leito ? mapaSetores.get(leito.setorId) : undefined;
      const historicoRecente = leito ? leito.historicoMovimentacao[leito.historicoMovimentacao.length - 1] : undefined;
      
      let paraSetorSigla = '';
      if (historicoRecente?.statusLeito === 'Regulado' && historicoRecente.infoRegulacao) {
        const setorDestino = setores.find(s => s.nomeSetor === historicoRecente.infoRegulacao!.paraSetor);
        paraSetorSigla = setorDestino?.siglaSetor || '';
      }

      return {
        ...paciente,
        leitoCodigo: leito?.codigoLeito || 'N/A',
        setorOrigem: setor?.nomeSetor || 'N/A',
        siglaSetorOrigem: setor?.siglaSetor || 'N/A',
        statusLeito: historicoRecente?.statusLeito || 'Vago',
        regulacao: historicoRecente?.infoRegulacao ? { ...historicoRecente.infoRegulacao, paraSetorSigla } : undefined
      };
    });
  }, [pacientes, leitos, setores, setoresLoading, leitosLoading, pacientesLoading]);

  const { filteredPacientes, ...filtrosProps } = useFiltrosRegulacao(pacientesComDadosCompletos);

  const pacientesAguardandoRegulacao = filteredPacientes.filter(p => p.statusLeito === 'Ocupado');
  const pacientesJaRegulados = filteredPacientes.filter(p => p.statusLeito === 'Regulado');
  const pacientesAguardandoUTI = filteredPacientes.filter(p => p.aguardaUTI);
  const pacientesAguardandoTransferencia = filteredPacientes.filter(p => p.transferirPaciente);
  const pacientesAguardandoRemanejamento = filteredPacientes.filter(p => p.remanejarPaciente);
  
  const decisaoCirurgica = pacientesAguardandoRegulacao.filter(p => p.setorOrigem === "PS DECISÃO CIRURGICA");
  const decisaoClinica = pacientesAguardandoRegulacao.filter(p => p.setorOrigem === "PS DECISÃO CLINICA");
  const recuperacaoCirurgica = pacientesAguardandoRegulacao.filter(p => p.setorOrigem === "CC - RECUPERAÇÃO");

  const totalPendentes = pacientesAguardandoRegulacao.length;

  // --- Funções Auxiliares ---
  const agruparPorEspecialidade = (pacientes: any[]) => {
    return pacientes.reduce((acc, paciente) => {
      const especialidade = paciente.especialidadePaciente || "Não especificada";
      (acc[especialidade] = acc[especialidade] || []).push(paciente);
      return acc;
    }, {} as Record<string, any[]>);
  };

  const calcularTempoEspera = (dataInicio: string): string => {
    const inicio = new Date(dataInicio);
    const duracao = intervalToDuration({ start: inicio, end: new Date() });
    const partes = [];
    if (duracao.days && duracao.days > 0) partes.push(`${duracao.days}d`);
    if (duracao.hours && duracao.hours > 0) partes.push(`${duracao.hours}h`);
    if (duracao.minutes) partes.push(`${duracao.minutes}m`);
    return partes.length > 0 ? partes.join(" ") : "Recente";
  };


  // --- Funções de Ação Recriadas ---
  const handleAlocarLeitoCirurgia = (cirurgia: any) => {
    setCirurgiaParaAlocar(cirurgia);
    setAlocacaoCirurgiaModalOpen(true);
  };

  const handleConfirmarAlocacaoCirurgia = async (cirurgia: any, leito: any) => {
    try {
      await reservarLeitoParaCirurgia(cirurgia.id, leito);
      setAlocacaoCirurgiaModalOpen(false);
      setCirurgiaParaAlocar(null);
    } catch (error) {
      console.error('Erro ao alocar leito para cirurgia:', error);
    }
  };

  const handleIniciarTransferenciaExterna = (paciente: any) => {
    setPacienteParaAcao(paciente);
    setTransferenciaModalOpen(true);
  };
  
  const handleGerenciarTransferencia = (paciente: any) => {
    setPacienteParaAcao(paciente);
    setGerenciarTransferenciaOpen(true);
  };

  const handleConfirmarTransferenciaExterna = async (destino: string, motivo: string) => {
    if (pacienteParaAcao) {
        const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteParaAcao.id);
        await updateDoc(pacienteRef, {
            transferirPaciente: true,
            destinoTransferencia: destino,
            motivoTransferencia: motivo,
            dataTransferencia: new Date().toISOString()
        });
        registrarLog(`Iniciou transferência externa para ${pacienteParaAcao.nomeCompleto}.`, "Regulação de Leitos");
    }
    setTransferenciaModalOpen(false);
    setPacienteParaAcao(null);
  };

  const handleConcluir = async (paciente: any) => {
    if (!paciente.regulacao) return;
    const leitoDestino = leitos.find(l => l.codigoLeito === paciente.regulacao.paraLeito);
    if (leitoDestino) {
        await atualizarStatusLeito(paciente.leitoId, 'Higienizacao');
        await atualizarStatusLeito(leitoDestino.id, 'Ocupado', { pacienteId: paciente.id });
        const pacienteRef = doc(db, 'pacientesRegulaFacil', paciente.id);
        await updateDoc(pacienteRef, { leitoId: leitoDestino.id, setorId: leitoDestino.setorId });
        registrarLog(`Concluiu regulação de ${paciente.nomeCompleto} para o leito ${leitoDestino.codigoLeito}.`, "Regulação de Leitos");
    }
  };

  const handleIniciarTransferenciaExternaFromUTI = (paciente: any) => {
    setPacienteParaAcao(paciente);
    setTransferenciaModalOpen(true);
  };

  const handleAlterar = (paciente: any) => {
    setPacienteParaRegular(paciente);
    setIsAlteracaoMode(true);
    setRegulacaoModalOpen(true);
  };

  const handleCancelar = (paciente: any) => {
    setPacienteParaAcao(paciente);
    setCancelamentoModalOpen(true);
  };

  const onConfirmarCancelamento = async (motivo: string) => {
    if (pacienteParaAcao) {
        const leitoOrigem = leitos.find(l => l.id === pacienteParaAcao.leitoId)!;
        const historicoRegulacao = leitoOrigem.historicoMovimentacao.find(h => h.statusLeito === 'Regulado');
        if(!historicoRegulacao) return;

        const leitoDestino = leitos.find(l => l.codigoLeito === historicoRegulacao.infoRegulacao?.paraLeito)!;
        
        await atualizarStatusLeito(leitoOrigem.id, 'Ocupado', { pacienteId: pacienteParaAcao.id });
        await atualizarStatusLeito(leitoDestino.id, 'Vago');
        
        registrarLog(`Cancelou regulação de ${pacienteParaAcao.nomeCompleto}. Motivo: ${motivo}`, "Regulação de Leitos");
    }
    setCancelamentoModalOpen(false);
    setPacienteParaAcao(null);
  };

  const handleOpenRegulacaoModal = (paciente: any, modo: 'normal' | 'uti' = 'normal') => {
    setPacienteParaRegular(paciente);
    setModoRegulacao(modo);
    setIsAlteracaoMode(false);
    setRegulacaoModalOpen(true);
  };

  const handleConfirmarRegulacao = async (leitoDestino: any, observacoes: string, motivoAlteracao?: string) => {
    if (!pacienteParaRegular) return;
    
    await atualizarStatusLeito(pacienteParaRegular.leitoId, 'Regulado', { 
        pacienteId: pacienteParaRegular.id, 
        infoRegulacao: { 
            paraSetor: leitoDestino.setorNome, 
            paraLeito: leitoDestino.codigoLeito,
            observacoes 
        } 
    });
    
    await atualizarStatusLeito(leitoDestino.id, 'Reservado', { pacienteId: pacienteParaRegular.id });

    setRegulacaoModalOpen(false);
    setPacienteParaRegular(null);
    setIsAlteracaoMode(false);
  };

  const cancelarPedidoUTI = async (paciente: Paciente) => {
    const pacienteRef = doc(db, "pacientesRegulaFacil", paciente.id);
    await updateDoc(pacienteRef, { aguardaUTI: false, dataPedidoUTI: null });
    registrarLog(`Cancelou pedido de UTI para ${paciente.nomeCompleto}.`, "Regulação de Leitos");
    toast({ title: "Sucesso", description: "Pedido de UTI cancelado." });
  };



  const handleCancelarRemanejamento = async (paciente: Paciente) => {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', paciente.id);
      await updateDoc(pacienteRef, { remanejarPaciente: false, motivoRemanejamento: null });
      registrarLog(`Cancelou solicitação de remanejamento para ${paciente.nomeCompleto}.`, "Regulação de Leitos");
  };

  // Integração com alertas de isolamento - CORREÇÃO DO LOOP INFINITO
  useEffect(() => {
    // Cria um mapa dos pacientes que já têm um remanejamento por motivo de contaminação.
    const mapaRemanejamentoContaminacao = new Map();
    todosPacientesPendentes.forEach((p) => {
      if (
        p.remanejarPaciente &&
        p.motivoRemanejamento?.startsWith("Risco de contaminação")
      ) {
        mapaRemanejamentoContaminacao.set(p.nomePaciente, p);
      }
    });

    // Cria um mapa dos pacientes que estão atualmente nos alertas.
    const mapaAlertas = new Map(alertas.map((a) => [a.nomePaciente, a]));

    // Ação 1: Adicionar remanejamento para novos alertas.
    mapaAlertas.forEach((alerta, nomePaciente) => {
      // SÓ cria a solicitação se o paciente do alerta AINDA NÃO estiver na lista de remanejamento.
      if (!mapaRemanejamentoContaminacao.has(nomePaciente)) {
        const pacienteParaRemanejar = todosPacientesPendentes.find(
          (p) => p.nomePaciente === nomePaciente
        );
        if (pacienteParaRemanejar) {
          console.log(`Disparando remanejamento para: ${nomePaciente}`); // Log para depuração
          solicitarRemanejamento(
            pacienteParaRemanejar.setorId,
            pacienteParaRemanejar.leitoId,
            alerta.motivo
          );
        }
      }
    });

    // Ação 2: Cancelar remanejamento se o alerta não existir mais.
    mapaRemanejamentoContaminacao.forEach((paciente, nomePaciente) => {
      // SÓ cancela se o paciente que estava em remanejamento NÃO ESTÁ MAIS na lista de alertas.
      if (!mapaAlertas.has(nomePaciente)) {
        console.log(`Cancelando remanejamento para: ${nomePaciente}`); // Log para depuração
        cancelarPedidoRemanejamento(paciente.setorId, paciente.leitoId);
      }
    });

    // As dependências agora são os arrays de dados, que só mudam quando há novas informações.
  }, [
    alertas,
    todosPacientesPendentes,
    solicitarRemanejamento,
    cancelarPedidoRemanejamento,
  ]);

  const renderListaComAgrupamento = (
    titulo: string,
    pacientes: any[],
    onRegularClick?: (paciente: any) => void,
    onAlta?: (setorId: string, leitoId: string) => void
  ) => {
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
                {Object.entries(pacientesAgrupados).map(
                  ([especialidade, pacientesDoGrupo]) => (
                    <AccordionItem key={especialidade} value={especialidade}>
                      <AccordionTrigger className="text-sm font-semibold py-2">
                        {especialidade} ({(pacientesDoGrupo as any[]).length})
                      </AccordionTrigger>
                      <AccordionContent className="pl-2 space-y-1">
                        {(pacientesDoGrupo as any[]).map((paciente) => (
                          <PacientePendenteItem
                            key={paciente.leitoId}
                            paciente={paciente}
                            onRegularClick={
                              onRegularClick
                                ? () => onRegularClick(paciente)
                                : undefined
                            }
                            onAlta={
                              onAlta
                                ? () =>
                                    onAlta(paciente.setorId, paciente.leitoId)
                                : undefined
                            }
                            onConcluir={handleConcluir}
                            onAlterar={handleAlterar}
                            onCancelar={handleCancelar}
                          />
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  )
                )}
              </Accordion>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-8">
              Nenhum paciente aguardando regulação.
            </p>
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
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        });

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

        const setoresCadastrados = new Set(setores.map((s) => s.nomeSetor));
        const leitosCadastrados: Record<string, Set<string>> = {};
        setores.forEach((s) => {
          leitosCadastrados[s.nomeSetor] = new Set(
            s.leitos.map((l) => l.codigoLeito)
          );
        });

        const setoresFaltantes = [...setoresPlanilha].filter(
          (s) => !setoresCadastrados.has(s)
        );

        const leitosFaltantes: Record<string, string[]> = {};
        Object.entries(leitosPlanilha).forEach(([setor, leitos]) => {
          if (setoresCadastrados.has(setor)) {
            const faltantes = [...leitos].filter(
              (l) => !leitosCadastrados[setor]?.has(l)
            );
            if (faltantes.length > 0) {
              leitosFaltantes[setor] = faltantes;
            }
          }
        });

        const temInconsistencias =
          setoresFaltantes.length > 0 ||
          Object.keys(leitosFaltantes).length > 0;

        if (temInconsistencias) {
          setValidationResult({ setoresFaltantes, leitosFaltantes });
        } else {
          const pacientesPlanilha: PacienteDaPlanilha[] = dadosPlanilha
            .map((row: any) => ({
              nomeCompleto: row[0]?.trim(),
              dataNascimento: row[1]?.trim(),
              sexo: (row[2]?.trim() === "F" ? "Feminino" : "Masculino") as
                | "Masculino"
                | "Feminino",
              dataInternacao: row[3]?.trim(),
              setorNome: row[4]?.trim(),
              leitoCodigo: row[6]?.trim(),
              especialidade: row[7]?.trim(),
            }))
            .filter((p) => p.nomeCompleto && p.leitoCodigo);

          // Validação de leitos bloqueados
          const todosLeitos = setores.flatMap((s) =>
            s.leitos.map((l) => ({ ...l, setorNome: s.nomeSetor }))
          );
          const conflitosLeitosBloqueados = pacientesPlanilha.filter(
            (paciente) => {
              const leito = todosLeitos.find(
                (l) => l.codigoLeito === paciente.leitoCodigo
              );
              return leito && leito.statusLeito === "Bloqueado";
            }
          );

          if (conflitosLeitosBloqueados.length > 0) {
            const conflitosDetalhados = conflitosLeitosBloqueados
              .map((p) => `${p.nomeCompleto} - Leito ${p.leitoCodigo}`)
              .join(", ");

            toast({
              title: "Erro: Leitos Bloqueados",
              description: `Os seguintes pacientes estão alocados em leitos bloqueados: ${conflitosDetalhados}`,
              variant: "destructive",
            });
            setProcessing(false);
            return;
          }

          // Gerar resumo das operações
          const leitosOcupados = todosLeitos.filter(
            (l) => l.statusLeito === "Ocupado"
          );
          const summary: SyncSummary = {
            novasInternacoes: [],
            transferencias: [],
            altas: [],
          };

          // Identificar altas
          leitosOcupados.forEach((leitoOcupado) => {
            if (
              leitoOcupado.dadosPaciente &&
              !pacientesPlanilha.some(
                (p) =>
                  p.nomeCompleto === leitoOcupado.dadosPaciente?.nomePaciente
              )
            ) {
              summary.altas.push({
                nomePaciente: leitoOcupado.dadosPaciente.nomePaciente,
                leitoAntigo: leitoOcupado.codigoLeito,
              });
            }
          });

          // Identificar transferências e novas internações
          pacientesPlanilha.forEach((pacientePlanilha) => {
            const leitoAtual = leitosOcupados.find(
              (l) =>
                l.dadosPaciente?.nomePaciente === pacientePlanilha.nomeCompleto
            );
            const leitoDaPlanilha = todosLeitos.find(
              (l) => l.codigoLeito === pacientePlanilha.leitoCodigo
            );

            if (!leitoDaPlanilha) return;

            if (leitoAtual) {
              if (leitoAtual.id !== leitoDaPlanilha.id) {
                summary.transferencias.push({
                  paciente: pacientePlanilha,
                  leitoAntigo: leitoAtual.codigoLeito,
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
          title: "Erro de Processamento",
          description:
            "Ocorreu um erro ao ler a planilha. Verifique o formato do arquivo.",
          variant: "destructive",
        });
      } finally {
        setProcessing(false);
      }
    };
    reader.onerror = (error) => {
      console.error("Erro ao ler o arquivo:", error);
      toast({
        title: "Erro de Leitura",
        description: "Não foi possível ler o arquivo selecionado.",
        variant: "destructive",
      });
      setProcessing(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleSync = async () => {
    if (!syncSummary || setoresLoading || leitosLoading || pacientesLoading) return;
    setIsSyncing(true);
  
    const batch = writeBatch(db);
    const agora = new Date().toISOString();
    
    const mapaLeitos = new Map(leitos.map(l => [l.codigoLeito, l]));
  
    try {
      // 1. Processar Altas: Deleta o paciente e atualiza o leito para "Higienização"
      for (const pacienteDeAlta of syncSummary.altas) {
        // Encontra o paciente completo no estado atual para obter IDs
        const pacienteOriginal = pacientes.find(p => p.nomeCompleto === pacienteDeAlta.nomePaciente);
        if (!pacienteOriginal) continue;

        const leitoRef = doc(db, 'leitosRegulaFacil', pacienteOriginal.leitoId);
        const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteOriginal.id);
  
        const historicoAlta: HistoricoMovimentacao = {
          statusLeito: 'Higienizacao',
          dataAtualizacaoStatus: agora,
        };
        batch.update(leitoRef, { historicoMovimentacao: arrayUnion(historicoAlta) });
        batch.delete(pacienteRef); // Deleta o documento do paciente
        
        registrarLog(`Alta (via importação) para ${pacienteDeAlta.nomePaciente} do leito ${pacienteDeAlta.leitoAntigo}.`, "Sincronização MV");
      }
  
      // 2. Processar Transferências: Atualiza o paciente e os dois leitos envolvidos
      for (const transferencia of syncSummary.transferencias) {
        const pacienteSistema = pacientes.find(p => p.nomeCompleto === transferencia.paciente.nomeCompleto)!;
        const leitoAntigo = leitos.find(l => l.id === pacienteSistema.leitoId)!;
        const leitoNovo = mapaLeitos.get(transferencia.paciente.leitoCodigo)!;

        const leitoAntigoRef = doc(db, 'leitosRegulaFacil', leitoAntigo.id);
        const leitoNovoRef = doc(db, 'leitosRegulaFacil', leitoNovo.id);
        const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteSistema.id);
  
        const historicoAlta: HistoricoMovimentacao = { statusLeito: 'Higienizacao', dataAtualizacaoStatus: agora };
        const historicoOcupacao: HistoricoMovimentacao = { statusLeito: 'Ocupado', dataAtualizacaoStatus: leitoAntigo.historicoMovimentacao.find(h => h.statusLeito === 'Ocupado')?.dataAtualizacaoStatus || agora, pacienteId: pacienteSistema.id };
  
        batch.update(leitoAntigoRef, { historicoMovimentacao: arrayUnion(historicoAlta) });
        batch.update(leitoNovoRef, { historicoMovimentacao: arrayUnion(historicoOcupacao) });
        batch.update(pacienteRef, { leitoId: leitoNovo.id, setorId: leitoNovo.setorId, especialidadePaciente: transferencia.paciente.especialidade });

        registrarLog(`Transferência (via importação) de ${pacienteSistema.nomeCompleto} do leito ${leitoAntigo.codigoLeito} para ${leitoNovo.codigoLeito}.`, "Sincronização MV");
      }
  
      // 3. Processar Novas Internações: Cria um novo paciente e atualiza o leito
      for (const novaInternacao of syncSummary.novasInternacoes) {
        const leito = mapaLeitos.get(novaInternacao.leitoCodigo)!;
        const leitoRef = doc(db, 'leitosRegulaFacil', leito.id);
        
        const pacienteRef = doc(collection(db, 'pacientesRegulaFacil'));
  
        const novoPaciente: Omit<Paciente, 'id'> = {
          leitoId: leito.id,
          setorId: leito.setorId,
          nomeCompleto: novaInternacao.nomeCompleto,
          dataNascimento: novaInternacao.dataNascimento,
          sexoPaciente: novaInternacao.sexo,
          dataInternacao: novaInternacao.dataInternacao,
          especialidadePaciente: novaInternacao.especialidade,
        };
        batch.set(pacienteRef, novoPaciente);
  
        const historicoOcupacao: HistoricoMovimentacao = { statusLeito: 'Ocupado', dataAtualizacaoStatus: agora, pacienteId: pacienteRef.id };
        batch.update(leitoRef, { historicoMovimentacao: arrayUnion(historicoOcupacao) });
        registrarLog(`Nova internação (via importação) para ${novaInternacao.nomeCompleto} no leito ${leito.codigoLeito}.`, "Sincronização MV");
      }
  
      await batch.commit();
      toast({ title: 'Sucesso!', description: 'Sincronização concluída com sucesso!' });
      setImportModalOpen(false);
  
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      toast({ title: 'Erro!', description: 'Não foi possível sincronizar os dados.', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
      setSyncSummary(null);
      setValidationResult(null);
      setDadosPlanilha([]);
    }
  };

return (
    <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-medical-primary">
            Central de Regulação
          </h1>
          <p className="text-muted-foreground">
            Visão geral e controle das solicitações e pendências de leitos.
          </p>
        </header>

        <Card className="shadow-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-medical-primary">
              Indicadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">
              Funcionalidade em desenvolvimento.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Card className="shadow-card border border-border/50">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setImportModalOpen(true)}
                    >
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pacientesAguardandoUTI.length > 0 && (
            <Card className="shadow-card border border-border/50">
              <CardHeader className="flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-base font-semibold">
                  Aguardando UTI
                </CardTitle>
                <Badge variant="secondary">
                  {pacientesAguardandoUTI.length}
                </Badge>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {pacientesAguardandoUTI.map((p) => (
                    <AguardandoUTIItem
                      key={p.id}
                      paciente={p}
                      onCancel={() => cancelarPedidoUTI(p)}
                      onTransfer={() => handleIniciarTransferenciaExterna(p)}
                      onRegularUTI={() => handleOpenRegulacaoModal(p, "uti")}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pacientesAguardandoTransferencia.length > 0 && (
            <Card className="shadow-card border border-border/50">
              <CardHeader className="flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-base font-semibold">
                  Aguardando Transferência
                </CardTitle>
                <Badge variant="secondary">
                  {pacientesAguardandoTransferencia.length}
                </Badge>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {pacientesAguardandoTransferencia.map((p) => (
                    <AguardandoTransferenciaItem
                      key={p.id}
                      paciente={p}
                      onCancel={() => {
                        const pacienteRef = doc(db, 'pacientesRegulaFacil', p.id);
                        updateDoc(pacienteRef, { transferirPaciente: false });
                      }}
                      onGerenciar={() => handleGerenciarTransferencia(p)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {cirurgias.length > 0 && (
            <Card className="shadow-card border border-border/50">
              <CardHeader className="flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-base font-semibold">
                  Cirurgias Eletivas (Próx. 48h)
                </CardTitle>
                <Badge variant="secondary">{cirurgias.length}</Badge>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {cirurgias.map((c) => (
                    <CirurgiaEletivaItem
                      key={c.id}
                      cirurgia={c}
                      onAlocarLeito={handleAlocarLeitoCirurgia}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Accordion type="multiple" className="w-full space-y-4" defaultValue={['item-1']}>
          <AccordionItem
            value="item-1"
            className="border rounded-lg bg-card shadow-card"
          >
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  Pacientes Aguardando Regulação
                </h3>
                <Badge>{totalPendentes}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-6">
              <FiltrosRegulacao {...filtrosProps} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <ListaPacientesPendentes
                    titulo="Decisão Cirúrgica"
                    pacientes={decisaoCirurgica}
                    onRegularClick={handleOpenRegulacaoModal}
                  />
                  <ListaPacientesPendentes
                    titulo="Decisão Clínica"
                    pacientes={decisaoClinica}
                    onRegularClick={handleOpenRegulacaoModal}
                  />
                  <ListaPacientesPendentes
                    titulo="Recuperação Cirúrgica"
                    pacientes={recuperacaoCirurgica}
                    onRegularClick={handleOpenRegulacaoModal}
                    onAlta={(setorId, leitoId) => atualizarStatusLeito(leitoId, 'Higienizacao')}
                  />
              </div>

              {pacientesJaRegulados.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      Pacientes Regulados
                      <Badge variant="secondary">
                        {pacientesJaRegulados.length}
                      </Badge>
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setResumoModalOpen(true)}
                    >
                      Ver Resumo
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {pacientesJaRegulados.map((paciente) => (
                      <PacienteReguladoItem
                        key={paciente.id}
                        paciente={paciente}
                        onConcluir={handleConcluir}
                        onAlterar={handleAlterar}
                        onCancelar={handleCancelar}
                      />
                    ))}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-2"
            className="border rounded-lg bg-card shadow-card"
          >
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  REMANEJAMENTOS PENDENTES
                </h3>
                <Badge variant="destructive">
                  {pacientesAguardandoRemanejamento.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {pacientesAguardandoRemanejamento.length > 0 ? (
                <div className="space-y-2">
                  {pacientesAguardandoRemanejamento.map((paciente) => (
                    <RemanejamentoPendenteItem
                      key={paciente.id}
                      paciente={paciente}
                      onRemanejar={() => handleOpenRegulacaoModal(paciente, "normal")}
                      onCancelar={() => handleCancelarRemanejamento(paciente)}
                    />
                  ))}
                </div>
              ) : (
                <p className="italic text-muted-foreground text-center py-4">
                  Nenhum remanejamento pendente.
                </p>
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
              setDadosPlanilhaProcessados([]);
            }
          }}
          onProcessFileRequest={handleProcessFileRequest}
          validationResult={validationResult}
          syncSummary={syncSummary}
          processing={processing}
          isSyncing={isSyncing}
          onConfirmSync={handleSync}
        />

        <CancelamentoModal
          open={cancelamentoModalOpen}
          onOpenChange={setCancelamentoModalOpen}
          onConfirm={onConfirmarCancelamento}
          paciente={pacienteParaAcao}
        />

        <ResumoRegulacoesModal
          open={resumoModalOpen}
          onOpenChange={setResumoModalOpen}
          pacientesRegulados={pacientesJaRegulados}
        />

        <TransferenciaModal
          open={transferenciaModalOpen}
          onOpenChange={setTransferenciaModalOpen}
          onConfirm={handleConfirmarTransferenciaExterna}
        />

        <GerenciarTransferenciaModal
          open={gerenciarTransferenciaOpen}
          onOpenChange={setGerenciarTransferenciaOpen}
          paciente={pacienteParaAcao}
        />

        <AlocacaoCirurgiaModal
          open={alocacaoCirurgiaModalOpen}
          onOpenChange={setAlocacaoCirurgiaModalOpen}
          cirurgia={cirurgiaParaAlocar}
          onAlocarLeito={handleConfirmarAlocacaoCirurgia}
        />

        {pacienteParaRegular && (
          <RegulacaoModal
            open={regulacaoModalOpen}
            onOpenChange={(isOpen) => {
              setRegulacaoModalOpen(isOpen);
              if (!isOpen) {
                setIsAlteracaoMode(false);
                setPacienteParaRegular(null);
                setModoRegulacao("normal");
              }
            }}
            paciente={pacienteParaRegular}
            origem={{
              setor: pacienteParaRegular.setorOrigem,
              leito: pacienteParaRegular.leitoCodigo,
            }}
            onConfirmRegulacao={handleConfirmarRegulacao}
            isAlteracao={isAlteracaoMode}
            modo={modoRegulacao}
          />
        )}
      </div>
    </div>
  );
};

export default RegulacaoLeitos;
