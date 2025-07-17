
// src/hooks/useLeitos.ts

import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  arrayUnion,
  writeBatch,
  addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Leito, LeitoFormData, HistoricoMovimentacao } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';
import { useAuditoria } from './useAuditoria';

export const useLeitos = () => {
  const [leitos, setLeitos] = useState<Leito[]>([]);
  const [loading, setLoading] = useState(true);
  const { registrarLog } = useAuditoria();

  useEffect(() => {
    const q = query(collection(db, 'leitosRegulaFacil'), orderBy('codigoLeito'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leitosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Leito[];
      setLeitos(leitosData);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao buscar leitos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos leitos.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Adiciona um ou mais leitos a um setor específico.
   * Se o código do leito contiver vírgulas, cria múltiplos leitos.
   */
  const adicionarLeito = async (setorId: string, data: LeitoFormData) => {
    setLoading(true);
    try {
      const { codigoLeito, leitoPCP, leitoIsolamento } = data;
      const agora = new Date().toISOString();

      if (codigoLeito.includes(',')) {
        // --- LÓGICA DE CRIAÇÃO EM LOTE ---
        const batch = writeBatch(db);
        const codigos = codigoLeito.split(',').map(c => c.trim()).filter(Boolean);

        codigos.forEach(codigo => {
          const novoHistorico: HistoricoMovimentacao = {
            statusLeito: 'Vago',
            dataAtualizacaoStatus: agora,
          };
          const novoLeito: Omit<Leito, 'id'> = {
            setorId,
            codigoLeito: codigo,
            leitoPCP: false, // Default para lote
            leitoIsolamento: false, // Default para lote
            historicoMovimentacao: [novoHistorico],
          };
          const leitoRef = doc(collection(db, 'leitosRegulaFacil'));
          batch.set(leitoRef, novoLeito);
        });

        await batch.commit();
        registrarLog(`Adicionou ${codigos.length} leitos em lote ao setor ID ${setorId}.`, 'Gestão de Leitos');
        toast({
          title: "Sucesso!",
          description: `${codigos.length} leitos adicionados com sucesso.`,
        });

      } else {
        // --- LÓGICA DE CRIAÇÃO INDIVIDUAL ---
        const leitosCollectionRef = collection(db, 'leitosRegulaFacil');
        const novoHistorico: HistoricoMovimentacao = {
          statusLeito: 'Vago',
          dataAtualizacaoStatus: agora,
        };
        const novoLeito: Omit<Leito, 'id'> = {
          setorId,
          codigoLeito: codigoLeito.trim(),
          leitoPCP,
          leitoIsolamento,
          historicoMovimentacao: [novoHistorico],
        };
        await addDoc(leitosCollectionRef, novoLeito);
        registrarLog(`Adicionou o leito ${codigoLeito.trim()} ao setor ID ${setorId}.`, 'Gestão de Leitos');
        toast({
          title: "Sucesso",
          description: "Leito adicionado com sucesso.",
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar leito(s):', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o(s) leito(s).",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza as propriedades estáticas de um leito.
   */
  const atualizarLeito = async (leitoId: string, data: Partial<LeitoFormData>) => {
    setLoading(true);
    try {
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
      await updateDoc(leitoRef, data);
      registrarLog(`Atualizou os dados do leito ID ${leitoId}.`, 'Gestão de Leitos');
      toast({
        title: "Sucesso",
        description: "Leito atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar leito:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o leito.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exclui um leito do sistema.
   */
  const excluirLeito = async (leitoId: string) => {
    setLoading(true);
    try {
      const leito = leitos.find(l => l.id === leitoId);
      // Adicionar verificação futura se o leito está ocupado
      const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
      await deleteDoc(leitoRef);

      if (leito) {
        registrarLog(`Excluiu o leito ${leito.codigoLeito}.`, 'Gestão de Leitos');
      }
      toast({
        title: "Sucesso",
        description: "Leito excluído com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir leito:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o leito.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza o status de um leito adicionando um novo registro ao histórico.
   */
  const atualizarStatusLeito = async (leitoId: string, novoStatus: HistoricoMovimentacao['statusLeito'], detalhes: Omit<HistoricoMovimentacao, 'statusLeito' | 'dataAtualizacaoStatus'> = {}) => {
    setLoading(true);
    try {
        const leitoRef = doc(db, 'leitosRegulaFacil', leitoId);
        const novoHistorico: HistoricoMovimentacao = {
            statusLeito: novoStatus,
            dataAtualizacaoStatus: new Date().toISOString(),
            ...detalhes
        };

        await updateDoc(leitoRef, {
            historicoMovimentacao: arrayUnion(novoHistorico)
        });

        const leito = leitos.find(l => l.id === leitoId);
        if (leito) {
            registrarLog(`Status do leito ${leito.codigoLeito} alterado para ${novoStatus}.`, 'Mapa de Leitos');
        }

    } catch (error) {
        console.error('Erro ao atualizar status do leito:', error);
        toast({
            title: "Erro",
            description: "Não foi possível atualizar o status do leito.",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
  };

  return {
    leitos,
    loading,
    adicionarLeito,
    atualizarLeito,
    excluirLeito,
    atualizarStatusLeito,
  };
};
