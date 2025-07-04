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
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      // 1. Criar um Set com todos os códigos de leitos existentes para checagem rápida
      const todosCodigosLeitos = new Set(
        setores.flatMap(s => s.leitos.map(l => l.codigoLeito.trim().toLowerCase()))
      );

      // 2. Processar códigos de leitos do formulário
      const codigosParaAdicionar = leitoData.codigoLeito
        .split(',')
        .map(code => code.trim())
        .filter(Boolean); // Remove strings vazias

      const novosLeitos: Leito[] = [];
      const leitosDuplicados: string[] = [];
      const leitosAdicionados: string[] = [];

      codigosParaAdicionar.forEach(codigo => {
        if (todosCodigosLeitos.has(codigo.toLowerCase())) {
          leitosDuplicados.push(codigo);
        } else {
          const novoLeito: Leito = {
            id: crypto.randomUUID(),
            codigoLeito: codigo,
            leitoPCP: leitoData.leitoPCP,
            leitoIsolamento: leitoData.leitoIsolamento,
            statusLeito: 'Vago',
            dataAtualizacaoStatus: new Date().toISOString(),
          };
          novosLeitos.push(novoLeito);
          leitosAdicionados.push(codigo);
          todosCodigosLeitos.add(codigo.toLowerCase()); // Adiciona ao set para evitar duplicatas na mesma chamada
        }
      });

      // 3. Atualizar o Firestore se houver novos leitos válidos
      if (novosLeitos.length > 0) {
        const leitosAtualizados = [...setor.leitos, ...novosLeitos];
        const setorRef = doc(db, 'setoresRegulaFacil', setorId);
        await updateDoc(setorRef, { leitos: leitosAtualizados } as any);
        toast({
          title: 'Sucesso!',
          description: `${leitosAdicionados.length} leito(s) adicionado(s): ${leitosAdicionados.join(', ')}.`,
        });
      }

      // 4. Informar o usuário sobre leitos duplicados
      if (leitosDuplicados.length > 0) {
        toast({
          title: 'Aviso de Leitos Duplicados',
          description: `Os seguintes leitos já existem e não foram adicionados: ${leitosDuplicados.join(', ')}.`,
          variant: 'destructive',
        });
      }

      if (novosLeitos.length === 0 && leitosDuplicados.length === 0) {
          toast({
              title: 'Nenhum leito adicionado',
              description: 'Verifique se o campo de código do leito foi preenchido.',
              variant: 'destructive',
            });
      }

    } catch (error) {
      console.error('Erro ao adicionar leito(s):', error);
      toast({
        title: 'Erro Inesperado',
        description: 'Não foi possível adicionar o(s) leito(s).',
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

  const desbloquearLeito = async (setorId: string, leitoId: string) => {
    try {
      setLoading(true);
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => {
        if (l.id === leitoId) {
          const { motivoBloqueio, ...leitoRestante } = l; // Remove o motivo do bloqueio
          return {
            ...leitoRestante,
            statusLeito: 'Vago',
            dataAtualizacaoStatus: new Date().toISOString()
          };
        }
        return l;
      });

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados } as any);

      toast({
        title: 'Sucesso',
        description: 'Leito desbloqueado com sucesso!',
      });

    } catch (error) {
      console.error('Falha ao desbloquear o leito no Firestore:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível desbloquear o leito.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const finalizarHigienizacao = async (setorId: string, leitoId: string) => {
    try {
      setLoading(true);
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => {
        if (l.id === leitoId) {
          return {
            ...l,
            statusLeito: 'Vago',
            dataAtualizacaoStatus: new Date().toISOString()
          };
        }
        return l;
      });

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados } as any);

      toast({
        title: 'Sucesso',
        description: 'Higienização finalizada com sucesso!',
      });

    } catch (error) {
      console.error('Falha ao finalizar a higienização no Firestore:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível finalizar a higienização.',
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
    desbloquearLeito,
    finalizarHigienizacao,
  };
};
