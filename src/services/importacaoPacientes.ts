
import { db } from '@/lib/firebase';
import {
  writeBatch,
  collection,
  getDocs,
  doc,
  arrayUnion,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Leito, Paciente, HistoricoLeito } from '@/types/hospital';

// Tipagem mínima esperada pela planilha (campos podem vir com nomes levemente diferentes)
export interface PacientePlanilha {
  atendimentoId?: string;
  nomeCompleto: string;
  dataNascimento: string;
  sexo?: 'Masculino' | 'Feminino';
  sexoPaciente?: 'Masculino' | 'Feminino';
  dataInternacao: string;
  setorNome?: string;
  leitoCodigo: string;
  especialidade?: string;
  especialidadePaciente?: string;
}

// Resultado resumido para feedback/telemetria (opcional para UI)
export interface ImportacaoResumo {
  novasInternacoes: Array<{ atendimentoKey: string; leitoCodigo: string }>;
  transferencias: Array<{ atendimentoKey: string; deLeito: string; paraLeito: string }>;
  altas: Array<{ atendimentoKey: string; deLeito: string }>;
  avisos: string[];
}

/**
 * Normaliza o nome em MAIÚSCULAS e remove espaços extras.
 */
const normalizeName = (name: string) =>
  (name || '').trim().replace(/\s+/g, ' ').toUpperCase();

/**
 * Gera a chave de identificação do paciente (estável entre fontes).
 * Prioriza atendimentoId. Como fallback, usa nome+dataNascimento.
 */
const getAtendimentoKey = (p: { atendimentoId?: string; nomeCompleto: string; dataNascimento: string }) => {
  if (p.atendimentoId && String(p.atendimentoId).trim().length > 0) {
    return String(p.atendimentoId).trim();
  }
  return `${normalizeName(p.nomeCompleto)}|${(p.dataNascimento || '').trim()}`;
};

/**
 * Converte uma linha da planilha para o payload do documento Paciente (sem id).
 */
const mapPlanilhaToPacienteDoc = (p: PacientePlanilha, leito: Leito): Omit<Paciente, 'id'> => {
  const sexoPaciente = (p.sexoPaciente || p.sexo || 'Masculino') as Paciente['sexoPaciente'];
  const especialidadePaciente = (p.especialidadePaciente || p.especialidade || '').toString();

  return {
    leitoId: leito.id,
    setorId: leito.setorId,
    nomeCompleto: normalizeName(p.nomeCompleto),
    dataNascimento: p.dataNascimento,
    sexoPaciente,
    dataInternacao: p.dataInternacao,
    especialidadePaciente,
    // Campos opcionais mantidos como indefinidos para não conflitar com o restante do sistema
    id: '' as any, // será o doc.id do Firestore; não persiste dentro do documento
  } as unknown as Omit<Paciente, 'id'>;
};

/**
 * Recupera o último status (se houver) do histórico de um leito.
 */
const getStatusAtualDoLeito = (leito: Leito): HistoricoLeito['statusLeito'] | undefined => {
  const hist = leito.historicoMovimentacao || [];
  if (hist.length === 0) return undefined;
  // assume que o histórico é cronológico; se não for, poderíamos ordenar por data
  return hist[hist.length - 1].statusLeito;
};

/**
 * Reconciliador atômico: aplica novas internações, transferências e altas em um único batch.
 * Evita pacientes "fantasmas" ao não deletar nada antes de construir todo o plano de escrita.
 */
