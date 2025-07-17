
// src/hooks/useSetores.ts

import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Setor, SetorFormData, Leito } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';
import { useAuditoria } from './useAuditoria';

export const useSetores = () => {
  const [setores, setSetores] = useState<(Setor & { leitos: Leito[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const { registrarLog } = useAuditoria();

  useEffect(() => {
    const setoresQuery = query(collection(db, 'setoresRegulaFacil'), orderBy('nomeSetor'));
    const leitosQuery = query(collection(db, 'leitosRegulaFacil'), orderBy('codigoLeito'));

    let setoresData: Setor[] = [];
    let leitosData: Leito[] = [];
    let loadingCount = 2;

    const checkAndCombineData = () => {
      loadingCount--;
      if (loadingCount === 0) {
        // Combinar setores com seus leitos
        const setoresComLeitos = setoresData.map(setor => {
          const leitosDoSetor = leitosData.filter(leito => leito.setorId === setor.id);
          
          // Adicionar status atual e dados do paciente aos leitos
          const leitosComStatus = leitosDoSetor.map(leito => {
            const ultimoHistorico = leito.historicoMovimentacao?.[leito.historicoMovimentacao.length - 1];
            return {
              ...leito,
              statusLeito: ultimoHistorico?.statusLeito || 'Vago',
              dataAtualizacaoStatus: ultimoHistorico?.dataAtualizacaoStatus,
              dadosPaciente: ultimoHistorico?.pacienteId ? {
                // Aqui você pode buscar dados do paciente se necessário
                // Por enquanto deixo undefined, mas pode ser implementado depois
              } : undefined
            };
          });

          return {
            ...setor,
            leitos: leitosComStatus
          };
        });

        setSetores(setoresComLeitos);
        setLoading(false);
      }
    };

    const unsubscribeSetores = onSnapshot(setoresQuery, (snapshot) => {
      setoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Setor[];
      checkAndCombineData();
    }, (error) => {
      console.error('Erro ao buscar setores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar setores do sistema.",
        variant: "destructive",
      });
      setLoading(false);
    });

    const unsubscribeLeitos = onSnapshot(leitosQuery, (snapshot) => {
      leitosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Leito[];
      checkAndCombineData();
    }, (error) => {
      console.error('Erro ao buscar leitos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar leitos do sistema.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => {
      unsubscribeSetores();
      unsubscribeLeitos();
    };
  }, []);

  const criarSetor = async (data: SetorFormData) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'setoresRegulaFacil'), data);
      registrarLog(`Criou o setor "${data.nomeSetor}" (${data.siglaSetor}).`, 'Gestão de Setores');
      toast({
        title: "Sucesso",
        description: "Setor criado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao criar setor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o setor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarSetor = async (setorId: string, data: Partial<SetorFormData>) => {
    setLoading(true);
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, data);
      registrarLog(`Atualizou o setor "${data.nomeSetor}" (${data.siglaSetor}).`, 'Gestão de Setores');
      toast({
        title: "Sucesso",
        description: "Setor atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar setor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o setor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const excluirSetor = async (setorId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await deleteDoc(setorRef);

      if (setor) {
        registrarLog(`Excluiu o setor "${setor.nomeSetor}".`, 'Gestão de Setores');
      }
      toast({
        title: "Sucesso",
        description: "Setor excluído com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o setor. Verifique se não há leitos associados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    setores,
    loading,
    criarSetor,
    atualizarSetor,
    excluirSetor,
  };
};
