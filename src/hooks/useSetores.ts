import { useState, useMemo } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SetorFormData } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';
import { useAuditoria } from './useAuditoria';
import { useCache } from '@/contexts/CacheContext'; // Importe o useCache
import { useLeitos } from './useLeitos'; // Mantenha para enriquecer os dados
import { usePacientes } from './usePacientes'; // Mantenha para enriquecer os dados

export const useSetores = () => {
  // 1. DADOS VÊM DO CACHE
  const { setores: setoresDoCache, loading: loadingCache } = useCache();
  const [loadingMutation, setLoadingMutation] = useState(false);
  const { registrarLog } = useAuditoria();

  // A lógica de enriquecimento com leitos e pacientes é complexa e pode ser mantida
  // desde que consuma os dados do cache e de outros hooks.
  const { leitos } = useLeitos();
  const { pacientes } = usePacientes();

  const setoresEnriquecidos = useMemo(() => {
    if (loadingCache || !setoresDoCache.length) return [];
    const mapaLeitos = new Map(leitos.map(l => [l.id, l]));
    const mapaPacientes = new Map(pacientes.map(p => [p.leitoId, p]));

    return setoresDoCache.map(setor => {
        const leitosDoSetor = leitos.filter(leito => leito.setorId === setor.id).map(leito => {
            const ultimoHistorico = leito.historicoMovimentacao?.[leito.historicoMovimentacao.length - 1];
            return {
                ...leito,
                statusLeito: ultimoHistorico?.statusLeito || 'Vago',
                dadosPaciente: mapaPacientes.get(leito.id),
            };
        });
        return { ...setor, leitos: leitosDoSetor };
    });
  }, [setoresDoCache, leitos, pacientes, loadingCache]);


  // 2. RESTAURE AS FUNÇÕES DE ESCRITA
  const criarSetor = async (data: SetorFormData) => {
    setLoadingMutation(true);
    try {
      await addDoc(collection(db, 'setoresRegulaFacil'), data);
      registrarLog('Criação de Setor', `Criado: ${data.nomeSetor}`);
      toast({ title: "Sucesso", description: "Setor criado." });
    } catch (error) {
      console.error("Erro ao criar setor:", error);
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setLoadingMutation(false);
    }
  };

  const atualizarSetor = async (setorId: string, data: Partial<SetorFormData>) => {
    setLoadingMutation(true);
    try {
      await updateDoc(doc(db, 'setoresRegulaFacil', setorId), data);
      registrarLog('Atualização de Setor', `Atualizado: ${data.nomeSetor}`);
      toast({ title: "Sucesso", description: "Setor atualizado." });
    } catch (error) {
      console.error("Erro ao atualizar setor:", error);
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setLoadingMutation(false);
    }
  };

  const excluirSetor = async (setorId: string) => {
    setLoadingMutation(true);
    try {
      await deleteDoc(doc(db, 'setoresRegulaFacil', setorId));
      registrarLog('Exclusão de Setor', `Excluído ID: ${setorId}`);
      toast({ title: "Sucesso", description: "Setor excluído." });
    } catch (error) {
      console.error("Erro ao excluir setor:", error);
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setLoadingMutation(false);
    }
  };

  return {
    setores: setoresEnriquecidos, // Retorna os dados já combinados
    loading: loadingCache || loadingMutation,
    criarSetor,
    atualizarSetor,
    excluirSetor,
  };
};

