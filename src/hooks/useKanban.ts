import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { KanbanEntry, KanbanPendencia, KanbanTratativa, PacienteKanban } from '@/types/kanban';
import { useAuth } from './useAuth';

export const useKanban = () => {
  const [kanban, setKanban] = useState<KanbanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    const q = collection(db, 'kanbanRegulaFacil');
    const unsub = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as KanbanEntry[];
      setKanban(entries);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const adicionarPacienteAoKanban = useCallback(
    async (paciente: PacienteKanban) => {
      if (!userData) return;
      const ref = doc(db, 'kanbanRegulaFacil', paciente.id);
      const now = new Date().toISOString();
      const data: KanbanEntry = {
        id: paciente.id,
        pacienteId: paciente.id,
        monitoradoDesde: now,
        monitoradoPor: userData.nomeCompleto,
        ultimaAtualizacao: now,
        pendencias: [],
        tratativas: [],
        finalizado: false,
      };
      await setDoc(ref, data);
    },
    [userData]
  );

  const adicionarPendencia = useCallback(
    async (pacienteId: string, texto: string) => {
      if (!userData) return;
      const ref = doc(db, 'kanbanRegulaFacil', pacienteId);
      const now = new Date().toISOString();
      const pendencia: KanbanPendencia = {
        id: crypto.randomUUID(),
        texto,
        criadaEm: now,
        criadaPor: userData.nomeCompleto,
        resolvida: false,
      };
      await updateDoc(ref, {
        pendencias: arrayUnion(pendencia),
        ultimaAtualizacao: now,
      });
    },
    [userData]
  );

  const removerPendencia = useCallback(async (pacienteId: string, pendenciaId: string) => {
    const ref = doc(db, 'kanbanRegulaFacil', pacienteId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as KanbanEntry;
    const pendencias = data.pendencias.filter((p) => p.id !== pendenciaId);
    await updateDoc(ref, {
      pendencias,
      ultimaAtualizacao: new Date().toISOString(),
    });
  }, []);

  const adicionarTratativa = useCallback(
    async (pacienteId: string, texto: string) => {
      if (!userData) return;
      const ref = doc(db, 'kanbanRegulaFacil', pacienteId);
      const now = new Date().toISOString();
      const tratativa: KanbanTratativa = {
        id: crypto.randomUUID(),
        texto,
        criadaEm: now,
        criadaPor: userData.nomeCompleto,
      };
      await updateDoc(ref, {
        tratativas: arrayUnion(tratativa),
        ultimaAtualizacao: now,
      });
    },
    [userData]
  );

  const atualizarPrevisaoAlta = useCallback(async (pacienteId: string, data: string) => {
    const ref = doc(db, 'kanbanRegulaFacil', pacienteId);
    await updateDoc(ref, {
      previsaoAlta: data,
      ultimaAtualizacao: new Date().toISOString(),
    });
  }, []);

  return {
    kanban,
    loading,
    adicionarPacienteAoKanban,
    adicionarPendencia,
    removerPendencia,
    adicionarTratativa,
    atualizarPrevisaoAlta,
  };
};
