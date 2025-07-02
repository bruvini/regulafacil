
import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Setor, SetorFormData, LeitoFormData, Leito, HistoricoStatus } from '@/types/hospital';
import { useToast } from '@/hooks/use-toast';

export const useSetores = () => {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const carregarSetores = async () => {
    try {
      console.log('Carregando setores...');
      const q = query(collection(db, 'setoresRegulaFacil'), orderBy('nomeSetor'));
      const querySnapshot = await getDocs(q);
      
      const setoresData: Setor[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        setoresData.push({
          id: doc.id,
          nomeSetor: data.nomeSetor,
          siglaSetor: data.siglaSetor,
          leitos: data.leitos || []
        });
      });
      
      console.log('Setores carregados:', setoresData);
      setSetores(setoresData);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar setores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const criarSetor = async (data: SetorFormData) => {
    try {
      const novoSetor: Setor = {
        nomeSetor: data.nomeSetor,
        siglaSetor: data.siglaSetor,
        leitos: []
      };

      const docRef = doc(collection(db, 'setoresRegulaFacil'));
      await setDoc(docRef, novoSetor);
      
      toast({
        title: 'Sucesso',
        description: `Setor ${data.nomeSetor} criado com sucesso!`,
      });
      
      await carregarSetores();
    } catch (error) {
      console.error('Erro ao criar setor:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar setor',
        variant: 'destructive',
      });
    }
  };

  const editarSetor = async (setorId: string, data: SetorFormData) => {
    try {
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, {
        nomeSetor: data.nomeSetor,
        siglaSetor: data.siglaSetor
      });
      
      toast({
        title: 'Sucesso',
        description: `Setor ${data.nomeSetor} atualizado com sucesso!`,
      });
      
      await carregarSetores();
    } catch (error) {
      console.error('Erro ao editar setor:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao editar setor',
        variant: 'destructive',
      });
    }
  };

  const excluirSetor = async (setorId: string) => {
    try {
      await deleteDoc(doc(db, 'setoresRegulaFacil', setorId));
      
      toast({
        title: 'Sucesso',
        description: 'Setor excluído com sucesso!',
      });
      
      await carregarSetores();
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir setor',
        variant: 'destructive',
      });
    }
  };

  const adicionarLeito = async (setorId: string, data: LeitoFormData) => {
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) {
        throw new Error('Setor não encontrado');
      }

      const novoLeito: Leito = {
        id: crypto.randomUUID(),
        codigoLeito: data.codigoLeito,
        leitoPCP: data.leitoPCP,
        leitoIsolamento: data.leitoIsolamento,
        dataAtualizacaoStatus: new Date().toISOString(),
        pacienteId: null,
        historicoStatus: [{
          status: 'Vago',
          timestamp: new Date().toISOString(),
          pacienteId: null,
        }]
      };

      const leitosAtualizados = [...setor.leitos, novoLeito];
      
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });
      
      toast({
        title: 'Sucesso',
        description: `Leito ${data.codigoLeito} adicionado com sucesso!`,
      });
      
      await carregarSetores();
    } catch (error) {
      console.error('Erro ao adicionar leito:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar leito',
        variant: 'destructive',
      });
    }
  };

  const editarLeito = async (setorId: string, leitoId: string, data: LeitoFormData) => {
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) {
        throw new Error('Setor não encontrado');
      }

      const leitosAtualizados = setor.leitos.map(leito => 
        leito.id === leitoId 
          ? { 
              ...leito, 
              codigoLeito: data.codigoLeito,
              leitoPCP: data.leitoPCP,
              leitoIsolamento: data.leitoIsolamento,
              dataAtualizacaoStatus: new Date().toISOString()
            }
          : leito
      );
      
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });
      
      toast({
        title: 'Sucesso',
        description: `Leito ${data.codigoLeito} atualizado com sucesso!`,
      });
      
      await carregarSetores();
    } catch (error) {
      console.error('Erro ao editar leito:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao editar leito',
        variant: 'destructive',
      });
    }
  };

  const excluirLeito = async (setorId: string, leitoId: string) => {
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) {
        throw new Error('Setor não encontrado');
      }

      const leitosAtualizados = setor.leitos.filter(leito => leito.id !== leitoId);
      
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });
      
      toast({
        title: 'Sucesso',
        description: 'Leito excluído com sucesso!',
      });
      
      await carregarSetores();
    } catch (error) {
      console.error('Erro ao excluir leito:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir leito',
        variant: 'destructive',
      });
    }
  };

  const adicionarLeitosEmMassa = async (setorId: string, leitosParaAdicionar: LeitoFormData[]) => {
    try {
      const setor = setores.find(s => s.id === setorId);
      if (!setor) {
        throw new Error('Setor não encontrado');
      }

      const novosLeitos: Leito[] = leitosParaAdicionar.map(data => ({
        id: crypto.randomUUID(),
        codigoLeito: data.codigoLeito,
        leitoPCP: data.leitoPCP,
        leitoIsolamento: data.leitoIsolamento,
        dataAtualizacaoStatus: new Date().toISOString(),
        pacienteId: null,
        historicoStatus: [{
          status: 'Vago',
          timestamp: new Date().toISOString(),
          pacienteId: null,
        }]
      }));

      const leitosAtualizados = [...setor.leitos, ...novosLeitos];
      
      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });
      
      toast({
        title: 'Sucesso',
        description: `${leitosParaAdicionar.length} leitos adicionados com sucesso!`,
      });
      
      await carregarSetores();
    } catch (error) {
      console.error('Erro ao adicionar leitos em massa:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar leitos em massa',
        variant: 'destructive',
      });
    }
  };

  const atualizarStatusLeito = async (setorId: string, leitoId: string, novoStatus: 'Vago' | 'Ocupado' | 'Bloqueado' | 'Higienizacao', motivo?: string) => {
    try {
      console.log('Atualizando status do leito:', { setorId, leitoId, novoStatus, motivo });
      
      const setor = setores.find(s => s.id === setorId);
      if (!setor) {
        console.error('Setor não encontrado:', setorId);
        throw new Error('Setor não encontrado');
      }

      const leitoIndex = setor.leitos.findIndex(l => l.id === leitoId);
      if (leitoIndex === -1) {
        console.error('Leito não encontrado:', leitoId);
        throw new Error('Leito não encontrado');
      }

      const leitosAtualizados = [...setor.leitos];
      const leitoAtualizado = { ...leitosAtualizados[leitoIndex] };

      // Criar novo item para o histórico
      const novoHistorico: HistoricoStatus = {
        status: novoStatus,
        timestamp: new Date().toISOString(),
        pacienteId: leitoAtualizado.pacienteId,
        motivo: motivo
      };

      // Atualizar o histórico
      leitoAtualizado.historicoStatus = [
        ...(leitoAtualizado.historicoStatus || []),
        novoHistorico
      ];

      // Atualizar campos específicos baseados no status
      if (novoStatus === 'Bloqueado') {
        leitoAtualizado.motivoBloqueio = motivo;
      } else if (novoStatus === 'Vago') {
        leitoAtualizado.pacienteId = null;
        leitoAtualizado.motivoBloqueio = undefined;
      }

      leitoAtualizado.dataAtualizacaoStatus = new Date().toISOString();
      leitosAtualizados[leitoIndex] = leitoAtualizado;

      console.log('Leito atualizado:', leitoAtualizado);

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados });
      
      toast({
        title: 'Sucesso',
        description: `Status do leito atualizado para ${novoStatus}!`,
      });
      
      await carregarSetores();
    } catch (error) {
      console.error('Erro ao atualizar status do leito:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status do leito',
        variant: 'destructive',
      });
    }
  };

  const desbloquearLeito = async (setorId: string, leitoId: string) => {
    await atualizarStatusLeito(setorId, leitoId, 'Vago');
  };

  const finalizarHigienizacao = async (setorId: string, leitoId: string) => {
    await atualizarStatusLeito(setorId, leitoId, 'Vago');
  };

  useEffect(() => {
    carregarSetores();
  }, []);

  return {
    setores,
    loading,
    criarSetor,
    editarSetor,
    excluirSetor,
    adicionarLeito,
    editarLeito,
    excluirLeito,
    adicionarLeitosEmMassa,
    atualizarStatusLeito,
    desbloquearLeito,
    finalizarHigienizacao,
    carregarSetores
  };
};
