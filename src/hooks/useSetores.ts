
import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Setor } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';

export const useSetores = () => {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'setoresRegulaFacil'), (snapshot) => {
      const setoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Setor[];
      
      setSetores(setoresData);
      console.log('Setores atualizados:', setoresData);
    }, (error) => {
      console.error('Erro ao buscar setores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar setores",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, []);

  const atualizarRegrasIsolamento = async (setorId: string, leitoId: string, isolamentoId: string, regrasCumpridas: string[]) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => {
        if (l.id === leitoId && l.dadosPaciente?.isolamentosVigentes) {
          const isolamentosAtualizados = l.dadosPaciente.isolamentosVigentes.map(iso => 
            iso.isolamentoId === isolamentoId 
              ? { ...iso, regrasCumpridas }
              : iso
          );
          return { 
            ...l, 
            dadosPaciente: { 
              ...l.dadosPaciente, 
              isolamentosVigentes: isolamentosAtualizados 
            } 
          };
        }
        return l;
      });

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      console.log('Regras de isolamento atualizadas');
    } catch (error) {
      console.error('Erro ao atualizar regras de isolamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar regras de isolamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const finalizarIsolamentoPaciente = async (setorId: string, leitoId: string, isolamentoId: string) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => {
        if (l.id === leitoId && l.dadosPaciente?.isolamentosVigentes) {
          const isolamentosAtualizados = l.dadosPaciente.isolamentosVigentes.filter(iso => 
            iso.isolamentoId !== isolamentoId
          );
          return { 
            ...l, 
            dadosPaciente: { 
              ...l.dadosPaciente, 
              isolamentosVigentes: isolamentosAtualizados 
            } 
          };
        }
        return l;
      });

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      toast({
        title: "Isolamento Finalizado",
        description: "O isolamento foi finalizado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao finalizar isolamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar isolamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarIsolamentoPaciente = async (setorId: string, leitoId: string, novoIsolamento: any) => {
    setLoading(true);
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => {
        if (l.id === leitoId && l.dadosPaciente) {
          const isolamentosAtuais = l.dadosPaciente.isolamentosVigentes || [];
          const dadosPacienteAtualizado = {
            ...l.dadosPaciente,
            isolamentosVigentes: [...isolamentosAtuais, novoIsolamento]
          };
          return { ...l, dadosPaciente: dadosPacienteAtualizado };
        }
        return l;
      });

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });

      toast({ 
        title: "Vigilância Iniciada", 
        description: `Isolamento ${novoIsolamento.sigla} adicionado ao paciente.` 
      });
    } catch (error) {
      console.error('Erro ao adicionar isolamento:', error);
      toast({ 
        title: "Erro", 
        description: "Não foi possível adicionar o isolamento.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    setores,
    loading,
    atualizarRegrasIsolamento,
    finalizarIsolamentoPaciente,
    adicionarIsolamentoPaciente
  };
};
