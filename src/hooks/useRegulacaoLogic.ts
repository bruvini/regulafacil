import { useState, useEffect, useMemo, useCallback } from "react";
import { useCirurgiasEletivas } from "@/hooks/useCirurgiasEletivas";
import { useCirurgias } from "@/hooks/useCirurgias";
import { useAlertasIsolamento } from "@/hooks/useAlertasIsolamento";
import { useFiltrosRegulacao } from "@/hooks/useFiltrosRegulacao";
import { useToast } from "@/hooks/use-toast";
import { useAuditoria } from "@/hooks/useAuditoria";
import { useSetores } from "@/hooks/useSetores";
import { useLeitos } from "@/hooks/useLeitos";
import { usePacientes } from "@/hooks/usePacientes";
import { Paciente } from "@/types/hospital";
import {
  ResultadoValidacao,
  SyncSummary,
  PacienteDaPlanilha,
} from "@/components/modals/ValidacaoImportacao";
import {
  collection,
  doc,
  writeBatch,
  arrayUnion,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { intervalToDuration } from "date-fns";
import * as XLSX from "xlsx";

export const useRegulacaoLogic = () => {
  const { setores, loading: setoresLoading } = useSetores();
  const { leitos, loading: leitosLoading, atualizarStatusLeito } = useLeitos();
  const { pacientes, loading: pacientesLoading } = usePacientes();
  const { registrarLog } = useAuditoria();
  const { toast } = useToast();
  const { cirurgias, loading: cirurgiasLoading } = useCirurgias();
  const { reservarLeitoParaCirurgia } = useCirurgias();
  const { alertas } = useAlertasIsolamento();

  // Estados dos modais
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [regulacaoModalOpen, setRegulacaoModalOpen] = useState(false);
  const [cancelamentoModalOpen, setCancelamentoModalOpen] = useState(false);
  const [transferenciaModalOpen, setTransferenciaModalOpen] = useState(false);
  const [alocacaoCirurgiaModalOpen, setAlocacaoCirurgiaModalOpen] = useState(false);
  const [gerenciarTransferenciaOpen, setGerenciarTransferenciaOpen] = useState(false);
  const [resumoModalOpen, setResumoModalOpen] = useState(false);
  const [sugestoesModalOpen, setSugestoesModalOpen] = useState(false);

  // Estados de dados
  const [pacienteParaRegular, setPacienteParaRegular] = useState<any | null>(null);
  const [pacienteParaAcao, setPacienteParaAcao] = useState<any | null>(null);
  const [cirurgiaParaAlocar, setCirurgiaParaAlocar] = useState<any | null>(null);
  const [isAlteracaoMode, setIsAlteracaoMode] = useState(false);
  const [validationResult, setValidationResult] = useState<ResultadoValidacao | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [dadosPlanilhaProcessados, setDadosPlanilhaProcessados] = useState<PacienteDaPlanilha[]>([]);
  const [modoRegulacao, setModoRegulacao] = useState<"normal" | "uti">("normal");
  const [processing, setProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Função auxiliar para calcular idade
  const calcularIdade = (dataNascimento: string): number => {
    if (!dataNascimento) return 0;
    
    let nascimento: Date;
    
    if (dataNascimento.includes('/')) {
      const [dia, mes, ano] = dataNascimento.split('/').map(Number);
      nascimento = new Date(ano, mes - 1, dia);
    } else if (dataNascimento.includes('-')) {
      nascimento = new Date(dataNascimento);
    } else {
      return 0;
    }
    
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  const getQuartoId = (codigoLeito: string): string => {
    return codigoLeito.split('-')[0];
  };

  // Lógica de Combinação de Dados
  const pacientesComDadosCompletos = useMemo(() => {
    if (setoresLoading || leitosLoading || pacientesLoading) return [];
    const mapaSetores = new Map(setores.map((s) => [s.id, s]));
    const mapaLeitos = new Map(leitos.map((l) => [l.id, l]));

    return pacientes.map((paciente) => {
      const leito = mapaLeitos.get(paciente.leitoId);
      const setor = leito ? mapaSetores.get(leito.setorId) : undefined;
      const historicoRecente = leito
        ? leito.historicoMovimentacao[leito.historicoMovimentacao.length - 1]
        : undefined;

      let paraSetorSigla = "";
      if (
        historicoRecente?.statusLeito === "Regulado" &&
        historicoRecente.infoRegulacao
      ) {
        const setorDestino = setores.find(
          (s) => s.nomeSetor === historicoRecente.infoRegulacao!.paraSetor
        );
        paraSetorSigla = setorDestino?.siglaSetor || "";
      }

      const pacienteCompleto = {
        ...paciente,
        leitoCodigo: leito?.codigoLeito || "N/A",
        setorOrigem: setor?.nomeSetor || "N/A",
        siglaSetorOrigem: setor?.siglaSetor || "N/A",
        statusLeito: historicoRecente?.statusLeito || "Vago",
        regulacao: historicoRecente?.infoRegulacao
          ? { ...historicoRecente.infoRegulacao, paraSetorSigla, dataAtualizacaoStatus: historicoRecente.dataAtualizacaoStatus }
          : undefined,
      };

      return pacienteCompleto;
    });
  }, [pacientes, leitos, setores, setoresLoading, leitosLoading, pacientesLoading]);

  // Lógica Inteligente de Sugestões de Regulação Refinada
  const sugestoesDeRegulacao = useMemo(() => {
    if (setoresLoading || leitosLoading || pacientesLoading) return [];

    const setoresPermitidos = [
      "UNID. CIRURGICA",
      "UNID. CLINICA MEDICA", 
      "UNID. INT. GERAL - UIG",
      "UNID. JS ORTOPEDIA",
      "UNID. NEFROLOGIA TRANSPLANTE",
      "UNID. ONCOLOGIA"
    ];

    const pacientesRelevantes = pacientesComDadosCompletos.filter(
      (p) =>
        p.setorOrigem === "PS DECISÃO CIRURGICA" ||
        p.setorOrigem === "PS DECISÃO CLINICA" ||
        p.setorOrigem === "CC - RECUPERAÇÃO"
    );

    const mapaSetores = new Map(setores.map((s) => [s.id, s]));
    const leitosDisponiveis = leitos.filter((leito) => {
      const historicoRecente = leito.historicoMovimentacao[leito.historicoMovimentacao.length - 1];
      const setor = mapaSetores.get(leito.setorId);
      return (
        (historicoRecente.statusLeito === 'Vago' || historicoRecente.statusLeito === 'Higienizacao') &&
        setor && setoresPermitidos.includes(setor.nomeSetor)
      );
    });

    // Configuração das especialidades compatíveis por setor
    const especialidadesCompatíveis: Record<string, string[]> = {
      'UNID. JS ORTOPEDIA': ['NEUROCIRURGIA', 'ODONTOLOGIA C.TRAUM.B.M.F.', 'ORTOPEDIA/TRAUMATOLOGIA'],
      'UNID. INT. GERAL - UIG': ['CLINICA GERAL', 'INTENSIVISTA', 'NEUROLOGIA', 'PROCTOLOGIA', 'UROLOGIA'],
      'UNID. CLINICA MEDICA': ['CLINICA GERAL', 'INTENSIVISTA', 'NEUROLOGIA', 'PROCTOLOGIA', 'UROLOGIA'],
      'UNID. ONCOLOGIA': ['ONCOLOGIA CIRURGICA', 'ONCOLOGIA CLINICA/CANCEROLOGIA'],
      'UNID. CIRURGICA': ['CIRURGIA CABECA E PESCOCO', 'CIRURGIA GERAL', 'CIRURGIA TORACICA', 'CIRURGIA VASCULAR', 'NEUROCIRURGIA', 'PROCTOLOGIA', 'UROLOGIA', 'ONCOLOGIA CIRURGICA'],
      'UNID. NEFROLOGIA TRANSPLANTE': ['NEFROLOGIA'],
    };

    const sugestoesPorLeito = leitosDisponiveis
      .map((leito) => {
        const setor = mapaSetores.get(leito.setorId);
        const setorNome = setor?.nomeSetor || '';
        
        const quartoId = getQuartoId(leito.codigoLeito);
        const leitosDoQuarto = leitos.filter(
          (l) => l.setorId === leito.setorId && getQuartoId(l.codigoLeito) === quartoId
        );
        
        const pacientesDoQuarto = leitosDoQuarto
          .map((l) => {
            const historico = l.historicoMovimentacao[l.historicoMovimentacao.length - 1];
            return historico.statusLeito === 'Ocupado' ? pacientesComDadosCompletos.find(p => p.id === historico.pacienteId) : null;
          })
          .filter(Boolean);

        const temIsolamentoNoQuarto = pacientesDoQuarto.some(p => 
          p?.isolamentosVigentes && p.isolamentosVigentes.length > 0
        );

        const pacientesElegiveis = pacientesRelevantes.filter((paciente) => {
          // 1. Filtro de especialidade por setor
          const especialidadesSetor = especialidadesCompatíveis[setorNome] || [];
          if (especialidadesSetor.length > 0 && !especialidadesSetor.includes(paciente.especialidadePaciente || '')) {
            return false;
          }

          // 2. Filtro de gênero para quartos compartilhados
          if (pacientesDoQuarto.length > 0) {
            const sexoDoQuarto = pacientesDoQuarto[0]?.sexoPaciente;
            if (sexoDoQuarto && paciente.sexoPaciente !== sexoDoQuarto) {
              return false;
            }
          }

          // 3. Filtro de isolamento
          const pacientePrecisaIsolamento = paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0;
          
          if (pacientePrecisaIsolamento && !leito.leitoIsolamento) {
            return false;
          }

          if (temIsolamentoNoQuarto && !pacientePrecisaIsolamento) {
            return false;
          }

          // 4. Filtro de idade para leitos PCP
          if (leito.leitoPCP) {
            const idade = calcularIdade(paciente.dataNascimento);
            if (idade < 18 || idade > 60) {
              return false;
            }
          }

          return true;
        });

        const pacientesOrdenados = pacientesElegiveis.sort((a, b) => {
          const compatíveisSetor = especialidadesCompatíveis[setorNome] || [];
          
          const aCompatível = compatíveisSetor.includes(a.especialidadePaciente || '');
          const bCompatível = compatíveisSetor.includes(b.especialidadePaciente || '');

          if (aCompatível && !bCompatível) return -1;
          if (!aCompatível && bCompatível) return 1;

          return new Date(a.dataInternacao).getTime() - new Date(b.dataInternacao).getTime();
        });

        return {
          setor: setorNome,
          sugestao: {
            leito: {
              ...leito,
              setorNome: setorNome,
              statusLeito: leito.historicoMovimentacao[leito.historicoMovimentacao.length - 1].statusLeito,
            },
            pacientesElegiveis: pacientesOrdenados,
          }
        };
      })
      .filter((item) => item.sugestao.pacientesElegiveis.length > 0);

    const agrupamento = sugestoesPorLeito.reduce((acc, item) => {
      const setorNome = item.setor;
      const grupoExistente = acc.find(g => g.setorNome === setorNome);
      
      if (grupoExistente) {
        grupoExistente.sugestoes.push(item.sugestao);
      } else {
        acc.push({
          setorNome,
          sugestoes: [item.sugestao]
        });
      }
      
      return acc;
    }, [] as Array<{ setorNome: string; sugestoes: any[] }>);

    return agrupamento;
  }, [pacientesComDadosCompletos, leitos, setores, setoresLoading, leitosLoading, pacientesLoading]);

  // Filtragem e Listas Derivadas
  const {
    filteredPacientes,
    searchTerm,
    setSearchTerm,
    filtrosAvancados,
    setFiltrosAvancados,
    resetFiltros,
    sortConfig,
    setSortConfig,
    aplicarOrdenacaoALista,
  } = useFiltrosRegulacao(pacientesComDadosCompletos);

  const pacientesAguardandoRegulacao = filteredPacientes.filter(
    (p) => p.statusLeito === "Ocupado"
  );
  const pacientesJaRegulados = filteredPacientes.filter(
    (p) => p.statusLeito === "Regulado"
  );
  const pacientesAguardandoUTI = filteredPacientes.filter(
        (p) => p.aguardaUTI && !p.transferirPaciente
    );
  const pacientesAguardandoTransferencia = filteredPacientes.filter(
    (p) => p.transferirPaciente
  );
  const pacientesAguardandoRemanejamento = filteredPacientes.filter(
    (p) => p.remanejarPaciente && p.statusLeito !== 'Regulado'
  );

  // Aplica ordenação às listas específicas
  const decisaoCirurgica = useMemo(() => 
    aplicarOrdenacaoALista(pacientesAguardandoRegulacao.filter(
      (p) => p.setorOrigem === "PS DECISÃO CIRURGICA"
    )), [pacientesAguardandoRegulacao, aplicarOrdenacaoALista]
  );

  const decisaoClinica = useMemo(() => 
    aplicarOrdenacaoALista(pacientesAguardandoRegulacao.filter(
      (p) => p.setorOrigem === "PS DECISÃO CLINICA"
    )), [pacientesAguardandoRegulacao, aplicarOrdenacaoALista]
  );

  const recuperacaoCirurgica = useMemo(() => 
    aplicarOrdenacaoALista(pacientesAguardandoRegulacao.filter(
      (p) => p.setorOrigem === "CC - RECUPERAÇÃO"
    )), [pacientesAguardandoRegulacao, aplicarOrdenacaoALista]
  );

  const totalPendentes = decisaoCirurgica.length + decisaoClinica.length + recuperacaoCirurgica.length;

  // Funções de Ação - usando useCallback para evitar re-renderizações desnecessárias
  const handleOpenRegulacaoModal = useCallback((
    paciente: any,
    modo: "normal" | "uti" = "normal"
  ) => {
    setPacienteParaRegular(paciente);
    setModoRegulacao(modo);
    setIsAlteracaoMode(false);
    setRegulacaoModalOpen(true);
  }, []);

  const handleConfirmarRegulacao = useCallback(async (
    leitoDestino: any,
    observacoes: string,
    motivoAlteracao?: string
  ) => {
    if (!pacienteParaRegular) return;

    try {
      setProcessing(true);

      // 1. LÓGICA DE ALTERAÇÃO (se aplicável)
      if (isAlteracaoMode) {
          const regulaçãoAnterior = (pacienteParaRegular as any).regulacao;
          if (regulaçãoAnterior) {
              const leitoReservadoAntigo = leitos.find(
                  (l) => l.codigoLeito === regulaçãoAnterior.paraLeito
              );
              if (leitoReservadoAntigo) {
                  await atualizarStatusLeito(leitoReservadoAntigo.id, "Vago");
              }
              const logMessage = `Regulação de ${pacienteParaRegular.nomeCompleto} alterada de ${regulaçãoAnterior.paraLeito} para ${leitoDestino.codigoLeito}. Motivo: ${motivoAlteracao}`;
              registrarLog(logMessage, "Regulação de Leitos");
          }
      }

      // 2. ATUALIZAÇÃO DOS LEITOS (Origem e Destino)
      await atualizarStatusLeito(pacienteParaRegular.leitoId, "Regulado", {
          pacienteId: pacienteParaRegular.id,
          infoRegulacao: {
              paraSetor: leitoDestino.setorNome,
              paraLeito: leitoDestino.codigoLeito,
              observacoes,
          },
      });
      await atualizarStatusLeito(leitoDestino.id, "Reservado", {
          pacienteId: pacienteParaRegular.id,
      });
      
      // 3. LIMPEZA DO STATUS DE REMANEJAMENTO
      if (pacienteParaRegular.remanejarPaciente) {
          const pacienteRef = doc(db, "pacientesRegulaFacil", pacienteParaRegular.id);
          await updateDoc(pacienteRef, {
              remanejarPaciente: false,
              motivoRemanejamento: null,
              dataPedidoRemanejamento: null,
          });
      }

      // 4. REGISTRO E FEEDBACK
      if (!isAlteracaoMode) {
          registrarLog(`Regulou ${pacienteParaRegular.nomeCompleto} para o leito ${leitoDestino.codigoLeito}.`, "Regulação de Leitos");
      }

      toast({ title: isAlteracaoMode ? "Alteração Confirmada!" : "Regulação Confirmada!", description: "A mensagem foi copiada para a área de transferência." });
      
      // Fecha o modal de forma controlada
      setRegulacaoModalOpen(false);
      setPacienteParaRegular(null);
      setIsAlteracaoMode(false);
    } catch (error) {
      console.error("Erro ao confirmar regulação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a regulação.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  }, [pacienteParaRegular, isAlteracaoMode, toast, registrarLog, atualizarStatusLeito, leitos]);

  const handleConcluir = useCallback(async (paciente: any) => {
    if (!paciente.regulacao) return;

    const leitoDestino = leitos.find(
        (l) => l.codigoLeito === paciente.regulacao.paraLeito
    );

    if (leitoDestino) {
        const leitoOrigem = leitos.find(l => l.id === paciente.leitoId);
        const historicoRegulacao = leitoOrigem?.historicoMovimentacao.find(h => 
            h.statusLeito === 'Regulado' && h.infoRegulacao?.paraLeito === leitoDestino.codigoLeito
        );
        
        let duracaoFormatada = 'N/A';
        if (historicoRegulacao?.dataAtualizacaoStatus) {
            const dataInicio = new Date(historicoRegulacao.dataAtualizacaoStatus);
            const duracao = intervalToDuration({ start: dataInicio, end: new Date() });
            duracaoFormatada = `${duracao.days || 0}d ${duracao.hours || 0}h ${duracao.minutes || 0}m`;
        }

        await atualizarStatusLeito(paciente.leitoId, "Vago");
        await atualizarStatusLeito(leitoDestino.id, "Ocupado", {
            pacienteId: paciente.id,
        });
        const pacienteRef = doc(db, "pacientesRegulaFacil", paciente.id);
        await updateDoc(pacienteRef, {
            leitoId: leitoDestino.id,
            setorId: leitoDestino.setorId,
        });

        const logMessage = `Regulação de ${paciente.nomeCompleto} concluída para o leito ${leitoDestino.codigoLeito}. Tempo de espera: ${duracaoFormatada}.`;
        registrarLog(logMessage, "Regulação de Leitos");
        
        toast({ title: "Sucesso!", description: "Regulação concluída e leito de origem liberado." });
    }
  }, [leitos, atualizarStatusLeito, registrarLog, toast]);

  const handleAlterar = useCallback((paciente: any) => {
    setPacienteParaRegular(paciente);
    setIsAlteracaoMode(true);
    setRegulacaoModalOpen(true);
  }, []);

  const handleCancelar = useCallback((paciente: any) => {
    setPacienteParaAcao(paciente);
    setCancelamentoModalOpen(true);
  }, []);

  const onConfirmarCancelamento = useCallback(async (motivo: string) => {
    if (!pacienteParaAcao) return;

    const leitoOrigem = leitos.find(
        (l) => l.id === pacienteParaAcao.leitoId
    )!;

    const historicoRegulacao = leitoOrigem.historicoMovimentacao.find(
        (h) => h.statusLeito === "Regulado"
    );

    if (!historicoRegulacao || !historicoRegulacao.infoRegulacao) {
        toast({ title: "Erro", description: "Não foi possível encontrar os dados da regulação original.", variant: "destructive" });
        return;
    }

    const leitoDestino = leitos.find(
        (l) => l.codigoLeito === historicoRegulacao.infoRegulacao!.paraLeito
    )!;

    await atualizarStatusLeito(leitoOrigem.id, "Ocupado", {
        pacienteId: pacienteParaAcao.id,
    });
    await atualizarStatusLeito(leitoDestino.id, "Vago");

    const logMessage = `Cancelou regulação de ${pacienteParaAcao.nomeCompleto} para o leito ${leitoDestino.codigoLeito}. Motivo: ${motivo}`;
    registrarLog(logMessage, "Regulação de Leitos");

    toast({ title: "Cancelado!", description: "A regulação foi desfeita com sucesso." });
    setCancelamentoModalOpen(false);
    setPacienteParaAcao(null);
  }, [pacienteParaAcao, leitos, atualizarStatusLeito, registrarLog, toast]);

  const cancelarPedidoUTI = useCallback(async (paciente: Paciente) => {
    const pacienteRef = doc(db, "pacientesRegulaFacil", paciente.id);
    await updateDoc(pacienteRef, {
      aguardaUTI: false,
      dataPedidoUTI: null,
    });
    registrarLog(
      `Cancelou pedido de UTI para ${paciente.nomeCompleto}.`,
      "Regulação de Leitos"
    );
    toast({ title: "Sucesso", description: "Pedido de UTI cancelado." });
  }, [registrarLog, toast]);

  const handleCancelarRemanejamento = useCallback(async (paciente: Paciente) => {
    const pacienteRef = doc(db, "pacientesRegulaFacil", paciente.id);
    await updateDoc(pacienteRef, {
      remanejarPaciente: false,
      motivoRemanejamento: null,
      dataPedidoRemanejamento: null,
    });
    registrarLog(
      `Cancelou solicitação de remanejamento para ${paciente.nomeCompleto}.`,
      "Regulação de Leitos"
    );
  }, [registrarLog]);

  const altaAposRecuperacao = useCallback(async (leitoId: string) => {
    const paciente = pacientes.find((p) => p.leitoId === leitoId);
    if (paciente) {
      const pacienteRef = doc(db, "pacientesRegulaFacil", paciente.id);
      await deleteDoc(pacienteRef);
      await atualizarStatusLeito(leitoId, "Higienizacao");
      registrarLog(
        `Alta (Recuperação Cirúrgica) para ${paciente.nomeCompleto}.`,
        "Regulação de Leitos"
      );
    }
  }, [pacientes, atualizarStatusLeito, registrarLog]);

  const solicitarRemanejamento = useCallback(async (
    setorId: string,
    leitoId: string,
    motivo: string
  ) => {
    try {
      const paciente = pacientes.find((p) => p.leitoId === leitoId);
      if (paciente) {
        const pacienteRef = doc(db, "pacientesRegulaFacil", paciente.id);
        await updateDoc(pacienteRef, {
          remanejarPaciente: true,
          motivoRemanejamento: motivo,
          dataPedidoRemanejamento: new Date().toISOString(),
        });
        registrarLog(
          `Solicitou remanejamento para ${paciente.nomeCompleto}. Motivo: ${motivo}`,
          "Regulação de Leitos"
        );
      }
    } catch (error) {
      console.error("Erro ao solicitar remanejamento:", error);
    }
  }, [pacientes, registrarLog]);

  const cancelarPedidoRemanejamento = useCallback(async (
    setorId: string,
    leitoId: string
  ) => {
    try {
      const paciente = pacientes.find((p) => p.leitoId === leitoId);
      if (paciente) {
        const pacienteRef = doc(db, "pacientesRegulaFacil", paciente.id);
        await updateDoc(pacienteRef, {
          remanejarPaciente: false,
          motivoRemanejamento: null,
          dataPedidoRemanejamento: null,
        });
        registrarLog(
          `Cancelou solicitação de remanejamento para ${paciente.nomeCompleto}.`,
          "Regulação de Leitos"
        );
      }
    } catch (error) {
      console.error("Erro ao cancelar remanejamento:", error);
    }
  }, [pacientes, registrarLog]);

  const calcularTempoEspera = (dataInicio: string): string => {
    const inicio = new Date(dataInicio);
    const duracao = intervalToDuration({ start: inicio, end: new Date() });
    const partes = [];
    if (duracao.days && duracao.days > 0) partes.push(`${duracao.days}d`);
    if (duracao.hours && duracao.hours > 0) partes.push(`${duracao.hours}h`);
    if (duracao.minutes) partes.push(`${duracao.minutes}m`);
    return partes.length > 0 ? partes.join(" ") : "Recente";
  };

  const handleAlocarLeitoCirurgia = useCallback((cirurgia: any) => {
    setCirurgiaParaAlocar(cirurgia);
    setAlocacaoCirurgiaModalOpen(true);
  }, []);

  const handleConfirmarAlocacaoCirurgia = useCallback(async (cirurgia: any, leito: any) => {
    try {
      await reservarLeitoParaCirurgia(cirurgia.id, leito);
      setAlocacaoCirurgiaModalOpen(false);
      setCirurgiaParaAlocar(null);
    } catch (error) {
      console.error("Erro ao alocar leito para cirurgia:", error);
    }
  }, [reservarLeitoParaCirurgia]);

  const handleIniciarTransferenciaExterna = useCallback((paciente: any) => {
    setPacienteParaAcao(paciente);
    setTransferenciaModalOpen(true);
  }, []);

  const handleGerenciarTransferencia = useCallback((paciente: any) => {
    setPacienteParaAcao(paciente);
    setGerenciarTransferenciaOpen(true);
  }, []);

  const handleConfirmarTransferenciaExterna = useCallback(async (
    destino: string,
    motivo: string
  ) => {
    if (pacienteParaAcao) {
      const pacienteRef = doc(db, "pacientesRegulaFacil", pacienteParaAcao.id);
      await updateDoc(pacienteRef, {
        transferirPaciente: true,
        destinoTransferencia: destino,
        motivoTransferencia: motivo,
        dataTransferencia: new Date().toISOString(),
      });
      registrarLog(
        `Iniciou transferência externa para ${pacienteParaAcao.nomeCompleto}.`,
        "Regulação de Leitos"
      );
    }
    setTransferenciaModalOpen(false);
    setPacienteParaAcao(null);
  }, [pacienteParaAcao, registrarLog]);

  const handleIniciarTransferenciaExternaFromUTI = useCallback((paciente: any) => {
    setPacienteParaAcao(paciente);
    setTransferenciaModalOpen(true);
  }, []);

  const handleProcessFileRequest = useCallback((file: File) => {

    setProcessing(true);
    setValidationResult(null);
    setSyncSummary(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target!.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        });

        const pacientesDaPlanilha: PacienteDaPlanilha[] = jsonData
          .slice(3)
          .map((row: any) => {
            const sexo =
              row[2]?.trim().toUpperCase() === "F" ? "Feminino" : "Masculino";
            return {
              nomeCompleto: row[0]?.trim(),
              dataNascimento: row[1]?.trim(),
              sexo: sexo as "Masculino" | "Feminino",
              dataInternacao: row[3]?.trim(),
              setorNome: row[4]?.trim(),
              leitoCodigo: row[6]?.trim(),
              especialidade: row[7]?.trim(),
            };
          })
          .filter((p) => p.nomeCompleto && p.leitoCodigo && p.setorNome);

        setDadosPlanilhaProcessados(pacientesDaPlanilha);

        const setoresCadastrados = new Set(setores.map((s) => s.nomeSetor));
        const leitosCadastrados = new Set(leitos.map((l) => l.codigoLeito));

        const setoresFaltantes = [
          ...new Set(pacientesDaPlanilha.map((p) => p.setorNome)),
        ].filter((nomeSetor) => !setoresCadastrados.has(nomeSetor));

        const leitosFaltantes: Record<string, string[]> = {};
        pacientesDaPlanilha.forEach((p) => {
          if (!leitosCadastrados.has(p.leitoCodigo)) {
            if (!leitosFaltantes[p.setorNome]) {
              leitosFaltantes[p.setorNome] = [];
            }
            leitosFaltantes[p.setorNome].push(p.leitoCodigo);
          }
        });

        if (
          setoresFaltantes.length > 0 ||
          Object.keys(leitosFaltantes).length > 0
        ) {
          setValidationResult({ setoresFaltantes, leitosFaltantes });
          return;
        }

        const gerarChaveUnica = (p: { nomeCompleto: string; dataNascimento: string; }) => 
            `${p.nomeCompleto.toUpperCase().trim()}-${p.dataNascimento.trim()}`;

        const mapaPacientesPlanilha = new Map(
          pacientesDaPlanilha.map((p) => [gerarChaveUnica(p), p])
        );
        const mapaPacientesSistema = new Map(
          pacientes.map((p) => [gerarChaveUnica(p), p])
        );
        const mapaLeitosSistema = new Map(leitos.map((l) => [l.id, l]));

        const altas = pacientes
          .filter((p) => !mapaPacientesPlanilha.has(gerarChaveUnica(p)))
          .map((p) => ({
            nomePaciente: p.nomeCompleto,
            leitoAntigo: mapaLeitosSistema.get(p.leitoId)?.codigoLeito || "N/A",
          }));

        const novasInternacoes = pacientesDaPlanilha.filter(
          (p) => !mapaPacientesSistema.has(gerarChaveUnica(p))
        );

        const transferencias = pacientesDaPlanilha
          .filter((p) => mapaPacientesSistema.has(gerarChaveUnica(p)))
          .map((p) => {
            const pacienteSistema = mapaPacientesSistema.get(gerarChaveUnica(p))!;
            const leitoAntigo = mapaLeitosSistema.get(pacienteSistema.leitoId);
            return { paciente: p, leitoAntigo: leitoAntigo?.codigoLeito };
          })
          .filter((t) => t.paciente.leitoCodigo !== t.leitoAntigo);

        setSyncSummary({ novasInternacoes, transferencias, altas });

      } catch (error) {
        console.error("Erro ao processar planilha:", error);
        toast({
          title: "Erro de Processamento",
          description: "Verifique o formato do arquivo.",
          variant: "destructive",
        });
      } finally {
        setProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  }, [setProcessing, setValidationResult, setSyncSummary, setores, leitos, pacientes, toast]);

  const handleConfirmSync = useCallback(async () => {
      if (!syncSummary) return;
      setIsSyncing(true);

      const batch = writeBatch(db);
      const agora = new Date().toISOString();
      const mapaLeitos = new Map(leitos.map((l) => [l.codigoLeito, l]));
      const mapaSetores = new Map(setores.map((s) => [s.nomeSetor, s]));

      try {
          for (const itemAlta of syncSummary.altas) {
              const pacienteParaAlta = pacientes.find(p => p.nomeCompleto === itemAlta.nomePaciente);

              if (pacienteParaAlta) {
                  const leitoRef = doc(db, "leitosRegulaFacil", pacienteParaAlta.leitoId);
                  const pacienteRef = doc(db, "pacientesRegulaFacil", pacienteParaAlta.id);

                  const historicoAlta = {
                      statusLeito: "Vago",
                      dataAtualizacaoStatus: agora,
                  };

                  batch.update(leitoRef, {
                      historicoMovimentacao: arrayUnion(historicoAlta),
                  });
                  batch.delete(pacienteRef);
              }
          }

          for (const { paciente, leitoAntigo } of syncSummary.transferencias) {
              const pacienteSistema = pacientes.find(
                  (p) => p.nomeCompleto === paciente.nomeCompleto
              )!;
              
              const leitoAntigoRef = doc(db, "leitosRegulaFacil", pacienteSistema.leitoId);
              const leitoNovo = mapaLeitos.get(paciente.leitoCodigo)!;
              const leitoNovoRef = doc(db, "leitosRegulaFacil", leitoNovo.id);
              const pacienteRef = doc(db, "pacientesRegulaFacil", pacienteSistema.id);

              const historicoLeitoAntigo = {
                  statusLeito: "Vago",
                  dataAtualizacaoStatus: agora,
              };
              const historicoLeitoNovo = {
                  statusLeito: "Ocupado",
                  dataAtualizacaoStatus: agora,
                  pacienteId: pacienteSistema.id,
              };

              batch.update(leitoAntigoRef, {
                  historicoMovimentacao: arrayUnion(historicoLeitoAntigo),
              });
              batch.update(leitoNovoRef, {
                  historicoMovimentacao: arrayUnion(historicoLeitoNovo),
              });
              batch.update(pacienteRef, {
                  leitoId: leitoNovo.id,
                  setorId: leitoNovo.setorId,
                  especialidadePaciente: paciente.especialidade,
              });
          }

          for (const novaInternacao of syncSummary.novasInternacoes) {
              const leito = mapaLeitos.get(novaInternacao.leitoCodigo)!;
              const setor = mapaSetores.get(novaInternacao.setorNome)!;
              const leitoRef = doc(db, "leitosRegulaFacil", leito.id);
              const pacienteRef = doc(collection(db, "pacientesRegulaFacil"));

              const novoPaciente = {
                  leitoId: leito.id,
                  setorId: setor.id!,
                  nomeCompleto: novaInternacao.nomeCompleto,
                  dataNascimento: novaInternacao.dataNascimento,
                  sexoPaciente: novaInternacao.sexo,
                  dataInternacao: novaInternacao.dataInternacao,
                  especialidadePaciente: novaInternacao.especialidade,
              };
              batch.set(pacienteRef, novoPaciente);

              const historicoOcupacao = {
                  statusLeito: "Ocupado",
                  dataAtualizacaoStatus: agora,
                  pacienteId: pacienteRef.id,
              };
              batch.update(leitoRef, {
                  historicoMovimentacao: arrayUnion(historicoOcupacao),
              });
          }
          
          const logResumo = `Sincronização via planilha concluída. Resumo: ${syncSummary.novasInternacoes.length} novas internações, ${syncSummary.transferencias.length} transferências e ${syncSummary.altas.length} altas.`;
          
          registrarLog(logResumo, "Sincronização MV");

          await batch.commit();

          toast({
              title: "Sucesso!",
              description: "Sincronização concluída com sucesso!",
          });
          setImportModalOpen(false);

      } catch (error) {
          console.error("Erro ao sincronizar:", error);
          toast({
              title: "Erro!",
              description: "Não foi possível sincronizar os dados.",
              variant: "destructive",
          });
      } finally {
          setIsSyncing(false);
          setSyncSummary(null);
          setValidationResult(null);
          setDadosPlanilhaProcessados([]);
      }
  }, [syncSummary, leitos, setores, pacientes, registrarLog, toast]);

  const handlePassagemPlantao = useCallback(() => {
    console.log('Gerar passagem de plantão');
  }, []);

  const handleAbrirSugestoes = useCallback(() => {
    setSugestoesModalOpen(true);
  }, []);

  // Integração com alertas de isolamento
  useEffect(() => {
    const mapaRemanejamentoContaminacao = new Map();
    const todosPacientesPendentes = [
      ...pacientesAguardandoRegulacao,
      ...pacientesJaRegulados,
      ...pacientesAguardandoUTI,
      ...pacientesAguardandoTransferencia,
      ...pacientesAguardandoRemanejamento,
    ];
    todosPacientesPendentes.forEach((p) => {
      if (
        p.remanejarPaciente &&
        p.motivoRemanejamento?.startsWith("Risco de contaminação")
      ) {
        mapaRemanejamentoContaminacao.set(p.nomeCompleto, p);
      }
    });

    const mapaAlertas = new Map(alertas.map((a) => [a.nomePaciente, a]));

    mapaAlertas.forEach((alerta, nomePaciente) => {
      if (!mapaRemanejamentoContaminacao.has(nomePaciente)) {
        const pacienteParaRemanejar = todosPacientesPendentes.find(
          (p) => p.nomeCompleto === nomePaciente
        );
        if (pacienteParaRemanejar) {
          solicitarRemanejamento(
            pacienteParaRemanejar.setorId,
            pacienteParaRemanejar.leitoId,
            alerta.motivo
          );
        }
      }
    });

    mapaRemanejamentoContaminacao.forEach((paciente, nomePaciente) => {
      if (!mapaAlertas.has(nomePaciente)) {
        cancelarPedidoRemanejamento(paciente.setorId, paciente.leitoId);
      }
    });
  }, [alertas, pacientesAguardandoRegulacao, pacientesJaRegulados, pacientesAguardandoUTI, pacientesAguardandoTransferencia, pacientesAguardandoRemanejamento, solicitarRemanejamento, cancelarPedidoRemanejamento]);

  const loading = setoresLoading || leitosLoading || pacientesLoading;

  return {
    // Estados de loading
    loading,
    cirurgiasLoading,
    processing,
    isSyncing,
    
    // Dados
    listas: {
      pacientesAguardandoRegulacao,
      pacientesAguardandoUTI,
      pacientesAguardandoTransferencia,
      pacientesAguardandoRemanejamento,
      pacientesJaRegulados,
      decisaoCirurgica,
      decisaoClinica,
      recuperacaoCirurgica,
      totalPendentes,
      cirurgias,
      sugestoesDeRegulacao,
    },
    
    // Estados dos modais
    modals: {
      importModalOpen,
      regulacaoModalOpen,
      cancelamentoModalOpen,
      transferenciaModalOpen,
      alocacaoCirurgiaModalOpen,
      gerenciarTransferenciaOpen,
      resumoModalOpen,
      sugestoesModalOpen,
      pacienteParaRegular,
      pacienteParaAcao,
      cirurgiaParaAlocar,
      isAlteracaoMode,
      validationResult,
      syncSummary,
      modoRegulacao,
    },
    
    // Handlers
    handlers: {
      handleOpenRegulacaoModal,
      handleConfirmarRegulacao,
      handleConcluir,
      handleAlterar,
      handleCancelar,
      onConfirmarCancelamento,
      cancelarPedidoUTI,
      handleCancelarRemanejamento,
      altaAposRecuperacao,
      handleAlocarLeitoCirurgia,
      handleConfirmarAlocacaoCirurgia,
      handleIniciarTransferenciaExterna,
      handleGerenciarTransferencia,
      handleConfirmarTransferenciaExterna,
      handleProcessFileRequest,
      handleConfirmSync,
      handlePassagemPlantao,
      handleAbrirSugestoes,
      setImportModalOpen,
      setRegulacaoModalOpen,
      setCancelamentoModalOpen,
      setTransferenciaModalOpen,
      setAlocacaoCirurgiaModalOpen,
      setGerenciarTransferenciaOpen,
      setResumoModalOpen,
      setSugestoesModalOpen,
    },
    
    // Props para filtros
    filtrosProps: {
      filtrosAvancados,
      setFiltrosAvancados,
      searchTerm,
      setSearchTerm,
      resetFiltros,
      sortConfig,
      setSortConfig,
    },
  };
};
