
import { useState, useEffect, useMemo } from "react";
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

  // Função auxiliar para extrair o ID do quarto
  const getQuartoId = (codigoLeito: string): string => {
    return codigoLeito.split('-')[0];
  };

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

    const sugestoesPorLeito = leitosDisponiveis
      .map((leito) => {
        const setor = mapaSetores.get(leito.setorId);
        
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
          if (pacientesDoQuarto.length > 0) {
            const sexoDoQuarto = pacientesDoQuarto[0]?.sexoPaciente;
            if (sexoDoQuarto && paciente.sexoPaciente !== sexoDoQuarto) {
              return false;
            }
          }

          const pacientePrecisaIsolamento = paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0;
          
          if (pacientePrecisaIsolamento && !leito.leitoIsolamento) {
            return false;
          }

          if (temIsolamentoNoQuarto && !pacientePrecisaIsolamento) {
            return false;
          }

          return true;
        });

        const pacientesOrdenados = pacientesElegiveis.sort((a, b) => {
          const especialidadesCompatíveis: Record<string, string[]> = {
            'UNID. CIRURGICA': ['CIRURGIA GERAL', 'ORTOPEDIA', 'UROLOGIA'],
            'UNID. CLINICA MEDICA': ['CLINICA MEDICA', 'CARDIOLOGIA', 'PNEUMOLOGIA'],
            'UNID. INT. GERAL - UIG': ['CLINICA MEDICA', 'MEDICINA INTERNA'],
            'UNID. JS ORTOPEDIA': ['ORTOPEDIA', 'TRAUMATOLOGIA'],
            'UNID. NEFROLOGIA TRANSPLANTE': ['NEFROLOGIA', 'UROLOGIA'],
            'UNID. ONCOLOGIA': ['ONCOLOGIA', 'HEMATOLOGIA'],
          };

          const setorNome = setor?.nomeSetor || '';
          const compatíveisSetor = especialidadesCompatíveis[setorNome] || [];
          
          const aCompatível = compatíveisSetor.includes(a.especialidadePaciente || '');
          const bCompatível = compatíveisSetor.includes(b.especialidadePaciente || '');

          if (aCompatível && !bCompatível) return -1;
          if (!aCompatível && bCompatível) return 1;

          return new Date(a.dataInternacao).getTime() - new Date(b.dataInternacao).getTime();
        });

        return {
          setor: setor?.nomeSetor || '',
          sugestao: {
            leito: {
              ...leito,
              setorNome: setor?.nomeSetor,
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
  } = useFiltrosRegulacao(pacientesComDadosCompletos);

  const pacientesAguardandoRegulacao = filteredPacientes.filter(
    (p) => p.statusLeito === "Ocupado"
  );
  const pacientesJaRegulados = filteredPacientes.filter(
    (p) => p.statusLeito === "Regulado"
  );
  const pacientesAguardandoUTI = filteredPacientes.filter((p) => p.aguardaUTI);
  const pacientesAguardandoTransferencia = filteredPacientes.filter(
    (p) => p.transferirPaciente
  );
  const pacientesAguardandoRemanejamento = filteredPacientes.filter(
    (p) => p.remanejarPaciente && p.statusLeito !== 'Regulado'
  );
  const decisaoCirurgica = pacientesAguardandoRegulacao.filter(
    (p) => p.setorOrigem === "PS DECISÃO CIRURGICA"
  );
  const decisaoClinica = pacientesAguardandoRegulacao.filter(
    (p) => p.setorOrigem === "PS DECISÃO CLINICA"
  );
  const recuperacaoCirurgica = pacientesAguardandoRegulacao.filter(
    (p) => p.setorOrigem === "CC - RECUPERAÇÃO"
  );
  const totalPendentes = decisaoCirurgica.length + decisaoClinica.length + recuperacaoCirurgica.length;

  const todosPacientesPendentes = useMemo(
    () => [
      ...pacientesAguardandoRegulacao,
      ...pacientesJaRegulados,
      ...pacientesAguardandoUTI,
      ...pacientesAguardandoTransferencia,
      ...pacientesAguardandoRemanejamento,
    ],
    [
      pacientesAguardandoRegulacao,
      pacientesJaRegulados,
      pacientesAguardandoUTI,
      pacientesAguardandoTransferencia,
      pacientesAguardandoRemanejamento,
    ]
  );

  // Funções de Ação
  const handleOpenRegulacaoModal = (
    paciente: any,
    modo: "normal" | "uti" = "normal"
  ) => {
    setPacienteParaRegular(paciente);
    setModoRegulacao(modo);
    setIsAlteracaoMode(false);
    setRegulacaoModalOpen(true);
  };

  const handleConfirmarRegulacao = async (
    leitoDestino: any,
    observacoes: string,
    motivoAlteracao?: string // O motivo agora é crucial
) => {
    if (!pacienteParaRegular) return;

    // --- LÓGICA DE ALTERAÇÃO ---
    if (isAlteracaoMode) {
        // 1. ENCONTRA O LEITO ANTIGO
        // Pega a informação da regulação *anterior* que está salva no objeto do paciente.
        const regulaçãoAnterior = (pacienteParaRegular as any).regulacao;
        if (regulaçãoAnterior) {
            const leitoReservadoAntigo = leitos.find(
                (l) => l.codigoLeito === regulaçãoAnterior.paraLeito
            );

            // 2. LIBERA O LEITO ANTIGO
            // Se o leito antigo for encontrado, seu status é revertido para "Vago".
            if (leitoReservadoAntigo) {
                await atualizarStatusLeito(leitoReservadoAntigo.id, "Vago");
            }

            // 3. GERA O LOG DE AUDITORIA ESPECÍFICO
            const logMessage = `Regulação de ${pacienteParaRegular.nomeCompleto} alterada de ${regulaçãoAnterior.paraLeito} para ${leitoDestino.codigoLeito}. Motivo: ${motivoAlteracao}`;
            registrarLog(logMessage, "Regulação de Leitos");
        }
    }
    // --- FIM DA LÓGICA DE ALTERAÇÃO ---

    // A lógica padrão de regulação continua a mesma...
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
    
    // ... com a diferença que, se foi uma alteração, um novo log não é gerado aqui.
    if (!isAlteracaoMode) {
        registrarLog(`Regulou ${pacienteParaRegular.nomeCompleto} para o leito ${leitoDestino.codigoLeito}.`, "Regulação de Leitos");
    }

    toast({ title: isAlteracaoMode ? "Alteração Confirmada!" : "Regulação Confirmada!", description: "A mensagem foi copiada para a área de transferência." });
    setRegulacaoModalOpen(false);
    setPacienteParaRegular(null);
    setIsAlteracaoMode(false);
};

  const handleConcluir = async (paciente: any) => {
    // 1. GUARDA DE SEGURANÇA
    // Verifica se o objeto do paciente contém as informações da regulação.
    if (!paciente.regulacao) return;

    // 2. ENCONTRAR O LEITO DE DESTINO
    // Usa o código do leito salvo em `infoRegulacao` para encontrar o documento completo do leito de destino.
    const leitoDestino = leitos.find(
        (l) => l.codigoLeito === paciente.regulacao.paraLeito
    );

    if (leitoDestino) {
        // --- CÁLCULO DE DURAÇÃO PARA O LOG ---
        // Encontra o leito de origem do paciente para acessar seu histórico.
        const leitoOrigem = leitos.find(l => l.id === paciente.leitoId);
        // No histórico, encontra o registro exato de quando o leito foi marcado como "Regulado".
        const historicoRegulacao = leitoOrigem?.historicoMovimentacao.find(h => 
            h.statusLeito === 'Regulado' && h.infoRegulacao?.paraLeito === leitoDestino.codigoLeito
        );
        
        let duracaoFormatada = 'N/A';
        // Se o registro foi encontrado, calcula a diferença de tempo.
        if (historicoRegulacao?.dataAtualizacaoStatus) {
            const dataInicio = new Date(historicoRegulacao.dataAtualizacaoStatus);
            const duracao = intervalToDuration({ start: dataInicio, end: new Date() });
            duracaoFormatada = `${duracao.days || 0}d ${duracao.hours || 0}h ${duracao.minutes || 0}m`;
        }
        // --- FIM DO CÁLCULO ---

        // 3. ATUALIZAÇÃO DOS LEITOS E PACIENTE
        // Libera o leito antigo, mudando seu status para "Vago".
        await atualizarStatusLeito(paciente.leitoId, "Vago");
        // Ocupa o novo leito com o paciente.
        await atualizarStatusLeito(leitoDestino.id, "Ocupado", {
            pacienteId: paciente.id,
        });
        // Atualiza o "endereço" do paciente no banco de dados, vinculando-o ao novo leito e setor.
        const pacienteRef = doc(db, "pacientesRegulaFacil", paciente.id);
        await updateDoc(pacienteRef, {
            leitoId: leitoDestino.id,
            setorId: leitoDestino.setorId,
        });

        // 4. REGISTRO DE AUDITORIA E FEEDBACK
        // Cria a mensagem de log, agora incluindo o tempo de espera.
        const logMessage = `Regulação de ${paciente.nomeCompleto} concluída para o leito ${leitoDestino.codigoLeito}. Tempo de espera: ${duracaoFormatada}.`;
        registrarLog(logMessage, "Regulação de Leitos");
        
        // Exibe uma notificação de sucesso para o usuário.
        toast({ title: "Sucesso!", description: "Regulação concluída e leito de origem liberado." });
    }
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
    // 1. GUARDA DE SEGURANÇA
    // Garante que a função não execute se nenhum paciente foi selecionado para a ação.
    if (!pacienteParaAcao) return;

    // 2. ENCONTRAR OS LEITOS ENVOLVIDOS
    // Pega o leito de origem diretamente do objeto do paciente.
    const leitoOrigem = leitos.find(
        (l) => l.id === pacienteParaAcao.leitoId
    )!;

    // Encontra o registro de histórico que contém a informação da regulação.
    const historicoRegulacao = leitoOrigem.historicoMovimentacao.find(
        (h) => h.statusLeito === "Regulado"
    );

    // Se não encontrar o histórico ou as informações de destino, interrompe para evitar erros.
    if (!historicoRegulacao || !historicoRegulacao.infoRegulacao) {
        toast({ title: "Erro", description: "Não foi possível encontrar os dados da regulação original.", variant: "destructive" });
        return;
    }

    // Encontra o leito de destino que estava reservado.
    const leitoDestino = leitos.find(
        (l) => l.codigoLeito === historicoRegulacao.infoRegulacao!.paraLeito
    )!;

    // 3. ATUALIZAÇÃO DOS STATUS
    // Devolve o leito de origem ao status "Ocupado", pois o paciente ainda está lá.
    await atualizarStatusLeito(leitoOrigem.id, "Ocupado", {
        pacienteId: pacienteParaAcao.id,
    });
    // Libera o leito de destino, que agora volta a ficar "Vago".
    await atualizarStatusLeito(leitoDestino.id, "Vago");

    // 4. REGISTRO E FEEDBACK
    // **CORREÇÃO:** Agora usa `pacienteParaAcao.nomeCompleto` para garantir que o nome apareça corretamente.
    const logMessage = `Cancelou regulação de ${pacienteParaAcao.nomeCompleto} para o leito ${leitoDestino.codigoLeito}. Motivo: ${motivo}`;
    registrarLog(logMessage, "Regulação de Leitos");

    toast({ title: "Cancelado!", description: "A regulação foi desfeita com sucesso." });
    setCancelamentoModalOpen(false);
    setPacienteParaAcao(null);
};

  const cancelarPedidoUTI = async (paciente: Paciente) => {
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
  };

  const handleCancelarRemanejamento = async (paciente: Paciente) => {
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
  };

  const altaAposRecuperacao = async (leitoId: string) => {
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
  };

  const solicitarRemanejamento = async (
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
  };

  const cancelarPedidoRemanejamento = async (
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
      console.error("Erro ao alocar leito para cirurgia:", error);
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

  const handleConfirmarTransferenciaExterna = async (
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
  };

  const handleIniciarTransferenciaExternaFromUTI = (paciente: any) => {
    setPacienteParaAcao(paciente);
    setTransferenciaModalOpen(true);
  };

const handleProcessFileRequest = (file: File) => {

    // 1. PREPARAÇÃO INICIAL
    // Reseta os estados da interface para começar um novo processo de importação.
    // Isso garante que dados de importações anteriores não interfiram na atual.
    setProcessing(true); // Ativa o indicador de "processando" na tela.
    setValidationResult(null); // Limpa resultados de validação anteriores.
    setSyncSummary(null); // Limpa o resumo de sincronização anterior.

    // 2. LEITURA DO ARQUIVO
    // O FileReader é uma API do navegador para ler o conteúdo de arquivos.
    const reader = new FileReader();

    // A função `onload` será executada quando o arquivo for completamente lido.
    reader.onload = (e) => {
      try {
        // --- ETAPA A: EXTRAÇÃO DOS DADOS DA PLANILHA ---
        
        // Pega o conteúdo binário do arquivo lido.
        const data = e.target!.result;
        // A biblioteca 'xlsx' (SheetJS) lê o conteúdo binário do Excel.
        const workbook = XLSX.read(data, { type: "binary" });
        // Pega o nome da primeira aba da planilha.
        const sheetName = workbook.SheetNames[0];
        // Seleciona a primeira aba para trabalhar.
        const worksheet = workbook.Sheets[sheetName];
        // Converte a aba em um array de arrays (JSON), onde cada array interno é uma linha.
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        });

        // --- ETAPA B: TRANSFORMAÇÃO E LIMPEZA DOS DADOS ---

        // Pula as 3 primeiras linhas (cabeçalhos do relatório do MV) e mapeia cada
        // linha para um objeto de paciente estruturado.
        const pacientesDaPlanilha: PacienteDaPlanilha[] = jsonData
          .slice(3)
          .map((row: any) => {
            const sexo =
              row[2]?.trim().toUpperCase() === "F" ? "Feminino" : "Masculino";
            return {
              // `.trim()` remove espaços em branco no início e no fim.
              nomeCompleto: row[0]?.trim(),
              dataNascimento: row[1]?.trim(),
              sexo: sexo as "Masculino" | "Feminino",
              dataInternacao: row[3]?.trim(),
              setorNome: row[4]?.trim(),
              leitoCodigo: row[6]?.trim(),
              especialidade: row[7]?.trim(),
            };
          })
          // Filtra qualquer linha que não tenha as informações essenciais (nome, leito, setor).
          .filter((p) => p.nomeCompleto && p.leitoCodigo && p.setorNome);

        // Armazena os dados processados no estado para uso posterior.
        setDadosPlanilhaProcessados(pacientesDaPlanilha);

        // --- ETAPA C: VALIDAÇÃO DE INTEGRIDADE (SETORES E LEITOS) ---

        // Cria conjuntos (Sets) com os nomes dos setores e códigos dos leitos existentes
        // no sistema para uma verificação rápida e performática.
        const setoresCadastrados = new Set(setores.map((s) => s.nomeSetor));
        const leitosCadastrados = new Set(leitos.map((l) => l.codigoLeito));

        // Compara os setores da planilha com os setores cadastrados e lista os que não existem.
        const setoresFaltantes = [
          ...new Set(pacientesDaPlanilha.map((p) => p.setorNome)),
        ].filter((nomeSetor) => !setoresCadastrados.has(nomeSetor));

        // Compara os leitos da planilha com os leitos cadastrados e lista os que não existem.
        const leitosFaltantes: Record<string, string[]> = {};
        pacientesDaPlanilha.forEach((p) => {
          if (!leitosCadastrados.has(p.leitoCodigo)) {
            if (!leitosFaltantes[p.setorNome]) {
              leitosFaltantes[p.setorNome] = [];
            }
            leitosFaltantes[p.setorNome].push(p.leitoCodigo);
          }
        });

        // Se encontrar qualquer setor ou leito faltando, interrompe o processo e exibe o modal de validação.
        if (
          setoresFaltantes.length > 0 ||
          Object.keys(leitosFaltantes).length > 0
        ) {
          setValidationResult({ setoresFaltantes, leitosFaltantes });
          return; // Para a execução da função aqui.
        }

        // --- ETAPA D: ANÁLISE INTELIGENTE DE MUDANÇAS ---

        // Cria uma função para gerar uma chave única para cada paciente.
        // Usar NOME + DATA DE NASCIMENTO é muito mais seguro contra homônimos.
        // O `.toUpperCase()` e a remoção de espaços extras garantem consistência.
        const gerarChaveUnica = (p: { nomeCompleto: string; dataNascimento: string; }) => 
            `${p.nomeCompleto.toUpperCase().trim()}-${p.dataNascimento.trim()}`;

        // Cria os mapas de acesso rápido usando a nova chave única.
        const mapaPacientesPlanilha = new Map(
          pacientesDaPlanilha.map((p) => [gerarChaveUnica(p), p])
        );
        const mapaPacientesSistema = new Map(
          pacientes.map((p) => [gerarChaveUnica(p), p])
        );
        const mapaLeitosSistema = new Map(leitos.map((l) => [l.id, l]));

        // Identifica ALTAS: Pacientes que estão no sistema, mas não na nova planilha.
        const altas = pacientes
          .filter((p) => !mapaPacientesPlanilha.has(gerarChaveUnica(p)))
          .map((p) => ({
            nomePaciente: p.nomeCompleto,
            leitoAntigo: mapaLeitosSistema.get(p.leitoId)?.codigoLeito || "N/A",
          }));

        // Identifica NOVAS INTERNAÇÕES: Pacientes que estão na planilha, mas não no sistema.
        const novasInternacoes = pacientesDaPlanilha.filter(
          (p) => !mapaPacientesSistema.has(gerarChaveUnica(p))
        );

        // Identifica TRANSFERÊNCIAS: Pacientes que estão em ambos, mas em leitos diferentes.
        const transferencias = pacientesDaPlanilha
          .filter((p) => mapaPacientesSistema.has(gerarChaveUnica(p)))
          .map((p) => {
            const pacienteSistema = mapaPacientesSistema.get(gerarChaveUnica(p))!;
            const leitoAntigo = mapaLeitosSistema.get(pacienteSistema.leitoId);
            return { paciente: p, leitoAntigo: leitoAntigo?.codigoLeito };
          })
          .filter((t) => t.paciente.leitoCodigo !== t.leitoAntigo);

        // --- ETAPA E: GERAÇÃO DO RESUMO FINAL ---
        
        // Armazena o resultado da análise no estado para exibir no modal de confirmação.
        setSyncSummary({ novasInternacoes, transferencias, altas });

      } catch (error) {
        // Se qualquer erro acontecer durante o processo, exibe uma notificação.
        console.error("Erro ao processar planilha:", error);
        toast({
          title: "Erro de Processamento",
          description: "Verifique o formato do arquivo.",
          variant: "destructive",
        });
      } finally {
        // Independentemente de sucesso ou falha, desativa o indicador de "processando".
        setProcessing(false);
      }
    };
    // Inicia a leitura do arquivo.
    reader.readAsBinaryString(file);
  };


  const handleConfirmSync = async () => {
      // 1. GUARDA DE SEGURANÇA E PREPARAÇÃO INICIAL
      // --------------------------------------------------

      // Se não houver um resumo de sincronização, a função para imediatamente.
      if (!syncSummary) return;
      // Ativa o indicador de "sincronizando" na tela para o usuário.
      setIsSyncing(true);

      // 2. CRIAÇÃO DO "CARRINHO DE COMPRAS" (BATCH) E PREPARAÇÃO DE DADOS
      // --------------------------------------------------

      // O `writeBatch` garante que todas as operações sejam executadas com sucesso, ou nenhuma delas.
      const batch = writeBatch(db);
      // Pega a data e hora atuais para garantir que todos os registros tenham o mesmo timestamp.
      const agora = new Date().toISOString();
      // Cria mapas de acesso rápido para leitos e setores para otimizar a performance.
      const mapaLeitos = new Map(leitos.map((l) => [l.codigoLeito, l]));
      const mapaSetores = new Map(setores.map((s) => [s.nomeSetor, s]));

      try {
          // 3. PROCESSANDO AS ALTAS
          // --------------------------------------------------
          for (const itemAlta of syncSummary.altas) {
              // Encontra o paciente completo no estado atual para obter os IDs necessários.
              const pacienteParaAlta = pacientes.find(p => p.nomeCompleto === itemAlta.nomePaciente);

              if (pacienteParaAlta) {
                  // Prepara as referências aos documentos que vamos modificar.
                  const leitoRef = doc(db, "leitosRegulaFacil", pacienteParaAlta.leitoId);
                  const pacienteRef = doc(db, "pacientesRegulaFacil", pacienteParaAlta.id);

                  // **AJUSTE 1:** O status do leito é definido como "Vago" diretamente.
                  const historicoAlta = {
                      statusLeito: "Vago",
                      dataAtualizacaoStatus: agora,
                  };

                  // Adiciona as operações ao "carrinho".
                  batch.update(leitoRef, {
                      historicoMovimentacao: arrayUnion(historicoAlta),
                  });
                  batch.delete(pacienteRef);
              }
          }

          // 4. PROCESSANDO AS TRANSFERÊNCIAS
          // --------------------------------------------------
          for (const { paciente, leitoAntigo } of syncSummary.transferencias) {
              const pacienteSistema = pacientes.find(
                  (p) => p.nomeCompleto === paciente.nomeCompleto
              )!;
              
              // Prepara as referências para os 3 documentos que serão alterados.
              const leitoAntigoRef = doc(db, "leitosRegulaFacil", pacienteSistema.leitoId);
              const leitoNovo = mapaLeitos.get(paciente.leitoCodigo)!;
              const leitoNovoRef = doc(db, "leitosRegulaFacil", leitoNovo.id);
              const pacienteRef = doc(db, "pacientesRegulaFacil", pacienteSistema.id);

              // **AJUSTE 2:** O status do leito antigo é definido como "Vago".
              const historicoLeitoAntigo = {
                  statusLeito: "Vago",
                  dataAtualizacaoStatus: agora,
              };
              const historicoLeitoNovo = {
                  statusLeito: "Ocupado",
                  dataAtualizacaoStatus: agora,
                  pacienteId: pacienteSistema.id,
              };

              // Adiciona as operações ao "carrinho".
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

          // 5. PROCESSANDO NOVAS INTERNAÇÕES
          // --------------------------------------------------
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
          
          // --- AJUSTE 3: LOG DE AUDITORIA ÚNICO E RESUMIDO ---
          // --------------------------------------------------

          // Cria a mensagem de resumo com base na contagem de cada tipo de operação.
          const logResumo = `Sincronização via planilha concluída. Resumo: ${syncSummary.novasInternacoes.length} novas internações, ${syncSummary.transferencias.length} transferências e ${syncSummary.altas.length} altas.`;
          
          // Registra o resumo como um único evento na auditoria.
          registrarLog(logResumo, "Sincronização MV");

          // 6. EXECUÇÃO FINAL E SEGURA
          // --------------------------------------------------
          // Envia todas as operações do "carrinho" para o Firestore de uma só vez.
          await batch.commit();

          // Se tudo deu certo, exibe a notificação de sucesso.
          toast({
              title: "Sucesso!",
              description: "Sincronização concluída com sucesso!",
          });
          setImportModalOpen(false);

      } catch (error) {
          // Se algo der errado, exibe uma notificação de erro.
          console.error("Erro ao sincronizar:", error);
          toast({
              title: "Erro!",
              description: "Não foi possível sincronizar os dados.",
              variant: "destructive",
          });
      } finally {
          // 7. LIMPEZA DA INTERFACE
          // --------------------------------------------------
          // Este bloco é executado sempre, garantindo que a UI seja limpa.
          setIsSyncing(false);
          setSyncSummary(null);
          setValidationResult(null);
          setDadosPlanilhaProcessados([]);
      }
  };

  const handlePassagemPlantao = () => {
    console.log('Gerar passagem de plantão');
  };

  const handleAbrirSugestoes = () => {
    setSugestoesModalOpen(true);
  };

  // Integração com alertas de isolamento
  useEffect(() => {
    const mapaRemanejamentoContaminacao = new Map();
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
  }, [alertas, todosPacientesPendentes, solicitarRemanejamento, cancelarPedidoRemanejamento]);

  const loading = setoresLoading || leitosLoading || pacientesLoading;

  return {
    // Estados de loading
    loading,
    cirurgiasLoading,
    processing,
    isSyncing,
    
    // Dados
    listas: {
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
