import { useState } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TipoIsolamentoFormData, PacienteIsolamento } from '@/types/isolamento';
import { Paciente } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';
import { useAuditoria } from './useAuditoria';
import { useCache } from '@/contexts/CacheContext'; // Importe o useCache

export const useIsolamentos = () => {
  // 1. DADOS VÊM DO CACHE, NÃO MAIS DO FIRESTORE DIRETAMENTE
  const { tiposDeIsolamento, loading: loadingCache } = useCache();
  const [loadingMutation, setLoadingMutation] = useState(false);
  const { registrarLog } = useAuditoria();

  // 2. RESTAURE TODAS AS FUNÇÕES DE ESCRITA (CRIAR, ATUALIZAR, EXCLUIR)
  const criarIsolamento = async (data: TipoIsolamentoFormData) => {
    setLoadingMutation(true);
    try {
      await addDoc(collection(db, 'isolamentosRegulaFacil'), data);
      toast({ title: "Sucesso", description: "Tipo de isolamento criado!" });
      registrarLog('Criação de Tipo de Isolamento', `Criado: ${data.nomeMicroorganismo}`);
    } catch (error) {
      console.error('Erro ao criar isolamento:', error);
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setLoadingMutation(false);
    }
  };

  const atualizarIsolamento = async (id: string, data: TipoIsolamentoFormData) => {
    setLoadingMutation(true);
    try {
      await updateDoc(doc(db, 'isolamentosRegulaFacil', id), data as any);
      toast({ title: "Sucesso", description: "Tipo de isolamento atualizado!" });
      registrarLog('Atualização de Tipo de Isolamento', `Atualizado: ${data.nomeMicroorganismo}`);
    } catch (error) {
      console.error('Erro ao atualizar isolamento:', error);
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setLoadingMutation(false);
    }
  };

  const excluirIsolamento = async (id: string) => {
    setLoadingMutation(true);
    try {
      await deleteDoc(doc(db, 'isolamentosRegulaFacil', id));
      toast({ title: "Sucesso", description: "Tipo de isolamento excluído!" });
      registrarLog('Exclusão de Tipo de Isolamento', `Excluído ID: ${id}`);
    } catch (error) {
      console.error('Erro ao excluir isolamento:', error);
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setLoadingMutation(false);
    }
  };

  const adicionarIsolamentoPaciente = async (
    paciente: Paciente,
    isolamento: PacienteIsolamento
  ) => {
    try {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', paciente.id);
      await updateDoc(pacienteRef, {
        isolamentosVigentes: arrayUnion(isolamento)
      });

      registrarLog(
        `Isolamento '${isolamento.sigla}' adicionado ao paciente ${paciente.nomeCompleto}.`,
        'Gestão de Isolamentos'
      );
    } catch (error) {
      console.error('Erro ao adicionar isolamento ao paciente:', error);
      toast({ title: 'Erro', variant: 'destructive' });
    }
  };

  return {
    isolamentos: tiposDeIsolamento, // Dados do cache
    loading: loadingCache || loadingMutation, // Combina os loadings
    criarIsolamento,
    atualizarIsolamento,
    excluirIsolamento,
    adicionarIsolamentoPaciente,
  };
};

