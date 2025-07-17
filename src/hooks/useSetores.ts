// src/hooks/useSetores.ts

import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Setor, SetorFormData } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';
import { useAuditoria } from './useAuditoria';

export const useSetores = () => {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const { registrarLog } = useAuditoria();

  useEffect(() => {
    const q = query(collection(db, 'setoresRegulaFacil'), orderBy('nomeSetor'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const setoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Setor[];
      setSetores(setoresData);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao buscar setores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar setores do sistema.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const criarSetor = async (data: SetorFormData) => {
    setLoading(true);
    try {
      // CORREÇÃO: Passa apenas os dados do formulário, sem o array 'leitos'.
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
      // Aqui, futuramente, você pode adicionar uma lógica para verificar
      // se existem leitos associados a este setor antes de permitir a exclusão.
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