export const reconciliarPacientesComPlanilha = async (
  pacientesDaPlanilha: PacientePlanilha[]
): Promise<ImportacaoResumo> => {
  // === PASSO 1: CARREGAR DADOS ATUAIS EM PARALELO ===
  const [pacientesSnapshot, leitosSnapshot] = await Promise.all([
    getDocs(collection(db, 'pacientesRegulaFacil')),
    getDocs(collection(db, 'leitosRegulaFacil')),
  ]);

  // Map de pacientes atuais por atendimentoKey
  const pacientesAtuaisMap = new Map<string, { id: string } & DocumentData>(
    pacientesSnapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
      const data = d.data();
      const key = getAtendimentoKey({
        atendimentoId: data.atendimentoId,
        nomeCompleto: data.nomeCompleto,
        dataNascimento: data.dataNascimento,
      });
      return [key, { id: d.id, ...data }];
    })
  );

  // Map de leitos por código (codigoLeito)
  const leitosPorCodigo = new Map<string, { id: string } & Leito>(
    leitosSnapshot.docs.map((d) => {
      const data = d.data() as Leito;
      return [data.codigoLeito, { id: d.id, ...data }];
    })
  );

  // Map rápido dos pacientes da planilha por atendimentoKey
  const pacientesPlanilhaMap = new Map<string, PacientePlanilha>(
    pacientesDaPlanilha.map((p) => [getAtendimentoKey(p), p])
  );

  // === PASSO 2: PREPARAR O BATCH (PLANO DE ESCRITA) ===
  const batch = writeBatch(db);
  const nowISO = new Date().toISOString();

  const resumo: ImportacaoResumo = {
    novasInternacoes: [],
    transferencias: [],
    altas: [],
    avisos: [],
  };

  // Auxiliar para registrar novo evento de histórico
  const pushHistorico = (leitoId: string, status: HistoricoLeito['statusLeito'], pacienteId?: string) => {
    const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
    const novoEvento: HistoricoLeito = {
      statusLeito: status,
      dataAtualizacaoStatus: nowISO,
      ...(pacienteId ? { pacienteId } : {}),
    };
    batch.update(leitoRef, { historicoMovimentacao: arrayUnion(novoEvento) });
  };

  // === PASSO 3: PROCESSAR CADA PACIENTE DA PLANILHA (TRANSFERÊNCIAS E NOVAS INTERNAÇÕES) ===
  for (const pacientePlanilha of pacientesDaPlanilha) {
    const atendimentoKey = getAtendimentoKey(pacientePlanilha);

    const leitoDestino = leitosPorCodigo.get(pacientePlanilha.leitoCodigo);
    if (!leitoDestino) {
      resumo.avisos.push(
        `Leito "${pacientePlanilha.leitoCodigo}" da planilha não encontrado. Paciente "${pacientePlanilha.nomeCompleto}" ignorado.`
      );
      continue; // não conseguimos alocar sem o leito
    }

    const pacienteAtual = pacientesAtuaisMap.get(atendimentoKey);

    if (pacienteAtual) {
      // CASO 1: PACIENTE EXISTE -> verificar se houve transferência
      if (pacienteAtual.leitoId !== leitoDestino.id) {
        // Libera o leito antigo (se houver)
        if (pacienteAtual.leitoId) {
          pushHistorico(pacienteAtual.leitoId, 'Vago', pacienteAtual.id);
        }

        // Atualiza o paciente para o novo leito
        const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteAtual.id);
        batch.update(pacienteRef, {
          leitoId: leitoDestino.id,
          setorId: leitoDestino.setorId,
        });

        // Ocupa o novo leito
        pushHistorico(leitoDestino.id, 'Ocupado', pacienteAtual.id);

        // Resumo
        resumo.transferencias.push({
          atendimentoKey,
          deLeito: pacienteAtual.leitoId || 'N/A',
          paraLeito: leitoDestino.codigoLeito,
        });
      } else {
        // Nada a fazer: paciente e leito já condizem com a planilha
      }
    } else {
      // CASO 2: NOVO PACIENTE (NOVA INTERNAÇÃO)
      const novoPacienteRef = doc(collection(db, 'pacientesRegulaFacil'));
      const payload = mapPlanilhaToPacienteDoc(pacientePlanilha, leitoDestino);

      batch.set(novoPacienteRef, {
        ...payload,
        // Persistimos a referência do atendimentoId se existir, para chaves futuras
        atendimentoId: pacientePlanilha.atendimentoId || null,
      });

      // Ocupa o leito com o novo paciente
      pushHistorico(leitoDestino.id, 'Ocupado', novoPacienteRef.id);

      resumo.novasInternacoes.push({
        atendimentoKey,
        leitoCodigo: leitoDestino.codigoLeito,
      });
    }
  }

  // === PASSO 4: PROCESSAR ALTAS (PACIENTES QUE SUMIRAM DA PLANILHA) ===
  for (const [atendimentoKey, pacienteAtual] of pacientesAtuaisMap.entries()) {
    if (!pacientesPlanilhaMap.has(atendimentoKey)) {
      // Alta: liberar leito e remover paciente
      if (pacienteAtual.leitoId) {
        pushHistorico(pacienteAtual.leitoId, 'Vago', pacienteAtual.id);
      }
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteAtual.id);
      batch.delete(pacienteRef);

      resumo.altas.push({
        atendimentoKey,
        deLeito: pacienteAtual.leitoId || 'N/A',
      });
    }
  }

  // === PASSO 5: COMMIT ÚNICO (ATÔMICO) ===
  await batch.commit();

  toast({
    title: 'Sincronização concluída',
    description: `Novas: ${resumo.novasInternacoes.length} • Transferências: ${resumo.transferencias.length} • Altas: ${resumo.altas.length}`,
  });

  // Feedback adicional de avisos (se houver)
  if (resumo.avisos.length > 0) {
    console.warn('[Importação Planilha] Avisos:', resumo.avisos);
  }

  return resumo;
};
