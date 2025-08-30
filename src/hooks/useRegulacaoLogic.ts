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
import { Paciente, DetalhesRemanejamento } from "@/types/hospital";
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
  getDocs,
  deleteField
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { intervalToDuration, parse, isValid } from "date-fns";
import * as XLSX from "xlsx";
import { useAuth } from "@/hooks/useAuth";
import { descreverMotivoRemanejamento } from "@/lib/utils";

export const useRegulacaoLogic = () => {
  const { userData } = useAuth();
  const { setores, loading: setoresLoading } = useSetores();
  const { leitos, loading: leitosLoading, atualizarStatusLeito } = useLeitos();
  const { pacientes, loading: pacientesLoading } = usePacientes();
  const { registrarLog } = useAuditoria();
  const { toast } = useToast();
  const { cirurgias, loading: cirurgiasLoading } = useCirurgias();
  const { reservarLeitoParaCirurgia } = useCirurgias();
  const { alertas, loading: alertasLoading } = useAlertasIsolamento();

  // Define loading early to prevent "before initialization" error
  const loading = setoresLoading || leitosLoading || pacientesLoading;

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

  // Estado para eliminar flickering
  const [actingOnPatientId, setActingOnPatientId] = useState<string | null>(null);

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
    const usuario = userData?.nomeCompleto || 'Sistema';
    const agora = new Date().toISOString();
    const evento = {
        evento: tipoEvento,
        timestamp: agora,
        usuario: usuario,
        detalhes: dados.detalhesLog || '',
    };

    if (tipoEvento === 'criada') {
        const payload: any = {
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
        };
        if (dados.justificativaHomonimo) {
            payload.justificativaHomonimo = dados.justificativaHomonimo;
        }
        const docRef = await addDoc(collection(db, "regulacoesRegulaFacil"), payload);
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
        } else if (tipoEvento === 'cancelada') {
            dadosUpdate.status = 'Cancelada';
            dadosUpdate.canceladaEm = agora;
            dadosUpdate.canceladaPor = usuario;
            dadosUpdate.motivoCancelamento = dados.motivo;
        }
        await updateDoc(regulacaoRef, dadosUpdate);
        return regulacaoId;
    }
    
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
      p.statusLeito === 'Ocupado' && 
      (
        p.setorOrigem === 'PS DECISÃO CIRURGICA' ||
        p.setorOrigem === 'PS DECISÃO CLINICA' ||
        p.setorOrigem === 'CC - RECUPERAÇÃO'
      )
    );

    const especialidadesCompativeis: Record<string, string[]> = {
      'UNID. JS ORTOPEDIA': ['NEUROCIRURGIA', 'ODONTOLOGIA C.TRAUM.B.M.F.', 'ORTOPEDIA/TRAUMATOLOGIA', 'BUCOMAXILO'],
      'UNID. INT. GERAL - UIG': ['CLINICA GERAL', 'INTENSIVISTA', 'NEUROLOGIA', 'PROCTOLOGIA', 'UROLOGIA'],
      'UNID. CLINICA MEDICA': ['CLINICA GERAL', 'INTENSIVISTA', 'NEUROLOGIA', 'PROCTOLOGIA', 'UROLOGIA', 'MASTOLOGIA'],
      'UNID. ONCOLOGIA': ['HEMATOLOGIA', 'ONCOLOGIA CIRURGICA', 'ONCOLOGIA CLINICA/CANCEROLOGIA'],
      'UNID. CIRURGICA': ['CIRURGIA CABECA E PESCOCO', 'CIRURGIA GERAL', 'CIRURGIA TORACICA', 'CIRURGIA VASCULAR', 'NEUROCIRURGIA', 'PROCTOLOGIA', 'UROLOGIA', 'ONCOLOGIA CIRURGICA', 'MASTOLOGIA', 'BUCOMAXILO'],
      'UNID. NEFROLOGIA TRANSPLANTE': ['NEFROLOGIA', 'HEPATOLOGISTA']
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
            if (p.setorOrigem === 'CC - RECUPERAÇÃO') {
              return false;
            }
            const idade = calcularIdade(p.dataNascimento);
            if (idade < 18 || idade > 60) {
              return false;
            }
          }
          return true;
        })
        .sort((a, b) => {
          // 1º Critério: Isolamento
          const aIso = a.isolamentosVigentes && a.isolamentosVigentes.length > 0;
          const bIso = b.isolamentosVigentes && b.isolamentosVigentes.length > 0;
          if (aIso && !bIso) return -1;
          if (!aIso && bIso) return 1;

          // 2º Critério: Maior tempo de internação (data mais antiga primeiro)
          // Usamos 'parse' para garantir a leitura correta da data
          const dataA = parse(a.dataInternacao, 'dd/MM/yyyy HH:mm', new Date());
          const dataB = parse(b.dataInternacao, 'dd/MM/yyyy HH:mm', new Date());
          const tempoA = isValid(dataA) ? dataA.getTime() : 0;
          const tempoB = isValid(dataB) ? dataB.getTime() : 0;
          
          if (tempoA !== tempoB) {
            // Ordenação ASCENDENTE pelo timestamp (datas mais antigas vêm primeiro)
            return tempoA - tempoB; 
          }

          // 3º Critério (desempate): Maior idade (mais velho primeiro)
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

  // Conjunto auxiliar para identificar pacientes com regulação pendente
  const pacientesReguladosPendentesIds = new Set(
    pacientesJaRegulados.map((p) => p.id)
  );

  const pacientesAguardandoUTI = filteredPacientes.filter(
    (p) =>
      p.aguardaUTI &&
      !p.transferirPaciente &&
      !pacientesReguladosPendentesIds.has(p.id)
  );
  const pacientesAguardandoTransferencia = filteredPacientes.filter(
    (p) => p.transferirPaciente
  );
  const remanejamentosPendentes = filteredPacientes.filter(
    (p) => p.remanejarPaciente && p.statusLeito !== 'Regulado'
  );

  // Agrupa os remanejamentos pendentes por motivo base, aplicando
  // tratamento especial para qualquer variação que comece com
  // "Risco de contaminação cruzada". Esses casos são agrupados
  // sob o nome fixo "Risco de Contaminação Cruzada".
  const remanejamentosAgrupados = remanejamentosPendentes.reduce(
    (acc, paciente) => {
      const motivoCompleto = descreverMotivoRemanejamento(
        paciente.motivoRemanejamento
      );

      let grupo = motivoCompleto.split(':')[0].trim() || 'Outro';
      if (
        motivoCompleto
          .toLowerCase()
          .startsWith('risco de contaminação cruzada')
      ) {
        grupo = 'Risco de Contaminação Cruzada';
      }

      if (!acc[grupo]) acc[grupo] = [];
      acc[grupo].push(paciente);
      return acc;
    },
    {} as Record<string, Paciente[]>
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
      ...remanejamentosPendentes,
    ],
    [
      pacientesAguardandoRegulacao,
      pacientesJaRegulados,
      pacientesAguardandoUTI,
      pacientesAguardandoTransferencia,
      remanejamentosPendentes,
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
    motivoAlteracao?: string,
    justificativaHomonimo?: string
  ) => {
      if (!userData) {
          toast({ title: "Aguarde", description: "Carregando dados do usuário...", variant: "default" });
          return;
      }
      if (!pacienteParaRegular) return;

      setActingOnPatientId(pacienteParaRegular.id);

      try {
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
                justificativaHomonimo,
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
                deSetor: pacienteParaRegular.setorOrigem,
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

        const baseLog =
          logMessage ||
          `Regulou ${pacienteParaRegular.nomeCompleto} para o leito ${leitoDestino.codigoLeito}.`;
        const logComJustificativa = justificativaHomonimo
          ? `${baseLog} Justificativa homônimo: ${justificativaHomonimo}`
          : baseLog;
        registrarLog(logComJustificativa, "Regulação de Leitos");

        // --------- Geração da mensagem de notificação ---------
        const dataHora = new Date().toLocaleString('pt-BR');

        const baseMensagem = `- *Paciente:* _${pacienteParaRegular.nomeCompleto}_\n- *De:* _${pacienteParaRegular.setorOrigem} ${pacienteParaRegular.leitoCodigo}_ → *Para:* _${leitoDestino.setorNome} ${leitoDestino.codigoLeito}_`;

        let mensagem = '';
        if (isAlteracaoMode) {
          const obsNir = [observacoes, motivoAlteracao].filter(Boolean).join(' - ');
          mensagem = `*🔄 REGULAÇÃO ALTERADA*\n\n${baseMensagem}`;
          if (obsNir) mensagem += `\n- *Obs. NIR:* _${obsNir}_`;
          mensagem += `\n\n- _${dataHora}_`;
        } else {
          mensagem = baseMensagem;
          const isolamentos =
            pacienteParaRegular.isolamentosVigentes?.map((iso: any) => iso.sigla).join(', ');
          if (isolamentos) mensagem += `\n- *Isolamento:* _${isolamentos}_`;
          if (observacoes) mensagem += `\n- *Obs. NIR:* _${observacoes}_`;
          if (pacienteParaRegular.motivoRemanejamento) {
            const motivo = descreverMotivoRemanejamento(pacienteParaRegular.motivoRemanejamento);
            if (motivo) mensagem += `\n- *Motivo Remanejamento:* _${motivo}_`;
          }
          mensagem += `\n\n- _${dataHora}_`;
        }

        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(mensagem);
          } catch (err) {
            console.error('Erro ao copiar mensagem:', err);
          }
        }

        toast({ title: isAlteracaoMode ? "Alteração Confirmada!" : "Regulação Confirmada!", description: "A mensagem foi copiada para a área de transferência." });

        setRegulacaoModalOpen(false);
        setPacienteParaRegular(null);
        setIsAlteracaoMode(false);
      } finally {
        setActingOnPatientId(null);
      }
  };

  const handleConcluir = async (paciente: any) => {
    // Validações iniciais (usuário e dados da regulação)
    if (!userData) {
        toast({ title: "Aguarde", description: "Carregando dados do usuário...", variant: "default" });
        return;
    }
    if (!paciente.regulacao || !paciente.regulacao.regulacaoId) {
        toast({ title: "Erro", description: "Dados da regulação incompletos para concluir.", variant: "destructive" });
        return;
    }

    setActingOnPatientId(paciente.id);

    try {
      // --- BUSCA DE DADOS ESSENCIAIS ---
      const pacienteCompleto = pacientesComDadosCompletos.find(p => p.id === paciente.id);
      const leitoDestino = leitos.find(l => l.codigoLeito === paciente.regulacao.paraLeito);
      const leitoOrigem = leitos.find(l => l.id === pacienteCompleto?.leitoId);
      const setorDestino = leitoDestino ? setores.find(s => s.id === leitoDestino.setorId) : undefined;

      // Validação de segurança: garante que todos os dados necessários existem
      if (!pacienteCompleto || !leitoDestino || !leitoOrigem || !setorDestino) {
        toast({ title: "Erro de Dados", description: "Não foi possível encontrar todos os dados necessários (paciente, leitos, setor). A operação foi cancelada.", variant: "destructive" });
        setActingOnPatientId(null);
        return;
      }

      const destinoEhUTI = paciente.regulacao.paraSetor?.toUpperCase().includes("UTI");
      const finalizouUTI = destinoEhUTI && pacienteCompleto.aguardaUTI;

      let tempoDeEsperaFormatado = "";
      if (finalizouUTI && pacienteCompleto.dataPedidoUTI) {
        const dataPedido = new Date(pacienteCompleto.dataPedidoUTI);
        const dataConclusao = new Date();
        const duracao = intervalToDuration({ start: dataPedido, end: dataConclusao });
        const partes: string[] = [];
        if (duracao.days) partes.push(`${duracao.days} dia${duracao.days > 1 ? "s" : ""}`);
        if (duracao.hours) partes.push(`${duracao.hours} hora${duracao.hours > 1 ? "s" : ""}`);
        const minutos = duracao.minutes || 0;
        if (minutos || partes.length === 0) partes.push(`${minutos} minuto${minutos === 1 ? "" : "s"}`);
        tempoDeEsperaFormatado = partes.join(", ").replace(/, ([^,]*)$/, " e $1");
      }

      // --- INÍCIO DA OPERAÇÃO ATÔMICA (BATCH) ---
      const batch = writeBatch(db);
      const agora = new Date().toISOString();

      // 1. Atualiza o Leito de Origem para "Higienização"
      const leitoOrigemRef = doc(db, "leitosRegulaFacil", leitoOrigem.id);
      const historicoOrigem = { statusLeito: "Higienizacao", dataAtualizacaoStatus: agora };
      batch.update(leitoOrigemRef, { historicoMovimentacao: arrayUnion(historicoOrigem) });

      // 2. Atualiza o Leito de Destino para "Ocupado"
      const leitoDestinoRef = doc(db, "leitosRegulaFacil", leitoDestino.id);
      const historicoDestino = { statusLeito: "Ocupado", dataAtualizacaoStatus: agora, pacienteId: pacienteCompleto.id };
      batch.update(leitoDestinoRef, { historicoMovimentacao: arrayUnion(historicoDestino) });

      // 3. Prepara a atualização do Paciente
      const pacienteRef = doc(db, "pacientesRegulaFacil", pacienteCompleto.id);
      const dadosUpdate: any = {
          leitoId: leitoDestino.id,
          setorId: leitoDestino.setorId,
      };

      if (finalizouUTI) {
        dadosUpdate.aguardaUTI = deleteField();
        dadosUpdate.dataPedidoUTI = deleteField();
      }

      batch.update(pacienteRef, dadosUpdate);

      // --- EXECUÇÃO DO BATCH ---
      // Envia todas as atualizações para o banco de dados de uma só vez
      await batch.commit();

      // 4. LOG DE FINALIZAÇÃO DO PEDIDO DE UTI (se aplicável)
      if (finalizouUTI) {
        const logUTI = `O pedido de UTI foi finalizado para o paciente ${pacienteCompleto.nomeCompleto} após ser regulado para o leito ${paciente.regulacao.paraSetor} - ${paciente.regulacao.paraLeito} depois de ${tempoDeEsperaFormatado}.`;
        registrarLog(logUTI, "Regulação de Leitos");
      }

      // --- LOGS E NOTIFICAÇÕES (APENAS APÓS SUCESSO DO BATCH) ---
      const logMessage = `Regulação de ${pacienteCompleto.nomeCompleto} concluída para o leito ${leitoDestino.codigoLeito}.`;
      await registrarHistoricoRegulacao(paciente.regulacao.regulacaoId, 'concluida', { detalhesLog: logMessage });
      registrarLog(logMessage, "Regulação de Leitos");

      toast({ title: "Sucesso!", description: "Regulação concluída e leito de origem liberado para higienização." });

    } catch (error) {
        console.error("Erro ao concluir regulação:", error);
        toast({ title: "Erro Inesperado", description: "Ocorreu um erro ao tentar concluir a regulação. Nenhuma alteração foi salva.", variant: "destructive" });
    } finally {
      setActingOnPatientId(null);
    }
  };

  const handleAlterar = (paciente: any) => {
    // Verifica se o paciente tem a flag 'aguardaUTI'.
    // Esta flag indica a necessidade original do paciente.
    const modo = paciente.aguardaUTI ? "uti" : "normal";

    // Define o modo de regulação ('uti' ou 'normal') com base na verificação.
    setModoRegulacao(modo);
    
    // Mantém a lógica original para abrir o modal em modo de alteração.
    setPacienteParaRegular(paciente);
    setIsAlteracaoMode(true);
    setRegulacaoModalOpen(true);
  };

  const handleCancelar = (paciente: any) => {
    setPacienteParaAcao(paciente);
    setCancelamentoModalOpen(true);
  };

  const onConfirmarCancelamento = async (motivo: string) => {
    if (!userData) {
        toast({ title: "Aguarde", description: "Carregando dados do usuário...", variant: "default" });
        return;
    }
    if (!pacienteParaAcao) return;

    setActingOnPatientId(pacienteParaAcao.id);

    try {
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
      // --------- Geração da mensagem de cancelamento ---------
      const dataHora = new Date().toLocaleString('pt-BR');
      const destinoCancelado = `${leitoDestino.setorNome} ${leitoDestino.codigoLeito}`;
      const mensagem = `*❌ REGULAÇÃO CANCELADA*\n\n- *Paciente:* _${pacienteParaAcao.nomeCompleto}_\n- *Origem:* _${pacienteParaAcao.setorOrigem} ${pacienteParaAcao.leitoCodigo}_\n- *Destino Cancelado:* _${destinoCancelado}_\n- *Motivo:* _${motivo}_\n- _${dataHora}_`;

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(mensagem);
        } catch (err) {
          console.error('Erro ao copiar mensagem de cancelamento:', err);
        }
      }

      toast({ title: "Cancelado!", description: "A mensagem foi copiada para a área de transferência." });
      setCancelamentoModalOpen(false);
      setPacienteParaAcao(null);
    } finally {
      setActingOnPatientId(null);
    }
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
    motivo: DetalhesRemanejamento | string
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
          `Solicitou remanejamento para ${paciente.nomeCompleto}. Motivo: ${descreverMotivoRemanejamento(motivo)}`,
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
      console.log('handleConfirmarAlocacaoCirurgia chamado com:', { cirurgia, leito });

      // Validação de dados antes de chamar a função
      if (!cirurgia || !cirurgia.id) {
        console.error('Dados da cirurgia incompletos:', cirurgia);
        toast({
          title: "Erro",
          description: "Dados da cirurgia estão incompletos.",
          variant: "destructive"
        });
        return;
      }

      if (!leito || !leito.id || !leito.codigoLeito) {
        console.error('Dados do leito incompletos:', leito);
        toast({
          title: "Erro", 
          description: "Dados do leito estão incompletos.",
          variant: "destructive"
        });
        return;
      }

      console.log('Chamando reservarLeitoParaCirurgia...');
      await reservarLeitoParaCirurgia(cirurgia.id, leito);
      
      console.log('Reserva concluída, fechando modais...');
      setAlocacaoCirurgiaModalOpen(false);
      setCirurgiaParaAlocar(null);

    } catch (error) {
      console.error("Erro em handleConfirmarAlocacaoCirurgia:", error);
      // O erro já foi tratado na função reservarLeitoParaCirurgia
      // Não precisa exibir outro toast aqui
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

        const pacientesJaProcessados = new Set<string>();

        // Detecta reservas externas que estão sendo efetivadas
        const reservasExternasEfetivadas: PacienteDaPlanilha[] = [];
        for (const pacientePlanilha of pacientesDaPlanilha) {
          const chave = gerarChaveUnica(pacientePlanilha);
          const pacienteSistema: any = mapaPacientesSistema.get(chave);
          if (
            pacienteSistema &&
            pacienteSistema.origem?.deLeito === 'Externo'
          ) {
            reservasExternasEfetivadas.push(pacientePlanilha);
            pacientesJaProcessados.add(chave);
          }
        }

        // Detecta regulações concluídas
        const regulacoesConcluidas: Paciente[] = [];
        for (const pacientePlanilha of pacientesDaPlanilha) {
          const chave = gerarChaveUnica(pacientePlanilha);
          if (pacientesJaProcessados.has(chave)) continue;
          const pacienteSistema: any = mapaPacientesSistema.get(chave);
          if (
            pacienteSistema &&
            pacienteSistema.regulacao &&
            pacienteSistema.regulacao.paraLeito === pacientePlanilha.leitoCodigo
          ) {
            regulacoesConcluidas.push(pacienteSistema);
            pacientesJaProcessados.add(chave);
          }
        }

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
          .filter((p) => {
            const chave = gerarChaveUnica(p);
            return (
              mapaPacientesSistema.has(chave) && !pacientesJaProcessados.has(chave)
            );
          })
          .map((p) => {
            const pacienteSistema = mapaPacientesSistema.get(gerarChaveUnica(p))!;
            const leitoAntigo = mapaLeitosSistema.get(pacienteSistema.leitoId);
            return { paciente: p, leitoAntigo: leitoAntigo?.codigoLeito };
          })
          .filter((t) => t.paciente.leitoCodigo !== t.leitoAntigo);

        // --- ETAPA E: GERAÇÃO DO RESUMO FINAL ---

        // Armazena o resultado da análise no estado para exibir no modal de confirmação.
        setSyncSummary({
          novasInternacoes,
          transferencias,
          altas,
          reservasExternasEfetivadas,
          regulacoesConcluidas,
        });

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

    // Processa regulações concluídas antes de iniciar o batch principal
    for (const paciente of syncSummary.regulacoesConcluidas) {
      await handleConcluir(paciente);
    }

    // 2. CRIAÇÃO DO "CARRINHO DE COMPRAS" (BATCH) E PREPARAÇÃO DE DADOS
    // --------------------------------------------------

    // O `writeBatch` garante que todas as operações sejam executadas com sucesso, ou nenhuma delas.
    const batch = writeBatch(db);
    // Pega a data e hora atuais para garantir que todos os registros tenham o mesmo timestamp.
    const agora = new Date().toISOString();
    // Cria mapas de acesso rápido para leitos e setores para otimizar a performance.
    const mapaLeitos = new Map(leitos.map((l) => [l.codigoLeito, l]));
    const mapaSetores = new Map(setores.map((s) => [s.nomeSetor, s]));

    // --- PREPROCESSAMENTO DE RESERVAS ---
    const normalizarChave = (nome: string, nasc: string) =>
      `${nome.toUpperCase().trim()}-${nasc.trim()}`;

    const mapaReservas = new Map<
      string,
      { pacienteId: string; leitoReservadoId: string; codigoLeitoReservado: string }
    >();

    leitos.forEach((leito) => {
      const historico = leito.historicoMovimentacao || [];
      const ultimo = historico[historico.length - 1];
      if (ultimo?.statusLeito === "Reservado" && ultimo.pacienteId) {
        const pacienteDoc = pacientes.find((p) => p.id === ultimo.pacienteId);
        if (pacienteDoc) {
          const chave = normalizarChave(
            pacienteDoc.nomeCompleto,
            pacienteDoc.dataNascimento
          );
          mapaReservas.set(chave, {
            pacienteId: pacienteDoc.id,
            leitoReservadoId: leito.id,
            codigoLeitoReservado: leito.codigoLeito,
          });
        }
      }
    });

    const reservasConfirmadas: { nomeCompleto: string; codigoLeito: string }[] = [];
    const processados = new Set<string>();

    // Processa pacientes com reservas externas efetivadas
    for (const pacientePlanilha of syncSummary.reservasExternasEfetivadas) {
      const chave = normalizarChave(
        pacientePlanilha.nomeCompleto,
        pacientePlanilha.dataNascimento
      );
      const reserva = mapaReservas.get(chave);
      if (!reserva) continue;

      const leitoPlanilha = mapaLeitos.get(pacientePlanilha.leitoCodigo);
      if (!leitoPlanilha) continue;

      const pacienteRef = doc(db, "pacientesRegulaFacil", reserva.pacienteId);
      batch.update(pacienteRef, {
        leitoId: leitoPlanilha.id,
        setorId: leitoPlanilha.setorId,
        nomeCompleto: pacientePlanilha.nomeCompleto.toUpperCase(),
        dataNascimento: pacientePlanilha.dataNascimento,
        sexoPaciente: pacientePlanilha.sexo,
        dataInternacao: pacientePlanilha.dataInternacao,
        especialidadePaciente: pacientePlanilha.especialidade,
      });

      if (reserva.codigoLeitoReservado === pacientePlanilha.leitoCodigo) {
        const leitoRef = doc(db, "leitosRegulaFacil", reserva.leitoReservadoId);
        batch.update(leitoRef, {
          historicoMovimentacao: arrayUnion({
            statusLeito: "Ocupado",
            dataAtualizacaoStatus: agora,
            pacienteId: reserva.pacienteId,
          }),
        });
      } else {
        const leitoReservadoRef = doc(
          db,
          "leitosRegulaFacil",
          reserva.leitoReservadoId
        );
        batch.update(leitoReservadoRef, {
          historicoMovimentacao: arrayUnion({
            statusLeito: "Vago",
            dataAtualizacaoStatus: agora,
            pacienteId: null,
            infoRegulacao: null,
          }),
        });

        const leitoCorretoRef = doc(db, "leitosRegulaFacil", leitoPlanilha.id);
        batch.update(leitoCorretoRef, {
          historicoMovimentacao: arrayUnion({
            statusLeito: "Ocupado",
            dataAtualizacaoStatus: agora,
            pacienteId: reserva.pacienteId,
          }),
        });

        registrarLog(
          `Paciente ${pacientePlanilha.nomeCompleto} foi internado no leito ${pacientePlanilha.leitoCodigo}, mas a reserva original era para o leito ${reserva.codigoLeitoReservado}. A reserva foi cancelada e o leito liberado.`,
          "Importação de Pacientes"
        );
      }

      reservasConfirmadas.push({
        nomeCompleto: pacientePlanilha.nomeCompleto,
        codigoLeito: pacientePlanilha.leitoCodigo,
      });
      processados.add(chave);
      mapaReservas.delete(chave);
    }

    try {
      // 3. PROCESSANDO AS ALTAS
      // --------------------------------------------------
      for (const itemAlta of syncSummary.altas) {
        // Encontra o paciente completo no estado atual para obter os IDs necessários.
        const pacienteParaAlta = pacientes.find(
          (p) => p.nomeCompleto === itemAlta.nomePaciente
        );

        if (pacienteParaAlta) {
          const chaveAlta = normalizarChave(
            pacienteParaAlta.nomeCompleto,
            pacienteParaAlta.dataNascimento
          );
          if (mapaReservas.has(chaveAlta)) {
            continue; // mantém reserva ativa
          }

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
        const chave = normalizarChave(
          paciente.nomeCompleto,
          paciente.dataNascimento
        );
        if (processados.has(chave)) continue;

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
        const chaveNova = normalizarChave(
          novaInternacao.nomeCompleto,
          novaInternacao.dataNascimento
        );
        if (processados.has(chaveNova)) continue;

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
      const logResumo = `Sincronização via planilha concluída. Resumo: ${syncSummary.novasInternacoes.length} novas internações, ${syncSummary.transferencias.length} transferências, ${syncSummary.altas.length} altas, ${syncSummary.reservasExternasEfetivadas.length} reservas efetivadas e ${syncSummary.regulacoesConcluidas.length} regulações concluídas.`;

      // Registra o resumo como um único evento na auditoria.
      registrarLog(logResumo, "Sincronização MV");

      // 6. EXECUÇÃO FINAL E SEGURA
      // --------------------------------------------------
      // Envia todas as operações do "carrinho" para o Firestore de uma só vez.
      await batch.commit();

      if (reservasConfirmadas.length > 0) {
        const lista = reservasConfirmadas
          .map((r) => `${r.nomeCompleto} (${r.codigoLeito})`)
          .join(", ");
        registrarLog(
          `Importação da planilha confirmou a internação dos seguintes pacientes com reserva: ${lista}. Seus leitos foram atualizados para 'Ocupado'.`,
          "Importação de Pacientes"
        );
      }

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

  // Integração com alertas de isolamento - COM GUARDA DE CARREGAMENTO
  useEffect(() => {
    // GUARDA DE CARREGAMENTO
    if (loading || alertasLoading) {
      return;
    }

    const mapaRemanejamentoContaminacao = new Map();
    todosPacientesPendentes.forEach((p) => {
      if (
        p.remanejarPaciente &&
        (typeof p.motivoRemanejamento === 'string'
          ? p.motivoRemanejamento.startsWith("Risco de contaminação")
          : p.motivoRemanejamento?.tipo === 'incompatibilidade_biologica')
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
  }, [alertas, todosPacientesPendentes, loading, alertasLoading, solicitarRemanejamento, cancelarPedidoRemanejamento]);

  const handleAltaDireta = async (paciente: any) => {
    if (!userData) {
      toast({ title: "Aguarde", description: "Carregando dados do usuário...", variant: "default" });
      return;
    }

    setActingOnPatientId(paciente.id);

    try {
      // 1. Deletar o documento do paciente
      await deleteDoc(doc(db, 'pacientesRegulaFacil', paciente.id));

      // 2. Atualizar o leito para Higienização
      await atualizarStatusLeito(paciente.leitoId, 'Higienizacao');

      // 3. Registrar no log de auditoria
      const logMessage = `Deu alta para o paciente ${paciente.nomeCompleto} que estava no leito ${paciente.leitoCodigo}.`;
      registrarLog(logMessage, 'Regulação de Leitos');

      toast({ title: "Sucesso!", description: "Paciente recebeu alta e o leito foi liberado." });
    } catch (error) {
      console.error("Erro ao dar alta direta:", error);
      toast({ title: "Erro", description: "Não foi possível dar alta ao paciente.", variant: "destructive" });
    } finally {
      setActingOnPatientId(null);
    }
  };

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
      remanejamentosPendentes,
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
      actingOnPatientId,
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
      handleAltaDireta,
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
