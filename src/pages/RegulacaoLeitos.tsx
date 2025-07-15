import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, BedDouble, Ambulance, X, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSetores } from '@/hooks/useSetores';
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
import { ListaPacientesPendentes } from '@/components/ListaPacientesPendentes';
import { AguardandoUTIItem } from '@/components/AguardandoUTIItem';
import { AguardandoTransferenciaItem } from '@/components/AguardandoTransferenciaItem';
import { PacientePendenteItem } from '@/components/PacientePendenteItem';
import { RemanejamentoPendenteItem } from '@/components/RemanejamentoPendenteItem';
import { CirurgiaEletivaItem } from '@/components/CirurgiaEletivaItem';
import { DadosPaciente } from '@/types/hospital';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { intervalToDuration, parse } from 'date-fns';
import { CancelamentoModal } from '@/components/modals/CancelamentoModal';
import { PacienteReguladoItem } from '@/components/PacienteReguladoItem';
import { ResumoRegulacoesModal } from '@/components/modals/ResumoRegulacoesModal';

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
  const { setores, loading: setoresLoading, cancelarPedidoUTI, cancelarTransferencia, altaAposRecuperacao, confirmarRegulacao, concluirRegulacao, cancelarRegulacao, cancelarPedidoRemanejamento, iniciarTransferenciaExterna, solicitarRemanejamento, cancelarRemanejamentoPendente } = useSetores();
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
  const [processing, setProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dadosPlanilhaProcessados, setDadosPlanilhaProcessados] = useState<PacienteDaPlanilha[]>([]);
  const [modoRegulacao, setModoRegulacao] = useState<'normal' | 'uti'>('normal');
  const [resumoModalOpen, setResumoModalOpen] = useState(false);
  const { toast } = useToast();

  const todosPacientesPendentes: (DadosPaciente & { setorOrigem: string; siglaSetorOrigem: string; setorId: string; leitoId: string; leitoCodigo: string; statusLeito: string; regulacao?: any })[] = setores
    .flatMap(setor => 
      setor.leitos
        .filter(leito => ['Ocupado', 'Regulado'].includes(leito.statusLeito) && leito.dadosPaciente)
        .map(leito => {
          let paraSetorSigla = '';
          if (leito.regulacao) {
            const setorDestino = setores.find(s => s.nomeSetor === leito.regulacao.paraSetor);
            paraSetorSigla = setorDestino?.siglaSetor || '';
          }

          return { 
            ...leito.dadosPaciente!,
            setorOrigem: setor.nomeSetor,
            siglaSetorOrigem: setor.siglaSetor,
            setorId: setor.id!,
            leitoId: leito.id,
            leitoCodigo: leito.codigoLeito,
            statusLeito: leito.statusLeito,
            regulacao: leito.regulacao ? { ...leito.regulacao, paraSetorSigla } : undefined
          };
        })
    );

  // Separar pacientes por status
  const pacientesAguardandoRegulacao = todosPacientesPendentes.filter(p => p.statusLeito === 'Ocupado');
  const pacientesJaRegulados = todosPacientesPendentes.filter(p => p.statusLeito === 'Regulado');

  // Usar o hook de filtros para os pacientes aguardando regulação
  const { searchTerm, setSearchTerm, filtrosAvancados, setFiltrosAvancados, filteredPacientes, resetFiltros } = useFiltrosRegulacao(pacientesAguardandoRegulacao);

  const decisaoCirurgica = filteredPacientes.filter(p => p.setorOrigem === "PS DECISÃO CIRURGICA");
  const decisaoClinica = filteredPacientes.filter(p => p.setorOrigem === "PS DECISÃO CLINICA");
  const recuperacaoCirurgica = filteredPacientes.filter(p => p.setorOrigem === "CC - RECUPERAÇÃO");
  const pacientesAguardandoUTI = todosPacientesPendentes.filter(p => p.aguardaUTI);
  const pacientesAguardandoTransferencia = todosPacientesPendentes.filter(p => p.transferirPaciente);
  const pacientesAguardandoRemanejamento = todosPacientesPendentes.filter(p => p.remanejarPaciente);

  const totalPendentes = filteredPacientes.length;

  const calcularTempoEspera = (dataInicio: string): string => {
    const inicio = new Date(dataInicio);
    const duracao = intervalToDuration({ start: inicio, end: new Date() });
    const partes = [];
    if (duracao.days && duracao.days > 0) partes.push(`${duracao.days}d`);
    if (duracao.hours && duracao.hours > 0) partes.push(`${duracao.hours}h`);
    if (duracao.minutes) partes.push(`${duracao.minutes}m`);
    return partes.length > 0 ? partes.join(' ') : 'Recente';
  };

  const agruparPorEspecialidade = (pacientes: any[]) => {
    return pacientes.reduce((acc, paciente) => {
      const especialidade = paciente.especialidadePaciente || 'Não especificada';
      (acc[especialidade] = acc[especialidade] || []).push(paciente);
      return acc;
    }, {} as Record<string, any[]>);
  };

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

  const handleConfirmarTransferenciaExterna = (destino: string, motivo: string) => {
    if (pacienteParaAcao) {
      iniciarTransferenciaExterna(pacienteParaAcao.setorId, pacienteParaAcao.leitoId, destino, motivo);
      setTransferenciaModalOpen(false);
      setPacienteParaAcao(null);
    }
  };

  const handleConcluir = (paciente: any) => {
    concluirRegulacao(paciente);
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

  const handleCancelarRemanejamento = (paciente: any) => {
    cancelarPedidoRemanejamento(paciente.setorId, paciente.leitoId);
  };

  const onConfirmarCancelamento = (motivo: string) => {
    if (pacienteParaAcao) {
      cancelarRegulacao(pacienteParaAcao, motivo);
    }
    setCancelamentoModalOpen(false);
    setPacienteParaAcao(null);
  };

  // Integração com alertas de isolamento
  useEffect(() => {
    const pacientesEmRemanejamento = todosPacientesPendentes.filter(p => p.remanejarPaciente);

    // Adicionar pacientes dos alertas que não estão na lista de remanejamento
    alertas.forEach(alerta => {
      const jaExiste = pacientesEmRemanejamento.some(p => p.nomePaciente === alerta.nomePaciente);
      if (!jaExiste) {
        const pacienteParaRemanejar = todosPacientesPendentes.find(p => p.nomePaciente === alerta.nomePaciente);
        if (pacienteParaRemanejar) {
          solicitarRemanejamento(pacienteParaRemanejar.setorId, pacienteParaRemanejar.leitoId, alerta.motivo);
        }
      }
    });

    // Remover da lista de remanejamento se o alerta não existir mais
    pacientesEmRemanejamento.forEach(paciente => {
      if (paciente.motivoRemanejamento?.startsWith('Risco de contaminação')) {
        const aindaEmAlerta = alertas.some(a => a.nomePaciente === paciente.nomePaciente);
        if (!aindaEmAlerta) {
          cancelarRemanejamentoPendente(paciente.setorId, paciente.leitoId);
        }
      }
    });
  }, [alertas, todosPacientesPendentes, solicitarRemanejamento, cancelarRemanejamentoPendente]);

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
                      {especialidade} ({(pacientesDoGrupo as any[]).length})
                    </AccordionTrigger>
                    <AccordionContent className="pl-2 space-y-1">
                      {(pacientesDoGrupo as any[]).map(paciente => (
                        <PacientePendenteItem 
                          key={paciente.leitoId} 
                          paciente={paciente} 
                          onRegularClick={onRegularClick ? () => onRegularClick(paciente) : undefined}
                          onAlta={onAlta ? () => onAlta(paciente.setorId, paciente.leitoId) : undefined}
                          onConcluir={handleConcluir}
                          onAlterar={handleAlterar}
                          onCancelar={handleCancelar}
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

          // Validação de leitos bloqueados
          const todosLeitos = setores.flatMap(s => s.leitos.map(l => ({ ...l, setorNome: s.nomeSetor })));
          const conflitosLeitosBloqueados = pacientesPlanilha.filter(paciente => {
            const leito = todosLeitos.find(l => l.codigoLeito === paciente.leitoCodigo);
            return leito && leito.statusLeito === 'Bloqueado';
          });

          if (conflitosLeitosBloqueados.length > 0) {
            const conflitosDetalhados = conflitosLeitosBloqueados.map(p => 
              `${p.nomeCompleto} - Leito ${p.leitoCodigo}`
            ).join(', ');
            
            toast({
              title: 'Erro: Leitos Bloqueados',
              description: `Os seguintes pacientes estão alocados em leitos bloqueados: ${conflitosDetalhados}`,
              variant: 'destructive',
            });
            setProcessing(false);
            return;
          }

          // Gerar resumo das operações
          const leitosOcupados = todosLeitos.filter(l => l.statusLeito === 'Ocupado');
          const summary: SyncSummary = { novasInternacoes: [], transferencias: [], altas: [] };

          // Identificar altas
          leitosOcupados.forEach(leitoOcupado => {
            if (leitoOcupado.dadosPaciente && !pacientesPlanilha.some(p => p.nomeCompleto === leitoOcupado.dadosPaciente?.nomePaciente)) {
              summary.altas.push({ 
                nomePaciente: leitoOcupado.dadosPaciente.nomePaciente, 
                leitoAntigo: leitoOcupado.codigoLeito 
              });
            }
          });

          // Identificar transferências e novas internações
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
      // FASE 1: PRÉ-PROCESSAMENTO - Limpar leitos com status específicos
      console.log('Fase 1: Pré-processamento - limpando leitos...');
      for (const setor of setoresAtualizados) {
        for (const leito of setor.leitos) {
          if (['Reservado', 'Regulado', 'Higienizacao'].includes(leito.statusLeito)) {
            leito.dadosPaciente = null;
            leito.regulacao = null;
            leito.statusLeito = 'Vago';
            leito.dataAtualizacaoStatus = agora;
          }
        }
      }

      // FASE 2: PROCESSAR ALTAS - Pacientes que saíram (estão no sistema mas não na planilha)
      console.log('Fase 2: Processando altas...');
      const leitosOcupados = setoresAtualizados.flatMap(s => 
        s.leitos.filter(l => l.statusLeito === 'Ocupado' && l.dadosPaciente)
      );

      for (const leitoOcupado of leitosOcupados) {
        const pacienteAindaInternado = dadosPlanilhaProcessados.some(p => 
          p.nomeCompleto === leitoOcupado.dadosPaciente?.nomePaciente
        );
        
        if (!pacienteAindaInternado) {
          // Alta do paciente
          leitoOcupado.dadosPaciente = null;
          leitoOcupado.regulacao = null;
          leitoOcupado.statusLeito = 'Vago';
          leitoOcupado.dataAtualizacaoStatus = agora;
        }
      }

      // FASE 3: PROCESSAR TRANSFERÊNCIAS E MOVIMENTAÇÕES
      console.log('Fase 3: Processando transferências e movimentações...');
      const todosLeitosAtualizados = setoresAtualizados.flatMap(s => 
        s.leitos.map(l => ({ ...l, setorNome: s.nomeSetor }))
      );

      for (const pacientePlanilha of dadosPlanilhaProcessados) {
        // Verificar se o paciente já existe no sistema
        const leitoAtualPaciente = todosLeitosAtualizados.find(l => 
          l.dadosPaciente?.nomePaciente === pacientePlanilha.nomeCompleto
        );
        
        const leitoDestinoPlanilha = todosLeitosAtualizados.find(l => 
          l.codigoLeito === pacientePlanilha.leitoCodigo
        );

        if (!leitoDestinoPlanilha) continue;

        if (leitoAtualPaciente && leitoAtualPaciente.id !== leitoDestinoPlanilha.id) {
          // É uma transferência - limpar leito origem
          const setorOrigem = setoresAtualizados.find(s => 
            s.leitos.some(l => l.id === leitoAtualPaciente.id)
          );
          if (setorOrigem) {
            const leitoOrigem = setorOrigem.leitos.find(l => l.id === leitoAtualPaciente.id);
            if (leitoOrigem) {
              leitoOrigem.dadosPaciente = null;
              leitoOrigem.regulacao = null;
              leitoOrigem.statusLeito = 'Vago';
              leitoOrigem.dataAtualizacaoStatus = agora;
            }
          }
        }
      }

      // FASE 4: PROCESSAR NOVAS INTERNAÇÕES E ATUALIZAÇÕES DE DESTINO
      console.log('Fase 4: Processando novas internações e atualizações...');
      for (const pacientePlanilha of dadosPlanilhaProcessados) {
        const setorDestino = setoresAtualizados.find(s => s.nomeSetor === pacientePlanilha.setorNome);
        if (!setorDestino) continue;

        const leitoDestino = setorDestino.leitos.find(l => l.codigoLeito === pacientePlanilha.leitoCodigo);
        if (!leitoDestino) continue;

        // Atualizar o leito de destino com os dados do paciente
        leitoDestino.statusLeito = 'Ocupado';
        leitoDestino.dataAtualizacaoStatus = agora;
        leitoDestino.dadosPaciente = {
          nomePaciente: pacientePlanilha.nomeCompleto,
          dataNascimento: pacientePlanilha.dataNascimento,
          sexoPaciente: pacientePlanilha.sexo,
          dataInternacao: pacientePlanilha.dataInternacao,
          especialidadePaciente: pacientePlanilha.especialidade
        };
      }

      // FASE 5: EXECUÇÃO EM BATCH NO FIRESTORE
      console.log('Fase 5: Salvando alterações no Firestore...');
      setoresAtualizados.forEach(setor => {
        const setorRef = doc(db, 'setoresRegulaFacil', setor.id);
        batch.update(setorRef, { leitos: setor.leitos });
      });

      // Simular delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Commit das alterações
      await batch.commit();
      
      toast({ 
        title: 'Sucesso!', 
        description: `Sincronização concluída! ${dadosPlanilhaProcessados.length} operações realizadas com sucesso.`,
      });
      
      setImportModalOpen(false);
      
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      toast({ 
        title: 'Erro na Sincronização!', 
        description: 'Não foi possível sincronizar os dados. Tente novamente.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSyncing(false);
      setSyncSummary(null);
      setValidationResult(null);
    }
  };

  const handleOpenRegulacaoModal = (paciente: any, modo: 'normal' | 'uti' = 'normal') => {
    setPacienteParaRegular(paciente);
    setModoRegulacao(modo);
    setIsAlteracaoMode(false);
    setRegulacaoModalOpen(true);
  };

  const handleConfirmarRegulacao = async (leitoDestino: any, observacoes: string, motivoAlteracao?: string) => {
    if (!pacienteParaRegular) return;
    
    try {
      await confirmarRegulacao(pacienteParaRegular, pacienteParaRegular, leitoDestino, observacoes);
      setRegulacaoModalOpen(false);
      setPacienteParaRegular(null);
      setIsAlteracaoMode(false);
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

        <div className="flex justify-end">
          <Card className="shadow-card border border-border/50">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pacientesAguardandoUTI.length > 0 && (
            <Card className="shadow-card border border-border/50">
              <CardHeader className="flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-base font-semibold">Aguardando UTI</CardTitle>
                <Badge variant="secondary">{pacientesAguardandoUTI.length}</Badge>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {pacientesAguardandoUTI.map(p => (
                    <AguardandoUTIItem 
                      key={p.leitoId}
                      paciente={p}
                      onCancel={() => cancelarPedidoUTI(p.setorId, p.leitoId)}
                      onTransfer={() => handleIniciarTransferenciaExterna(p)}
                      onRegularUTI={() => handleOpenRegulacaoModal(p, 'uti')}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pacientesAguardandoTransferencia.length > 0 && (
            <Card className="shadow-card border border-border/50">
              <CardHeader className="flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-base font-semibold">Aguardando Transferência</CardTitle>
                <Badge variant="secondary">{pacientesAguardandoTransferencia.length}</Badge>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {pacientesAguardandoTransferencia.map(p => (
                    <AguardandoTransferenciaItem 
                      key={p.leitoId}
                      paciente={p}
                      onCancel={() => cancelarTransferencia(p.setorId, p.leitoId)}
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
                <CardTitle className="text-base font-semibold">Cirurgias Eletivas (Próx. 48h)</CardTitle>
                <Badge variant="secondary">{cirurgias.length}</Badge>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {cirurgias.map(c => (
                    <CirurgiaEletivaItem key={c.id} cirurgia={c} onAlocarLeito={handleAlocarLeitoCirurgia} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Accordion type="multiple" className="w-full space-y-4">
          <AccordionItem value="item-1" className="border rounded-lg bg-card shadow-card">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">Pacientes Aguardando Regulação</h3>
                <Badge>{totalPendentes}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-6">
              <FiltrosRegulacao
                filtros={filtrosAvancados}
                setFiltros={setFiltrosAvancados}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                resetFiltros={resetFiltros}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="shadow-card border border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                      Decisão Cirúrgica 
                      <Badge variant="secondary">{decisaoCirurgica.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-72 pr-4">
                      <div className="space-y-1">
                        {decisaoCirurgica
                          .sort((a, b) => a.nomePaciente.localeCompare(b.nomePaciente))
                          .map(paciente => (
                            <PacientePendenteItem 
                              key={paciente.leitoId}
                              paciente={paciente}
                              onRegularClick={() => handleOpenRegulacaoModal(paciente)}
                              onAlta={() => altaAposRecuperacao(paciente.setorId, paciente.leitoId)}
                              onConcluir={handleConcluir}
                              onAlterar={handleAlterar}
                              onCancelar={handleCancelar}
                            />
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="shadow-card border border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                      Decisão Clínica 
                      <Badge variant="secondary">{decisaoClinica.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-72 pr-4">
                      <div className="space-y-1">
                        {decisaoClinica
                          .sort((a, b) => a.nomePaciente.localeCompare(b.nomePaciente))
                          .map(paciente => (
                            <PacientePendenteItem 
                              key={paciente.leitoId}
                              paciente={paciente}
                              onRegularClick={() => handleOpenRegulacaoModal(paciente)}
                              onAlta={() => altaAposRecuperacao(paciente.setorId, paciente.leitoId)}
                              onConcluir={handleConcluir}
                              onAlterar={handleAlterar}
                              onCancelar={handleCancelar}
                            />
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="shadow-card border border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                      Recuperação Cirúrgica 
                      <Badge variant="secondary">{recuperacaoCirurgica.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-72 pr-4">
                      <div className="space-y-1">
                        {recuperacaoCirurgica
                          .sort((a, b) => a.nomePaciente.localeCompare(b.nomePaciente))
                          .map(paciente => (
                            <PacientePendenteItem 
                              key={paciente.leitoId}
                              paciente={paciente}
                              onRegularClick={() => handleOpenRegulacaoModal(paciente)}
                              onAlta={() => altaAposRecuperacao(paciente.setorId, paciente.leitoId)}
                              onConcluir={handleConcluir}
                              onAlterar={handleAlterar}
                              onCancelar={handleCancelar}
                            />
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {pacientesJaRegulados.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      Pacientes Regulados
                      <Badge variant="secondary">{pacientesJaRegulados.length}</Badge>
                    </h4>
                    <Button size="sm" variant="outline" onClick={() => setResumoModalOpen(true)}>
                      Ver Resumo
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {pacientesJaRegulados.map(paciente => (
                      <PacienteReguladoItem 
                        key={paciente.leitoId}
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
                  {pacientesAguardandoRemanejamento.map(paciente => (
                    <RemanejamentoPendenteItem 
                      key={`${paciente.nomePaciente}-${paciente.leitoCodigo}`} 
                      paciente={paciente}
                      onRemanejar={() => handleOpenRegulacaoModal(paciente, 'normal')}
                      onCancelar={handleCancelarRemanejamento}
                    />
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
                setModoRegulacao('normal');
              }
            }}
            paciente={pacienteParaRegular}
            origem={{ setor: pacienteParaRegular.setorOrigem, leito: pacienteParaRegular.leitoCodigo }}
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
