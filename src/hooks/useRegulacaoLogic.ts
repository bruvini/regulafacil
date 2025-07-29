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
  serverTimestamp,
  query, 
  where, 
  getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { intervalToDuration } from "date-fns";
import * as XLSX from "xlsx";
import { useAuth } from "@/hooks/useAuth";

export const useRegulacaoLogic = () => {
  const { userData } = useAuth();
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

  /**
 * Cria ou atualiza um registro na coleção 'regulacoesRegulaFacil'.
 * @param {string | null} regulacaoId - O ID do documento, se já existir.
 * @param {'criada' | 'alterada' | 'concluida' | 'cancelada'} tipoEvento - O tipo de evento.
 * @param {object} dados - Os dados relevantes para o evento.
 * @returns {Promise<string>} O ID do documento da regulação.
 */
const registrarHistoricoRegulacao = async (
  regulacaoId: string | null,
  tipoEvento: 'criada' | 'alterada' | 'concluida' | 'cancelada',
  dados: any
): Promise<string> => {
    const usuario = userData?.nome || 'Sistema';
    const agora = new Date().toISOString();
    const evento = {
        evento: tipoEvento,
        timestamp: agora,
        usuario: usuario,
        detalhes: dados.detalhesLog || '',
    };

    if (tipoEvento === 'criada') {
        const docRef = await addDoc(collection(db, "regulacoesRegulaFacil"), {
            pacienteId: dados.paciente.id,
            pacienteNome: dados.paciente.nomeCompleto,
            setorOrigemNome: dados.paciente.setorOrigem,
            leitoOrigemCodigo: dados.paciente.leitoCodigo,
            setorDestinoNome: dados.leitoDestino.setorNome,
            leitoDestinoCodigo: dados.leitoDestino.codigoLeito,
            tipo: dados.modoRegulacao === 'uti' ? 'UTI' : 'Enfermaria',
            status: 'Pendente',
            criadaEm: agora,
            criadaPor: usuario,
            historicoEventos: [evento],
        });
        return docRef.id;
    }

    if (regulacaoId) {
        const regulacaoRef = doc(db, "regulacoesRegulaFacil", regulacaoId);
        const dadosUpdate: any = {
            historicoEventos: arrayUnion(evento),
        };

        if (tipoEvento === 'alterada') {
            dadosUpdate.setorDestinoNome = dados.leitoDestino.setorNome;
            dadosUpdate.leitoDestinoCodigo = dados.leitoDestino.codigoLeito;
        } else if (tipoEvento === 'concluida') {
            dadosUpdate.status = 'Concluída';
            dadosUpdate.concluidaEm = agora;
            dadosUpdate.concluidaPor = usuario;
            // Opcional: Calcular e salvar o tempo de espera aqui
        } else if (tipoEvento === 'cancelada') {
            dadosUpdate.status = 'Cancelada';
            dadosUpdate.canceladaEm = agora;
            dadosUpdate.canceladaPor = usuario;
            dadosUpdate.motivoCancelamento = dados.motivo;
        }
        await updateDoc(regulacaoRef, dadosUpdate);
        return regulacaoId;
    }
    
    // Fallback caso algo dê errado
    console.error("ID da regulação não fornecido para evento de atualização.");
    return '';
};

  // Função auxiliar para calcular idade
  const calcularIdade = (dataNascimento: string): number => {
    if (!dataNascimento) return 0;

    // Tenta diferentes formatos de data
    let nascimento: Date;

    if (dataNascimento.includes('/')) {
      // Formato DD/MM/YYYY
      const [dia, mes, ano] = dataNascimento.split('/').map(Number);
      nascimento = new Date(ano, mes - 1, dia);
    } else if (dataNascimento.includes('-')) {
      // Formato ISO
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

  // Função auxiliar para extrair o ID do quarto de forma robusta
  const getQuartoId = (codigoLeito: string): string => {
    const match = codigoLeito.match(/^(\d+[\s-]?\w*|\w+[\s-]?\d+)\s/);
    return match ? match[1].trim() : codigoLeito.split('-')[0];
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

  const leitosEnriquecidos = useMemo(() => {
    if (leitosLoading || pacientesLoading) return [];
    const mapaPacientes = new Map(pacientes.map(p => [p.id, p]));
    return leitos.map(leito => {
        const historicoRecente = leito.historicoMovimentacao[leito.historicoMovimentacao.length - 1];
        const pacienteId = historicoRecente?.pacienteId;
        return {
            ...leito,
            statusLeito: historicoRecente.statusLeito,
            dadosPaciente: pacienteId ? mapaPacientes.get(pacienteId) : null
        };
    });
}, [leitos, pacientes, leitosLoading, pacientesLoading]);
  

  // Lógica Inteligente de Sugestões de Regulação Refinada
  const sugestoesDeRegulacao = useMemo(() => {
    if (!leitosEnriquecidos || leitosEnriquecidos.length === 0) return [];

    const mapaSetores = new Map(setores.map(s => [s.id, s]));

    const setoresPermitidos = [
      'UNID. CIRURGICA',
      'UNID. CLINICA MEDICA',
      'UNID. INT. GERAL - UIG',
      'UNID. JS ORTOPEDIA',
      'UNID. NEFROLOGIA TRANSPLANTE',
      'UNID. ONCOLOGIA'
    ];

    const pacientesRelevantes = pacientesComDadosCompletos.filter(p =>
      p.setorOrigem === 'PS DECISÃO CIRURGICA' ||
      p.setorOrigem === 'PS DECISÃO CLINICA' ||
      p.setorOrigem === 'CC - RECUPERAÇÃO'
    );

    const especialidadesCompativeis: Record<string, string[]> = {
      'UNID. JS ORTOPEDIA': ['NEUROCIRURGIA', 'ODONTOLOGIA C.TRAUM.B.M.F.', 'ORTOPEDIA/TRAUMATOLOGIA'],
      'UNID. INT. GERAL - UIG': ['CLINICA GERAL', 'INTENSIVISTA', 'NEUROLOGIA', 'PROCTOLOGIA', 'UROLOGIA'],
      'UNID. CLINICA MEDICA': ['CLINICA GERAL', 'INTENSIVISTA', 'NEUROLOGIA', 'PROCTOLOGIA', 'UROLOGIA'],
      'UNID. ONCOLOGIA': ['ONCOLOGIA CIRURGICA', 'ONCOLOGIA CLINICA/CANCEROLOGIA'],
      'UNID. CIRURGICA': ['CIRURGIA CABECA E PESCOCO', 'CIRURGIA GERAL', 'CIRURGIA TORACICA', 'CIRURGIA VASCULAR', 'NEUROCIRURGIA', 'PROCTOLOGIA', 'UROLOGIA', 'ONCOLOGIA CIRURGICA'],
      'UNID. NEFROLOGIA TRANSPLANTE': ['NEFROLOGIA']
    };

    const leitosDisponiveis = leitosEnriquecidos.filter(leito => {
      const setor = mapaSetores.get(leito.setorId);
      return (
        (leito.statusLeito === 'Vago' || leito.statusLeito === 'Higienizacao') &&
        setor &&
        setoresPermitidos.includes(setor.nomeSetor)
      );
    });

    const sugestoesPorLeito: Array<{ setorNome: string; sugestao: any }> = [];

    leitosDisponiveis.forEach(leito => {
      const setorNome = mapaSetores.get(leito.setorId)?.nomeSetor ?? '';
      const quartoId = getQuartoId(leito.codigoLeito);

      const leitosDoQuarto = leitosEnriquecidos.filter(
        l => l.setorId === leito.setorId && getQuartoId(l.codigoLeito) === quartoId
      );

      const ocupados = leitosDoQuarto.filter(
        l => l.statusLeito === 'Ocupado' && l.dadosPaciente
      );

      const sexoCompativel: 'Masculino' | 'Feminino' | 'Ambos' =
        ocupados.length > 0
          ? (ocupados[0].dadosPaciente!.sexoPaciente as 'Masculino' | 'Feminino')
          : 'Ambos';

      const temIsolamentoNoQuarto = ocupados.some(o =>
        o.dadosPaciente?.isolamentosVigentes &&
        o.dadosPaciente.isolamentosVigentes.length > 0
      );

      const pacientesElegiveis = pacientesRelevantes
        .filter(p => {
          const especs = especialidadesCompativeis[setorNome] || [];
          if (especs.length > 0 && !especs.includes(p.especialidadePaciente || '')) {
            return false;
          }

          if (sexoCompativel !== 'Ambos' && p.sexoPaciente !== sexoCompativel) {
            return false;
          }

          const precisaIsol = p.isolamentosVigentes && p.isolamentosVigentes.length > 0;
          if (precisaIsol && !leito.leitoIsolamento) {
            const quartoLivre = leitosDoQuarto.every(l =>
              l.statusLeito === 'Vago' || l.statusLeito === 'Higienizacao'
            );
            if (!quartoLivre) return false;
          }

          if (temIsolamentoNoQuarto && !precisaIsol) {
            return false;
          }

          if (leito.leitoPCP) {
            const idade = calcularIdade(p.dataNascimento);
            if (idade < 18 || idade > 60) return false;
          }

          return true;
        })
        .sort((a, b) => {
          const aIso = a.isolamentosVigentes && a.isolamentosVigentes.length > 0;
          const bIso = b.isolamentosVigentes && b.isolamentosVigentes.length > 0;
          if (aIso && !bIso) return -1;
          if (!aIso && bIso) return 1;

          const tempoA = new Date(a.dataInternacao).getTime();
          const tempoB = new Date(b.dataInternacao).getTime();
          if (tempoA !== tempoB) return tempoA - tempoB;

          const idadeA = calcularIdade(a.dataNascimento);
          const idadeB = calcularIdade(b.dataNascimento);
          return idadeB - idadeA;
        });

      if (pacientesElegiveis.length > 0) {
        sugestoesPorLeito.push({
          setorNome,
          sugestao: {
            leito: {
              ...leito,
              setorNome,
              statusLeito: leito.statusLeito,
              sexoCompativel
            },
            pacientesElegiveis
          }
        });
      }
    });

    const agrupados = sugestoesPorLeito.reduce(
      (acc, item) => {
        const grupo = acc.find(g => g.setorNome === item.setorNome);
        if (grupo) {
          grupo.sugestoes.push(item.sugestao);
        } else {
          acc.push({ setorNome: item.setorNome, sugestoes: [item.sugestao] });
        }
        return acc;
      },
      [] as Array<{ setorNome: string; sugestoes: any[] }>
    );

    return agrupados;
  }, [leitosEnriquecidos, pacientesComDadosCompletos, setores]);
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
  const pacientesAguardandoUTI = filteredPacientes.filter(
    (p) => p.aguardaUTI && !p.transferirPaciente
  );
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
    // 1. Define o Paciente-Alvo:
    // Coloca o paciente que precisa ser remanejado no estado `pacienteParaRegular`.
    setPacienteParaRegular(paciente);

    // 2. Define o Modo: Garante que o modal abra no modo "normal" (não de UTI).
    setModoRegulacao(modo);

    // 3. Reseta o Estado de Alteração: Garante que não está no modo de "alterar" regulação.
    setIsAlteracaoMode(false);

    // 4. Abre o Modal: Abre o mesmo modal que você usa para regular um paciente do PS.
    setRegulacaoModalOpen(true);
  };

  const handleConfirmarRegulacao = async (
  leitoDestino: any,
  observacoes: string,
  motivoAlteracao?: string
) => {
    // GUARDA DE SEGURANÇA: Garante que o usuário esteja carregado.
    if (!userData) {
        toast({ title: "Aguarde", description: "Carregando dados do usuário...", variant: "default" });
        return;
    }
    if (!pacienteParaRegular) return;

    let regulacaoIdParaHistorico: string | null = null;
    let logMessage = '';

    // LÓGICA DE ALTERAÇÃO
    if (isAlteracaoMode && pacienteParaRegular.regulacao?.regulacaoId) {
        regulacaoIdParaHistorico = pacienteParaRegular.regulacao.regulacaoId;
        const regAnterior = pacienteParaRegular.regulacao;
        const leitoAntigo = leitos.find(l => l.codigoLeito === regAnterior.paraLeito);
        if (leitoAntigo) {
            await atualizarStatusLeito(leitoAntigo.id, "Vago");
        }

        logMessage = `Regulação de ${pacienteParaRegular.nomeCompleto} alterada de ${regAnterior.paraLeito} para ${leitoDestino.codigoLeito}. Motivo: ${motivoAlteracao}`;
        await registrarHistoricoRegulacao(regulacaoIdParaHistorico, 'alterada', {
            leitoDestino: leitoDestino,
            detalhesLog: logMessage,
        });
    }

    // LÓGICA DE CRIAÇÃO
    if (!isAlteracaoMode) {
        regulacaoIdParaHistorico = await registrarHistoricoRegulacao(null, 'criada', {
            paciente: pacienteParaRegular,
            leitoDestino: leitoDestino,
            modoRegulacao: modoRegulacao,
            detalhesLog: `Regulou ${pacienteParaRegular.nomeCompleto} para o leito ${leitoDestino.codigoLeito}.`,
        });
    }

    // ATUALIZAÇÃO DOS LEITOS
    await atualizarStatusLeito(pacienteParaRegular.leitoId, "Regulado", {
        pacienteId: pacienteParaRegular.id,
        infoRegulacao: {
            regulacaoId: regulacaoIdParaHistorico,
            paraSetor: leitoDestino.setorNome,
            paraLeito: leitoDestino.codigoLeito,
            observacoes,
        },
    });
    await atualizarStatusLeito(leitoDestino.id, "Reservado", {
        pacienteId: pacienteParaRegular.id,
    });

    if (pacienteParaRegular.remanejarPaciente) {
        const pacienteRef = doc(db, "pacientesRegulaFacil", pacienteParaRegular.id);
        await updateDoc(pacienteRef, {
            remanejarPaciente: false,
            motivoRemanejamento: null,
            dataPedidoRemanejamento: null,
        });
    }

    registrarLog(logMessage || `Regulou ${pacienteParaRegular.nomeCompleto} para o leito ${leitoDestino.codigoLeito}.`, "Regulação de Leitos");
    toast({ title: isAlteracaoMode ? "Alteração Confirmada!" : "Regulação Confirmada!", description: "A mensagem foi copiada para a área de transferência." });

    setRegulacaoModalOpen(false);
    setPacienteParaRegular(null);
    setIsAlteracaoMode(false);
};

  const handleConcluir = async (paciente: any) => {
    // GUARDA DE SEGURANÇA: Garante que o usuário esteja carregado.
    if (!userData) {
        toast({ title: "Aguarde", description: "Carregando dados do usuário...", variant: "default" });
        return;
    }
    if (!paciente.regulacao || !paciente.regulacao.regulacaoId) {
        toast({ title: "Erro", description: "Dados da regulação incompletos para concluir.", variant: "destructive" });
        return;
    }

    const leitoDestino = leitos.find(l => l.codigoLeito === paciente.regulacao.paraLeito);
    if (leitoDestino) {
        const logMessage = `Regulação de ${paciente.nomeCompleto} concluída para o leito ${leitoDestino.codigoLeito}.`;
        
        await registrarHistoricoRegulacao(paciente.regulacao.regulacaoId, 'concluida', {
            detalhesLog: logMessage,
        });

        await atualizarStatusLeito(paciente.leitoId, "Vago");
        await atualizarStatusLeito(leitoDestino.id, "Ocupado", {
            pacienteId: paciente.id,
        });
        const pacienteRef = doc(db, "pacientesRegulaFacil", paciente.id);
        await updateDoc(pacienteRef, {
            leitoId: leitoDestino.id,
            setorId: leitoDestino.setorId,
        });

        registrarLog(logMessage, "Regulação de Leitos");
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
    // GUARDA DE SEGURANÇA: Garante que o usuário esteja carregado.
    if (!userData) {
        toast({ title: "Aguarde", description: "Carregando dados do usuário...", variant: "default" });
        return;
    }
    if (!pacienteParaAcao) return;

    const pacienteAtualizado = pacientesComDadosCompletos.find(p => p.id === pacienteParaAcao.id);
    if (!pacienteAtualizado?.regulacao?.regulacaoId) {
        toast({ title: "Erro", description: "Não foi possível encontrar o ID da regulação para cancelar.", variant: "destructive" });
        return;
    }

    const regulacaoId = pacienteAtualizado.regulacao.regulacaoId;
    const leitoDestino = leitos.find(l => l.codigoLeito === pacienteAtualizado.regulacao.paraLeito)!;
    
    const logMessage = `Cancelou regulação de ${pacienteParaAcao.nomeCompleto} para o leito ${leitoDestino.codigoLeito}. Motivo: ${motivo}`;

    await registrarHistoricoRegulacao(regulacaoId, 'cancelada', {
        motivo: motivo,
        detalhesLog: logMessage,
    });

    await atualizarStatusLeito(pacienteParaAcao.leitoId, "Ocupado", {
        pacienteId: pacienteParaAcao.id,
    });
    await atualizarStatusLeito(leitoDestino.id, "Vago");

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
