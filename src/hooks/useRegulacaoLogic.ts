
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
    motivoAlteracao?: string
  ) => {
    if (!pacienteParaRegular) return;

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

    setRegulacaoModalOpen(false);
    setPacienteParaRegular(null);
    setIsAlteracaoMode(false);
  };

  const handleConcluir = async (paciente: any) => {
    if (!paciente.regulacao) return;
    const leitoDestino = leitos.find(
      (l) => l.codigoLeito === paciente.regulacao.paraLeito
    );
    if (leitoDestino) {
      await atualizarStatusLeito(paciente.leitoId, "Higienizacao");
      await atualizarStatusLeito(leitoDestino.id, "Ocupado", {
        pacienteId: paciente.id,
      });
      const pacienteRef = doc(db, "pacientesRegulaFacil", paciente.id);
      await updateDoc(pacienteRef, {
        leitoId: leitoDestino.id,
        setorId: leitoDestino.setorId,
      });
      registrarLog(
        `Concluiu regulação de ${paciente.nomeCompleto} para o leito ${leitoDestino.codigoLeito}.`,
        "Regulação de Leitos"
      );
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
    if (pacienteParaAcao) {
      const leitoOrigem = leitos.find(
        (l) => l.id === pacienteParaAcao.leitoId
      )!;
      const historicoRegulacao = leitoOrigem.historicoMovimentacao.find(
        (h) => h.statusLeito === "Regulado"
      );
      if (!historicoRegulacao || !historicoRegulacao.infoRegulacao) return;

      const leitoDestino = leitos.find(
        (l) => l.codigoLeito === historicoRegulacao.infoRegulacao!.paraLeito
      )!;

      await atualizarStatusLeito(leitoOrigem.id, "Ocupado", {
        pacienteId: pacienteParaAcao.id,
      });
      await atualizarStatusLeito(leitoDestino.id, "Vago");

      registrarLog(
        `Cancelou regulação de ${pacienteParaAcao.nomeCompleto}. Motivo: ${motivo}`,
        "Regulação de Leitos"
      );
    }
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

        const mapaPacientesPlanilha = new Map(
          pacientesDaPlanilha.map((p) => [p.nomeCompleto, p])
        );
        const mapaPacientesSistema = new Map(
          pacientes.map((p) => [p.nomeCompleto, p])
        );
        const mapaLeitosSistema = new Map(leitos.map((l) => [l.id, l]));

        const altas = pacientes
          .filter((p) => !mapaPacientesPlanilha.has(p.nomeCompleto))
          .map((p) => ({
            nomePaciente: p.nomeCompleto,
            leitoAntigo: mapaLeitosSistema.get(p.leitoId)?.codigoLeito || "N/A",
          }));

        const novasInternacoes = pacientesDaPlanilha.filter(
          (p) => !mapaPacientesSistema.has(p.nomeCompleto)
        );

        const transferencias = pacientesDaPlanilha
          .filter((p) => mapaPacientesSistema.has(p.nomeCompleto))
          .map((p) => {
            const pacienteSistema = pacientes.find(
              (paciente) => paciente.nomeCompleto === p.nomeCompleto
            )!;
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
  };

  const handleConfirmSync = async () => {
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
            statusLeito: "Higienizacao",
            dataAtualizacaoStatus: agora,
          };
          batch.update(leitoRef, {
            historicoMovimentacao: arrayUnion(historicoAlta),
          });
          batch.delete(pacienteRef);
          registrarLog(
            `Alta (via importação) para ${pacienteParaAlta.nomeCompleto} do leito ${itemAlta.leitoAntigo}.`,
            "Sincronização MV"
          );
        }
      }

      for (const { paciente, leitoAntigo } of syncSummary.transferencias) {
        const pacienteSistema = pacientes.find(
          (p) => p.nomeCompleto === paciente.nomeCompleto
        )!;
        const leitoAntigoRef = doc(
          db,
          "leitosRegulaFacil",
          pacienteSistema.leitoId
        );
        const leitoNovo = mapaLeitos.get(paciente.leitoCodigo)!;
        const leitoNovoRef = doc(db, "leitosRegulaFacil", leitoNovo.id);
        const pacienteRef = doc(db, "pacientesRegulaFacil", pacienteSistema.id);

        const historicoAlta = {
          statusLeito: "Higienizacao",
          dataAtualizacaoStatus: agora,
        };
        const historicoOcupacao = {
          statusLeito: "Ocupado",
          dataAtualizacaoStatus: agora,
          pacienteId: pacienteSistema.id,
        };

        batch.update(leitoAntigoRef, {
          historicoMovimentacao: arrayUnion(historicoAlta),
        });
        batch.update(leitoNovoRef, {
          historicoMovimentacao: arrayUnion(historicoOcupacao),
        });
        batch.update(pacienteRef, {
          leitoId: leitoNovo.id,
          setorId: leitoNovo.setorId,
          especialidadePaciente: paciente.especialidade,
        });
        registrarLog(
          `Transferência (via importação) de ${pacienteSistema.nomeCompleto} do leito ${leitoAntigo} para ${leitoNovo.codigoLeito}.`,
          "Sincronização MV"
        );
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
        registrarLog(
          `Nova internação (via importação) para ${novaInternacao.nomeCompleto} no leito ${leito.codigoLeito}.`,
          "Sincronização MV"
        );
      }

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
