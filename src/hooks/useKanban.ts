
import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useAuditoria } from '@/hooks/useAuditoria';
import { usePacientes } from '@/hooks/usePacientes';
import { useLeitos } from '@/hooks/useLeitos';
import { useSetores } from '@/hooks/useSetores';
import { toast } from '@/hooks/use-toast';
import { 
  KanbanEntry, 
  KanbanPendencia, 
  KanbanTratativa, 
  KanbanEntryEnriquecida 
} from '@/types/kanban';
import { Paciente } from '@/types/hospital';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useKanban = () => {
  const [kanbanEntries, setKanbanEntries] = useState<KanbanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();
  const { registrarLog } = useAuditoria();
  const { pacientes } = usePacientes();
  const { leitos } = useLeitos();
  const { setores } = useSetores();

  // Listener para atualizações em tempo real
  useEffect(() => {
    const kanbanRef = collection(db, 'kanbanRegulaFacil');
    const q = query(
      kanbanRef, 
      where('finalizado', '==', false),
      orderBy('ultimaAtualizacao', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        monitoradoDesde: doc.data().monitoradoDesde || new Date().toISOString(),
        ultimaAtualizacao: doc.data().ultimaAtualizacao || new Date().toISOString(),
        pendencias: doc.data().pendencias || [],
        tratativas: doc.data().tratativas || [],
        finalizado: doc.data().finalizado || false
      })) as KanbanEntry[];
      
      setKanbanEntries(entries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Enriquece os dados do Kanban com informações dos pacientes
  const kanbanEnriquecido = useMemo<KanbanEntryEnriquecida[]>(() => {
    return kanbanEntries.map(entry => {
      const paciente = pacientes.find(p => p.id === entry.pacienteId);
      
      if (!paciente) {
        return {
          ...entry,
          dadosPaciente: undefined
        };
      }

      const leito = leitos.find(l => l.id === paciente.leitoId);
      const setor = setores.find(s => s.id === paciente.setorId);
      
      const tempoInternacao = formatDistanceToNow(
        new Date(paciente.dataInternacao), 
        { locale: ptBR, addSuffix: false }
      );

      return {
        ...entry,
        dadosPaciente: {
          nomeCompleto: paciente.nomeCompleto,
          dataInternacao: paciente.dataInternacao,
          especialidadePaciente: paciente.especialidadePaciente,
          leitoAtual: leito?.codigoLeito,
          setorAtual: setor?.siglaSetor,
          tempoInternacao
        }
      };
    });
  }, [kanbanEntries, pacientes, leitos, setores]);

  // Adiciona um paciente ao monitoramento
  const adicionarPacienteAoKanban = async (paciente: Paciente) => {
    if (!userData) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive"
      });
      return;
    }

    try {
      const kanbanRef = collection(db, 'kanbanRegulaFacil');
      const agora = new Date().toISOString();
      
      const novaEntry: Omit<KanbanEntry, 'id'> = {
        pacienteId: paciente.id,
        monitoradoDesde: agora,
        monitoradoPor: userData.nomeCompleto,
        ultimaAtualizacao: agora,
        pendencias: [],
        tratativas: [],
        finalizado: false
      };

      await addDoc(kanbanRef, novaEntry);

      registrarLog(
        `Adicionou o paciente ${paciente.nomeCompleto} ao monitoramento Kanban NIR.`, 
        'Kanban NIR'
      );

      toast({
        title: "Sucesso!",
        description: `${paciente.nomeCompleto} foi adicionado ao monitoramento.`
      });

    } catch (error) {
      console.error("Erro ao adicionar paciente ao Kanban:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o paciente ao monitoramento.",
        variant: "destructive"
      });
    }
  };

  // Adiciona uma pendência
  const adicionarPendencia = async (pacienteId: string, texto: string) => {
    if (!userData) return;

    try {
      const entry = kanbanEntries.find(e => e.pacienteId === pacienteId);
      if (!entry) return;

      const novaPendencia: KanbanPendencia = {
        id: crypto.randomUUID(),
        texto,
        criadaEm: new Date().toISOString(),
        criadaPor: userData.nomeCompleto,
        resolvida: false
      };

      const docRef = doc(db, 'kanbanRegulaFacil', entry.id);
      await updateDoc(docRef, {
        pendencias: arrayUnion(novaPendencia),
        ultimaAtualizacao: new Date().toISOString()
      });

      const paciente = pacientes.find(p => p.id === pacienteId);
      registrarLog(
        `Adicionou pendência "${texto}" para o paciente ${paciente?.nomeCompleto || pacienteId} no Kanban NIR.`, 
        'Kanban NIR'
      );

      toast({
        title: "Sucesso!",
        description: "Pendência adicionada com sucesso."
      });

    } catch (error) {
      console.error("Erro ao adicionar pendência:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a pendência.",
        variant: "destructive"
      });
    }
  };

  // Remove uma pendência
  const removerPendencia = async (pacienteId: string, pendenciaId: string) => {
    if (!userData) return;

    try {
      const entry = kanbanEntries.find(e => e.pacienteId === pacienteId);
      if (!entry) return;

      const pendencia = entry.pendencias.find(p => p.id === pendenciaId);
      if (!pendencia) return;

      const docRef = doc(db, 'kanbanRegulaFacil', entry.id);
      await updateDoc(docRef, {
        pendencias: arrayRemove(pendencia),
        ultimaAtualizacao: new Date().toISOString()
      });

      const paciente = pacientes.find(p => p.id === pacienteId);
      registrarLog(
        `Removeu pendência "${pendencia.texto}" do paciente ${paciente?.nomeCompleto || pacienteId} no Kanban NIR.`, 
        'Kanban NIR'
      );

      toast({
        title: "Sucesso!",
        description: "Pendência removida com sucesso."
      });

    } catch (error) {
      console.error("Erro ao remover pendência:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a pendência.",
        variant: "destructive"
      });
    }
  };

  // Adiciona uma tratativa
  const adicionarTratativa = async (pacienteId: string, texto: string) => {
    if (!userData) return;

    try {
      const entry = kanbanEntries.find(e => e.pacienteId === pacienteId);
      if (!entry) return;

      const novaTratativa: KanbanTratativa = {
        id: crypto.randomUUID(),
        texto,
        criadaEm: new Date().toISOString(),
        criadaPor: userData.nomeCompleto
      };

      const docRef = doc(db, 'kanbanRegulaFacil', entry.id);
      await updateDoc(docRef, {
        tratativas: arrayUnion(novaTratativa),
        ultimaAtualizacao: new Date().toISOString()
      });

      const paciente = pacientes.find(p => p.id === pacienteId);
      registrarLog(
        `Adicionou tratativa "${texto}" para o paciente ${paciente?.nomeCompleto || pacienteId} no Kanban NIR.`, 
        'Kanban NIR'
      );

      toast({
        title: "Sucesso!",
        description: "Tratativa adicionada com sucesso."
      });

    } catch (error) {
      console.error("Erro ao adicionar tratativa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a tratativa.",
        variant: "destructive"
      });
    }
  };

  // Atualiza a previsão de alta
  const atualizarPrevisaoAlta = async (pacienteId: string, data: string) => {
    if (!userData) return;

    try {
      const entry = kanbanEntries.find(e => e.pacienteId === pacienteId);
      if (!entry) return;

      const docRef = doc(db, 'kanbanRegulaFacil', entry.id);
      await updateDoc(docRef, {
        previsaoAlta: data,
        ultimaAtualizacao: new Date().toISOString()
      });

      const paciente = pacientes.find(p => p.id === pacienteId);
      registrarLog(
        `Atualizou previsão de alta para ${data} do paciente ${paciente?.nomeCompleto || pacienteId} no Kanban NIR.`, 
        'Kanban NIR'
      );

      toast({
        title: "Sucesso!",
        description: "Previsão de alta atualizada com sucesso."
      });

    } catch (error) {
      console.error("Erro ao atualizar previsão de alta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a previsão de alta.",
        variant: "destructive"
      });
    }
  };

  // Finaliza o monitoramento
  const finalizarMonitoramento = async (pacienteId: string) => {
    if (!userData) return;

    try {
      const entry = kanbanEntries.find(e => e.pacienteId === pacienteId);
      if (!entry) return;

      const docRef = doc(db, 'kanbanRegulaFacil', entry.id);
      await updateDoc(docRef, {
        finalizado: true,
        finalizadoEm: new Date().toISOString(),
        finalizadoPor: userData.nomeCompleto,
        ultimaAtualizacao: new Date().toISOString()
      });

      const paciente = pacientes.find(p => p.id === pacienteId);
      registrarLog(
        `Finalizou o monitoramento do paciente ${paciente?.nomeCompleto || pacienteId} no Kanban NIR.`, 
        'Kanban NIR'
      );

      toast({
        title: "Sucesso!",
        description: "Monitoramento finalizado com sucesso."
      });

    } catch (error) {
      console.error("Erro ao finalizar monitoramento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o monitoramento.",
        variant: "destructive"
      });
    }
  };

  return {
    kanbanEntries: kanbanEnriquecido,
    loading,
    adicionarPacienteAoKanban,
    adicionarPendencia,
    removerPendencia,
    adicionarTratativa,
    atualizarPrevisaoAlta,
    finalizarMonitoramento
  };
};
