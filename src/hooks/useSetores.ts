
import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  onSnapshot,
  writeBatch
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
            dadosPaciente: null,
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
        ...(status === 'Bloqueado' && motivo ? { motivoBloqueio: motivo } : {}),
        ...(status === 'Vago' ? { dadosPaciente: null } : {})
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
            dataAtualizacaoStatus: new Date().toISOString(),
            dadosPaciente: null
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
            dataAtualizacaoStatus: new Date().toISOString(),
            dadosPaciente: null
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

  // Função helper para encontrar e atualizar um leito específico
  const updateLeitoInSetor = async (setorId: string, leitoId: string, updates: Partial<Leito>) => {
    const setorRef = doc(db, 'setoresRegulaFacil', setorId);
    const setor = setores.find(s => s.id === setorId);
    if (!setor) throw new Error("Setor não encontrado");
    
    const leitosAtualizados = setor.leitos.map(l => l.id === leitoId ? { ...l, ...updates } : l);
    await updateDoc(setorRef, { leitos: leitosAtualizados });
  };

  const liberarLeito = async (setorId: string, leitoId: string) => {
    try {
      await updateLeitoInSetor(setorId, leitoId, {
        statusLeito: 'Higienizacao',
        dataAtualizacaoStatus: new Date().toISOString(),
        dadosPaciente: null
      });
      toast({ title: "Leito Liberado", description: "O leito foi enviado para higienização." });
    } catch (error) {
      console.error('Erro ao liberar leito:', error);
      toast({ title: "Erro", description: "Não foi possível liberar o leito.", variant: "destructive" });
    }
  };

  const solicitarUTI = async (setorId: string, leitoId: string) => {
    try {
      const leito = setores.flatMap(s => s.leitos).find(l => l.id === leitoId);
      if (!leito?.dadosPaciente) return;
      
      await updateLeitoInSetor(setorId, leitoId, {
        dadosPaciente: { 
          ...leito.dadosPaciente, 
          aguardaUTI: true, 
          dataPedidoUTI: new Date().toISOString() 
        }
      });
      toast({ title: "Solicitação de UTI Registrada", description: "A solicitação foi enviada para a equipe de UTI." });
    } catch (error) {
      console.error('Erro ao solicitar UTI:', error);
      toast({ title: "Erro", description: "Não foi possível registrar a solicitação de UTI.", variant: "destructive" });
    }
  };

  const solicitarRemanejamento = async (setorId: string, leitoId: string, motivo: string) => {
    try {
      const leito = setores.flatMap(s => s.leitos).find(l => l.id === leitoId);
      if (!leito?.dadosPaciente) return;
      
      await updateLeitoInSetor(setorId, leitoId, {
        dadosPaciente: { 
          ...leito.dadosPaciente, 
          remanejarPaciente: true, 
          motivoRemanejamento: motivo, 
          dataPedidoRemanejamento: new Date().toISOString() 
        }
      });
      toast({ title: "Solicitação de Remanejamento Registrada", description: "A solicitação foi enviada para análise." });
    } catch (error) {
      console.error('Erro ao solicitar remanejamento:', error);
      toast({ title: "Erro", description: "Não foi possível registrar a solicitação de remanejamento.", variant: "destructive" });
    }
  };

  const transferirPaciente = async (setorId: string, leitoId: string, destino: string, motivo: string) => {
    try {
      const leito = setores.flatMap(s => s.leitos).find(l => l.id === leitoId);
      if (!leito?.dadosPaciente) return;
      
      await updateLeitoInSetor(setorId, leitoId, {
        dadosPaciente: { 
          ...leito.dadosPaciente, 
          transferirPaciente: true, 
          destinoTransferencia: destino, 
          motivoTransferencia: motivo, 
          dataTransferencia: new Date().toISOString(), 
          statusTransferencia: 'Organizar' 
        }
      });
      toast({ title: "Solicitação de Transferência Registrada", description: "A solicitação foi enviada para organização." });
    } catch (error) {
      console.error('Erro ao solicitar transferência:', error);
      toast({ title: "Erro", description: "Não foi possível registrar a solicitação de transferência.", variant: "destructive" });
    }
  };

  const cancelarPedidoUTI = async (setorId: string, leitoId: string) => {
    try {
      const leito = setores.flatMap(s => s.leitos).find(l => l.id === leitoId);
      if (!leito?.dadosPaciente) return;
      
      const { aguardaUTI, dataPedidoUTI, ...restoDados } = leito.dadosPaciente;

      await updateLeitoInSetor(setorId, leitoId, { dadosPaciente: restoDados });
      toast({ title: "Solicitação de UTI Cancelada", description: "A solicitação foi removida da fila." });
    } catch (error) {
      console.error('Erro ao cancelar pedido UTI:', error);
      toast({ title: "Erro", description: "Não foi possível cancelar a solicitação de UTI.", variant: "destructive" });
    }
  };

  const cancelarTransferencia = async (setorId: string, leitoId: string) => {
    try {
      const leito = setores.flatMap(s => s.leitos).find(l => l.id === leitoId);
      if (!leito?.dadosPaciente) return;

      const { 
        transferirPaciente, destinoTransferencia, motivoTransferencia, 
        dataTransferencia, statusTransferencia, ...restoDados 
      } = leito.dadosPaciente;

      await updateLeitoInSetor(setorId, leitoId, { dadosPaciente: restoDados });
      toast({ title: "Transferência Externa Cancelada", description: "A solicitação foi removida da fila." });
    } catch (error) {
      console.error('Erro ao cancelar transferência:', error);
      toast({ title: "Erro", description: "Não foi possível cancelar a transferência.", variant: "destructive" });
    }
  };

  const altaAposRecuperacao = async (setorId: string, leitoId: string) => {
    try {
      await updateLeitoInSetor(setorId, leitoId, {
        statusLeito: 'Vago',
        dataAtualizacaoStatus: new Date().toISOString(),
        dadosPaciente: null
      });
      toast({ title: "Alta Realizada", description: "O leito foi liberado." });
    } catch (error) {
      console.error('Erro ao dar alta:', error);
      toast({ title: "Erro", description: "Não foi possível realizar a alta.", variant: "destructive" });
    }
  };

  const adicionarIsolamentoPaciente = async (setorId: string, leitoId: string, novoIsolamento: any) => {
    try {
      const leito = setores.flatMap(s => s.leitos).find(l => l.id === leitoId);
      if (!leito?.dadosPaciente) return;

      const isolamentosAtuais = leito.dadosPaciente.isolamentosVigentes || [];
      const dadosPacienteAtualizado = {
        ...leito.dadosPaciente,
        isolamentosVigentes: [...isolamentosAtuais, novoIsolamento]
      };

      await updateLeitoInSetor(setorId, leitoId, { dadosPaciente: dadosPacienteAtualizado });
      toast({ title: "Vigilância Iniciada", description: `Isolamento ${novoIsolamento.sigla} adicionado ao paciente.` });
    } catch (error) {
      console.error('Erro ao adicionar isolamento:', error);
      toast({ title: "Erro", description: "Não foi possível adicionar o isolamento.", variant: "destructive" });
    }
  };

  const atualizarRegrasIsolamento = async (setorId: string, leitoId: string, isolamentoVigenteId: string, regrasCumpridas: string[]) => {
    try {
      const leito = setores.flatMap(s => s.leitos).find(l => l.id === leitoId);
      if (!leito?.dadosPaciente?.isolamentosVigentes) return;

      const isolamentosAtualizados = leito.dadosPaciente.isolamentosVigentes.map(iso => 
        iso.isolamentoId === isolamentoVigenteId ? { ...iso, regrasCumpridas } : iso
      );
      
      const dadosPacienteAtualizado = { ...leito.dadosPaciente, isolamentosVigentes: isolamentosAtualizados };
      await updateLeitoInSetor(setorId, leitoId, { dadosPaciente: dadosPacienteAtualizado });
      
      toast({ title: "Regras Atualizadas", description: "Status das regras de isolamento atualizado." });
    } catch (error) {
      console.error('Erro ao atualizar regras:', error);
      toast({ title: "Erro", description: "Não foi possível atualizar as regras.", variant: "destructive" });
    }
  };

  const confirmarRegulacao = async (paciente: any, leitoOrigem: any, leitoDestino: any, observacoes: string) => {
    try {
      setLoading(true);
      const agora = new Date().toISOString();
      const batch = writeBatch(db);

      const setorOrigemRef = doc(db, 'setoresRegulaFacil', leitoOrigem.setorId);
      const setorDestinoRef = doc(db, 'setoresRegulaFacil', leitoDestino.setorId);

      // Garante que a cópia dos dados do paciente seja segura
      const dadosPacienteParaDestino = { ...(paciente || {}) };
      delete dadosPacienteParaDestino.regulacao; // Remove o campo de regulação antigo se existir

      // Atualiza o leito de ORIGEM
      const setorOrigemData = setores.find(s => s.id === leitoOrigem.setorId)!;
      const leitosOrigemAtualizado = setorOrigemData.leitos.map(l => {
          if (l.id === leitoOrigem.leitoId) {
              return {
                  ...l,
                  statusLeito: 'Regulado' as const,
                  dataAtualizacaoStatus: agora,
                  regulacao: {
                      paraSetor: leitoDestino.setorNome || '',
                      paraLeito: leitoDestino.codigoLeito || '',
                      data: agora,
                      observacoes: observacoes || '' // Garante que não seja undefined
                  }
              };
          }
          return l;
      });
      batch.update(setorOrigemRef, { leitos: leitosOrigemAtualizado });

      // Atualiza o leito de DESTINO
      const setorDestinoData = setores.find(s => s.id === leitoDestino.setorId)!;
      const leitosDestinoAtualizado = setorDestinoData.leitos.map(l => {
          if (l.id === leitoDestino.id) {
              return {
                  ...l,
                  statusLeito: 'Reservado' as const,
                  dataAtualizacaoStatus: agora,
                  dadosPaciente: {
                      ...dadosPacienteParaDestino,
                      origem: {
                          deSetor: leitoOrigem.setorOrigem || '',
                          deLeito: leitoOrigem.leitoCodigo || ''
                      }
                  }
              };
          }
          return l;
      });
      
      // Trata o caso de origem e destino serem no mesmo setor
      if (setorOrigemRef.path === setorDestinoRef.path) {
          const leitosCombinados = leitosOrigemAtualizado.map(l => 
              l.id === leitoDestino.id ? leitosDestinoAtualizado.find(ld => ld.id === l.id) || l : l
          );
          batch.update(setorOrigemRef, { leitos: leitosCombinados });
      } else {
          batch.update(setorDestinoRef, { leitos: leitosDestinoAtualizado });
      }

      await batch.commit();
      
      toast({
        title: 'Regulação Confirmada',
        description: `Leito ${leitoDestino.codigoLeito} regulado com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao confirmar regulação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível confirmar a regulação.',
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
    liberarLeito,
    solicitarUTI,
    solicitarRemanejamento,
    transferirPaciente,
    cancelarPedidoUTI,
    cancelarTransferencia,
    altaAposRecuperacao,
    adicionarIsolamentoPaciente,
    atualizarRegrasIsolamento,
    confirmarRegulacao,
  };
};
