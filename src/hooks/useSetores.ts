
import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Setor, SetorFormData, LeitoFormData, Leito } from '@/types/hospital';
import { useToast } from '@/hooks/use-toast';

export const useSetores = () => {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'setoresRegulaFacil'),
      (snapshot) => {
        const setoresData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Setor[];
        setSetores(setoresData);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar setores:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os setores.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const criarSetor = async (setorData: SetorFormData) => {
    try {
      setLoading(true);
      const novoSetor: Omit<Setor, 'id'> = {
        ...setorData,
        leitos: []
      };
      
      await addDoc(collection(db, 'setoresRegulaFacil'), novoSetor);
      
      toast({
        title: 'Sucesso',
        description: 'Setor criado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao criar setor:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o setor.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarSetor = async (id: string, setorData: SetorFormData) => {
    try {
      setLoading(true);
      const setorRef = doc(db, 'setoresRegulaFacil', id);
      await updateDoc(setorRef, setorData as any);
      
      toast({
        title: 'Sucesso',
        description: 'Setor atualizado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao atualizar setor:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o setor.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const excluirSetor = async (id: string) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'setoresRegulaFacil', id));
      
      toast({
        title: 'Sucesso',
        description: 'Setor excluído com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o setor.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarLeito = async (setorId: string, leitoData: LeitoFormData) => {
    try {
      setLoading(true);
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const novoLeito: Leito = {
        id: crypto.randomUUID(),
        ...leitoData,
        statusLeito: 'Vago',
        dataAtualizacaoStatus: new Date().toISOString()
      };

      const leitosAtualizados = [...setor.leitos, novoLeito];
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      
      await updateDoc(setorRef, { leitos: leitosAtualizados } as any);
      
      toast({
        title: 'Sucesso',
        description: 'Leito adicionado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao adicionar leito:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o leito.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarLeito = async (setorId: string, leitoIndex: number, leitoData: LeitoFormData) => {
    try {
      setLoading(true);
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = [...setor.leitos];
      leitosAtualizados[leitoIndex] = {
        ...leitosAtualizados[leitoIndex],
        ...leitoData
      };

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados } as any);
      
      toast({
        title: 'Sucesso',
        description: 'Leito atualizado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao atualizar leito:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o leito.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const excluirLeito = async (setorId: string, leitoIndex: number) => {
    try {
      setLoading(true);
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.filter((_, index) => index !== leitoIndex);
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      
      await updateDoc(setorRef, { leitos: leitosAtualizados } as any);
      
      toast({
        title: 'Sucesso',
        description: 'Leito excluído com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao excluir leito:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o leito.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatusLeito = async (setorId: string, leitoId: string, status: 'Vago' | 'Ocupado' | 'Bloqueado' | 'Higienizacao', motivo?: string) => {
    try {
      console.log('Hook useSetores recebeu chamada para atualizar status:', { setorId, leitoId, novoStatus: status });
      setLoading(true);
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitoIndex = setor.leitos.findIndex(l => l.id === leitoId);
      if (leitoIndex === -1) throw new Error('Leito não encontrado');

      const leitosAtualizados = [...setor.leitos];
      leitosAtualizados[leitoIndex] = {
        ...leitosAtualizados[leitoIndex],
        statusLeito: status,
        dataAtualizacaoStatus: new Date().toISOString(),
        ...(status === 'Bloqueado' && motivo ? { motivoBloqueio: motivo } : {})
      };

      console.log('Enviando para o Firestore:', leitosAtualizados);
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados } as any);
      
      toast({
        title: 'Sucesso',
        description: `Status do leito atualizado para ${status}!`,
      });
    } catch (error) {
      console.error('FALHA AO ATUALIZAR NO FIRESTORE:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do leito.',
        variant: 'destructive',
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
    adicionarLeito,
    atualizarLeito,
    excluirLeito,
    atualizarStatusLeito,
  };
};
