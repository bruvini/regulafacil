
import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  deleteField,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { Leito, Paciente, InfoAltaPendente } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';
import { reconciliarPacientesComPlanilha, PacientePlanilha, ImportacaoResumo } from '@/services/importacaoPacientes';
import { useLeitos } from './useLeitos';
import { useAuditoria } from './useAuditoria';

export const usePacientes = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const { vincularPacienteLeito } = useLeitos();
  const { registrarLog } = useAuditoria();

  useEffect(() => {
    // A consulta é na nova coleção 'pacientesRegulaFacil'
    const q = query(collection(db, 'pacientesRegulaFacil'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Transforma todos os documentos recebidos em um array de objetos
      const allDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Paciente[];

      // Usa um Map para garantir que cada paciente é único pelo seu ID.
      // O Map sobrescreve qualquer chave duplicada, resultando em uma coleção única.
      const pacientesMap = new Map(allDocs.map(paciente => [paciente.id, paciente]));

      // Converte os valores do Map de volta para um array e atualiza o estado.
      // Esta é agora a única fonte de verdade para a lista de pacientes.
      setPacientes(Array.from(pacientesMap.values()));

      setLoading(false);
    }, (error) => {
      console.error('Erro ao buscar pacientes:', error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível carregar os dados dos pacientes.",
        variant: "destructive",
      });
      setLoading(false);
    });

    // Limpa o listener ao desmontar o componente para evitar vazamentos de memória
    return () => unsubscribe();
  }, []); // O array de dependências vazio garante que o listener seja configurado apenas uma vez.

  const criarPacienteManual = async (
    dadosPaciente: Partial<Omit<Paciente, 'id'>>,
    options?: { retornarExistente?: boolean }
  ): Promise<string | null> => {
    const nomeEmMaiusculo = dadosPaciente.nomeCompleto!.toUpperCase();

    try {
      const q = query(
        collection(db, 'pacientesRegulaFacil'),
        where('nomeCompleto', '==', nomeEmMaiusculo),
        where('dataNascimento', '==', dadosPaciente.dataNascimento!)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const pacienteExistente = querySnapshot.docs[0];

        if (options?.retornarExistente) {
          return pacienteExistente.id;
        }

        if (dadosPaciente.leitoId) {
          const leitoSnap = await getDoc(doc(db, 'leitosRegulaFacil', dadosPaciente.leitoId));
          if (leitoSnap.exists()) {
            const leitoData = leitoSnap.data() as Leito;
            const historico = leitoData.historicoMovimentacao || [];
            const ultimo = historico[historico.length - 1];
            if (!ultimo.pacienteId || ultimo.statusLeito === 'Vago') {
              await vincularPacienteLeito(dadosPaciente.leitoId, pacienteExistente.id, dadosPaciente.setorId);
              return pacienteExistente.id;
            }
          }
        }

        toast({
          title: 'Erro de Duplicidade',
          description: 'Este paciente já está cadastrado no sistema (mesmo nome e data de nascimento).',
          variant: 'destructive',
        });
        return null;
      }

      const { leitoId, setorId, ...resto } = dadosPaciente;
      const docRef = await addDoc(collection(db, 'pacientesRegulaFacil'), {
        ...resto,
        nomeCompleto: nomeEmMaiusculo,
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar paciente manualmente:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o paciente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // NOVO: importação com reconciliação atômica (batch write)
  const importarPacientesDaPlanilha = async (pacientesDaPlanilha: PacientePlanilha[]): Promise<ImportacaoResumo> => {
    setLoading(true);
    try {
      const resumo = await reconciliarPacientesComPlanilha(pacientesDaPlanilha);
      return resumo;
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatusAltaPendente = async (pacienteId: string, dadosAlta: InfoAltaPendente | null) => {
    try {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, { altaPendente: dadosAlta });

      if (dadosAlta) {
        registrarLog(
          `Registrou pendência de alta para o paciente ${pacienteId}: ${dadosAlta.tipo}${dadosAlta.detalhe ? ' - ' + dadosAlta.detalhe : ''}.`,
          'Mapa de Leitos'
        );
      } else {
        registrarLog(`Removeu pendência de alta do paciente ${pacienteId}.`, 'Mapa de Leitos');
      }
    } catch (error) {
      console.error('Erro ao atualizar pendência de alta:', error);
    }
  };

  const darAltaPaciente = async (paciente: Paciente, usuario: User | null) => {
    if (!paciente.leitoId) {
      toast({ title: 'Erro', description: 'Paciente sem leito associado.', variant: 'destructive' });
      return;
    }

    if (!usuario) {
      toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
      return;
    }

    try {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', paciente.id);
      const leitoRef = doc(db, 'leitosRegulaFacil', paciente.leitoId);

      const batch = writeBatch(db);
      batch.delete(pacienteRef);
      batch.update(leitoRef, {
        status: 'Higienizacao',
        dadosPaciente: deleteField(),
      });

      await batch.commit();

      registrarLog(
        `Paciente ${paciente.nomeCompleto} (ID: ${paciente.id}) recebeu alta do leito ${paciente.leitoId}. Leito movido para higienização.`,
        'Regulação de Leitos'
      );

      toast({ title: 'Sucesso', description: 'Alta realizada com sucesso!' });
    } catch (error) {
      console.error('Erro ao dar alta no paciente:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a alta. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const solicitarRemanejamento = useCallback(
    async (paciente: Paciente, usuario: User | null, motivo: string) => {
      if (!usuario) {
        toast({
          title: 'Erro',
          description: 'Usuário não autenticado.',
          variant: 'destructive',
        });
        return;
      }

      try {
        const pacienteRef = doc(db, 'pacientesRegulaFacil', paciente.id);
        await updateDoc(pacienteRef, {
          remanejarPaciente: true,
          motivoRemanejamento: motivo,
          dataPedidoRemanejamento: new Date().toISOString(),
        });

        registrarLog(
          `Solicitou remanejamento para ${paciente.nomeCompleto}. Motivo: ${motivo}`,
          'Regulação de Leitos'
        );

        toast({
          title: 'Sucesso',
          description: 'Solicitação de remanejamento registrada.',
        });
      } catch (error) {
        console.error('Erro ao solicitar remanejamento:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível solicitar o remanejamento.',
          variant: 'destructive',
        });
      }
    },
    [registrarLog]
  );

  const concluirRemanejamento = async (paciente: Paciente) => {
    try {
      await updateDoc(doc(db, 'pacientesRegulaFacil', paciente.id), {
        remanejamentoPorIncompatibilidadeSolicitado: false,
        remanejarPaciente: false,
      });

      registrarLog(
        `Concluiu remanejamento para ${paciente.nomeCompleto}.`,
        'Gestão de Isolamentos'
      );
    } catch (error) {
      console.error('Erro ao concluir remanejamento:', error);
    }
  };

  const cancelarRemanejamento = async (paciente: Paciente) => {
    try {
      await updateDoc(doc(db, 'pacientesRegulaFacil', paciente.id), {
        remanejamentoPorIncompatibilidadeSolicitado: false,
        remanejarPaciente: false,
        motivoRemanejamento: null,
        dataPedidoRemanejamento: null,
      });

      registrarLog(
        `Cancelou remanejamento para ${paciente.nomeCompleto}.`,
        'Gestão de Isolamentos'
      );
    } catch (error) {
      console.error('Erro ao cancelar remanejamento:', error);
    }
  };

  return {
    pacientes,
    loading,
    criarPacienteManual,
    importarPacientesDaPlanilha, // exposto para uso na UI
    atualizarStatusAltaPendente,
    darAltaPaciente,
    solicitarRemanejamento,
    concluirRemanejamento,
    cancelarRemanejamento,
  };
};
