
import { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TipoIsolamento, TipoIsolamentoFormData } from '@/types/isolamento';
import { toast } from '@/hooks/use-toast';
import { useAuditoria } from './useAuditoria';

export const useIsolamentos = () => {
  const [isolamentos, setIsolamentos] = useState<TipoIsolamento[]>([]);
  const [loading, setLoading] = useState(false);
  const { registrarLog } = useAuditoria();

  useEffect(() => {
    const q = query(collection(db, 'isolamentosRegulaFacil'), orderBy('nomeMicroorganismo'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const isolamentosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TipoIsolamento[];
      
      setIsolamentos(isolamentosData);
      console.log('Isolamentos atualizados:', isolamentosData);
    }, (error) => {
      console.error('Erro ao buscar isolamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de isolamento",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, []);

  const criarIsolamento = async (data: TipoIsolamentoFormData) => {
    try {
      setLoading(true);
      
      const docRef = await addDoc(collection(db, 'isolamentosRegulaFacil'), {
        ...data,
        dataAtualizacao: new Date().toISOString()
      });
      
      console.log('Isolamento criado com ID:', docRef.id);
      
      toast({
        title: "Sucesso",
        description: "Tipo de isolamento criado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao criar isolamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar tipo de isolamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarIsolamento = async (id: string, data: TipoIsolamentoFormData) => {
    try {
      setLoading(true);
      
      const docRef = doc(db, 'isolamentosRegulaFacil', id);
      await updateDoc(docRef, {
        ...data,
        dataAtualizacao: new Date().toISOString()
      });
      
      console.log('Isolamento atualizado:', id);
      
      toast({
        title: "Sucesso",
        description: "Tipo de isolamento atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao atualizar isolamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tipo de isolamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const excluirIsolamento = async (id: string) => {
    try {
      setLoading(true);
      
      const docRef = doc(db, 'isolamentosRegulaFacil', id);
      await deleteDoc(docRef);
      
      console.log('Isolamento excluído:', id);
      
      toast({
        title: "Sucesso",
        description: "Tipo de isolamento excluído com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao excluir isolamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir tipo de isolamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    isolamentos,
    loading,
    criarIsolamento,
    atualizarIsolamento,
    excluirIsolamento
  };
};
