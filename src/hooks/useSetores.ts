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

  const cancelarReserva = async (setorId: string, leitoId: string) => {
    try {
      setLoading(true);
      const setor = setores.find(s => s.id === setorId);
      if (!setor) throw new Error('Setor não encontrado');

      const leitosAtualizados = setor.leitos.map(l => {
        if (l.id === leitoId && l.statusLeito === 'Reservado') {
          // Remove os dados do paciente e da regulação, e atualiza o status
          const { dadosPaciente, regulacao, ...leitoRestante } = l;
          return {
            ...leitoRestante,
            statusLeito: 'Vago' as const,
            dataAtualizacaoStatus: new Date().toISOString(),
            dadosPaciente: null,
            regulacao: null
          };
        }
        return l;
      });

      const setorRef = doc(db, 'setoresRegulaFacil', setorId);
      await updateDoc(setorRef, { leitos: leitosAtualizados } as any);

      toast({
        title: 'Sucesso',
        description: 'Reserva do leito foi cancelada.',
      });
    } catch (error) {
      console.error('Falha ao cancelar reserva do leito:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a reserva.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarIsolamentoPaciente = async (setorId: string, leitoId: string, novosIsolamentos: any[]) => {
    try {
      const leito = setores.flatMap(s => s.leitos).find(l => l.id === leitoId);
      if (!leito?.dadosPaciente) return;

      // Obter array atual de isolamentos
      const isolamentosAtuais = leito.dadosPaciente.isolamentosVigentes || [];
      
      // Concatenar os novos isolamentos com os existentes
      const isolamentosAtualizados = [...isolamentosAtuais, ...novosIsolamentos];
      
      const dadosPacienteAtualizado = {
        ...leito.dadosPaciente,
        isolamentosVigentes: isolamentosAtualizados
      };

      // Uma única chamada para atualizar
      await updateLeitoInSetor(setorId, leitoId, { dadosPaciente: dadosPacienteAtualizado });
      
      const siglas = novosIsolamentos.map(iso => iso.sigla).join(', ');
      toast({ 
        title: "Vigilância Iniciada", 
        description: `Isolamento(s) ${siglas} adicionado(s) ao paciente.` 
      });
    } catch (error) {
      console.error('Erro ao adicionar isolamentos:', error);
      toast({ title: "Erro", description: "Não foi possível adicionar os isolamentos.", variant: "destructive" });
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

  const concluirRegulacao = async (pacienteRegulado: any) => {
    try {
      setLoading(true);
      const batch = writeBatch(db);
      const agora = new Date().toISOString();

      // 1. Acha o leito de origem (que está "Regulado")
      const setorOrigemRef = doc(db, 'setoresRegulaFacil', pacienteRegulado.setorId);
      const setorOrigemData = setores.find(s => s.id === pacienteRegulado.setorId)!;
      const leitosOrigemAtualizado = setorOrigemData.leitos.map(l => {
        if (l.id === pacienteRegulado.leitoId) {
          return { 
            ...l, 
            statusLeito: 'Higienizacao' as const, 
            dataAtualizacaoStatus: agora, 
            dadosPaciente: null, 
            regulacao: null 
          };
        }
        return l;
      });
      batch.update(setorOrigemRef, { leitos: leitosOrigemAtualizado });

      // 2. Acha o leito de destino (que está "Reservado") e o torna "Ocupado"
      const setorDestino = setores.find(s => s.nomeSetor === pacienteRegulado.regulacao.paraSetor);
      if (setorDestino) {
        const setorDestinoRef = doc(db, 'setoresRegulaFacil', setorDestino.id);
        const leitosDestinoAtualizado = setorDestino.leitos.map(l => {
          if (l.codigoLeito === pacienteRegulado.regulacao.paraLeito) {
            const dadosPacienteFinal = { ...l.dadosPaciente };
            delete dadosPacienteFinal.origem; // Limpa a informação de origem
            return { 
              ...l, 
              statusLeito: 'Ocupado' as const, 
              dataAtualizacaoStatus: agora, 
              dadosPaciente: dadosPacienteFinal 
            };
          }
          return l;
        });
        batch.update(setorDestinoRef, { leitos: leitosDestinoAtualizado });
      }

      await batch.commit();
      toast({ 
        title: 'Regulação Concluída!', 
        description: 'O paciente foi efetivamente transferido.' 
      });
    } catch (error) {
      console.error('Erro ao concluir regulação:', error);
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível concluir a regulação.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const alterarRegulacao = async (paciente: any, leitoOrigem: any, leitoDestinoNovo: any, observacoes: string) => {
    try {
      setLoading(true);
      const batch = writeBatch(db);
      const agora = new Date().toISOString();

      // 1. Libera o leito que estava reservado ANTERIORMENTE
      const leitoReservadoAntigo = setores.flatMap(s => 
        s.leitos.map(l => ({...l, setorId: s.id, setorNome: s.nomeSetor }))
      ).find(l => l.statusLeito === 'Reservado' && l.dadosPaciente?.nomePaciente === paciente.nomePaciente);
      
      if (leitoReservadoAntigo) {
        const setorAntigoRef = doc(db, 'setoresRegulaFacil', leitoReservadoAntigo.setorId);
        const setorAntigoData = setores.find(s => s.id === leitoReservadoAntigo.setorId)!;
        const leitosSetorAntigo = setorAntigoData.leitos.map(l => 
          l.id === leitoReservadoAntigo.id ? { 
            ...l, 
            statusLeito: 'Vago' as const, 
            dataAtualizacaoStatus: agora,
            dadosPaciente: null 
          } : l
        );
        batch.update(setorAntigoRef, { leitos: leitosSetorAntigo });
      }

      // 2. Atualiza o leito de origem com a NOVA regulação
      const setorOrigemRef = doc(db, 'setoresRegulaFacil', leitoOrigem.setorId);
      const setorOrigemData = setores.find(s => s.id === leitoOrigem.setorId)!;
      const leitosOrigemAtualizado = setorOrigemData.leitos.map(l => {
        if (l.id === leitoOrigem.leitoId) {
          return {
            ...l,
            statusLeito: 'Regulado' as const,
            dataAtualizacaoStatus: agora,
            regulacao: {
              paraSetor: leitoDestinoNovo.setorNome || '',
              paraLeito: leitoDestinoNovo.codigoLeito || '',
              data: agora,
              observacoes: observacoes || ''
            }
          };
        }
        return l;
      });
      batch.update(setorOrigemRef, { leitos: leitosOrigemAtualizado });

      // 3. Reserva o NOVO leito de destino
      const setorDestinoRef = doc(db, 'setoresRegulaFacil', leitoDestinoNovo.setorId);
      const setorDestinoData = setores.find(s => s.id === leitoDestinoNovo.setorId)!;
      const leitosDestinoAtualizado = setorDestinoData.leitos.map(l => {
        if (l.id === leitoDestinoNovo.id) {
          return {
            ...l,
            statusLeito: 'Reservado' as const,
            dataAtualizacaoStatus: agora,
            dadosPaciente: {
              ...paciente,
              origem: {
                deSetor: leitoOrigem.setorOrigem || '',
                deLeito: leitoOrigem.leitoCodigo || ''
              }
            }
          };
        }
        return l;
      });
      
      // Se origem e destino são no mesmo setor
      if (setorOrigemRef.path === setorDestinoRef.path) {
        const leitosCombinados = leitosOrigemAtualizado.map(l => 
          l.id === leitoDestinoNovo.id ? leitosDestinoAtualizado.find(ld => ld.id === l.id) || l : l
        );
        batch.update(setorOrigemRef, { leitos: leitosCombinados });
      } else {
        batch.update(setorDestinoRef, { leitos: leitosDestinoAtualizado });
      }

      await batch.commit();
      toast({ 
        title: 'Regulação Alterada!', 
        description: 'O destino do paciente foi atualizado.' 
      });
    } catch (error) {
      console.error('Erro ao alterar regulação:', error);
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível alterar a regulação.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelarRegulacao = async (paciente: any, motivo: string) => {
    try {
      setLoading(true);
      const batch = writeBatch(db);
      const agora = new Date().toISOString();

      // Encontra o leito de origem (que está regulado)
      const leitoOrigem = setores.flatMap(s => 
        s.leitos.map(l => ({ ...l, setorId: s.id }))
      ).find(l => l.statusLeito === 'Regulado' && l.dadosPaciente?.nomePaciente === paciente.nomePaciente);

      if (!leitoOrigem) throw new Error('Leito de origem não encontrado');

      const setorOrigem = setores.find(s => s.id === leitoOrigem.setorId);
      if (!setorOrigem) throw new Error('Setor de origem não encontrado');

      // Volta o leito de origem para 'Ocupado'
      const setorOrigemRef = doc(db, 'setoresRegulaFacil', leitoOrigem.setorId);
      const leitosOrigemAtualizado = setorOrigem.leitos.map(l => {
        if (l.id === leitoOrigem.id) {
          return { 
            ...l, 
            statusLeito: 'Ocupado' as const, 
            dataAtualizacaoStatus: agora,
            regulacao: null
          };
        }
        return l;
      });

      // Encontra e libera o leito que estava reservado
      const leitoReservado = setores.flatMap(s => 
        s.leitos.map(l => ({ ...l, setorId: s.id, setorNome: s.nomeSetor }))
      ).find(l => l.statusLeito === 'Reservado' && l.dadosPaciente?.nomePaciente === paciente.nomePaciente);

      if (leitoReservado) {
        const setorDestino = setores.find(s => s.id === leitoReservado.setorId);
        if (setorDestino) {
          const setorDestinoRef = doc(db, 'setoresRegulaFacil', leitoReservado.setorId);
          const leitosDestinoAtualizado = setorDestino.leitos.map(l => {
            if (l.id === leitoReservado.id) {
              return { 
                ...l, 
                statusLeito: 'Vago' as const, 
                dataAtualizacaoStatus: agora,
                dadosPaciente: null
              };
            }
            return l;
          });
          batch.update(setorDestinoRef, { leitos: leitosDestinoAtualizado });
        }
      }

      batch.update(setorOrigemRef, { leitos: leitosOrigemAtualizado });
      await batch.commit();
      
      toast({ 
        title: 'Regulação Cancelada!', 
        description: 'A reserva do leito de destino foi cancelada.' 
      });
    } catch (error) {
      console.error('Erro ao cancelar regulação:', error);
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível cancelar a regulação.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const finalizarIsolamentoPaciente = async (setorId: string, leitoId: string, isolamentoId: string) => {
    try {
      const leito = setores.flatMap(s => s.leitos).find(l => l.id === leitoId);
      if (!leito?.dadosPaciente?.isolamentosVigentes) return;

      // Remove o isolamento específico do array
      const isolamentosAtualizados = leito.dadosPaciente.isolamentosVigentes.filter(
        iso => iso.isolamentoId !== isolamentoId
      );
      
      const dadosPacienteAtualizado = { 
        ...leito.dadosPaciente, 
        isolamentosVigentes: isolamentosAtualizados 
      };
      
      await updateLeitoInSetor(setorId, leitoId, { dadosPaciente: dadosPacienteAtualizado });
      
      toast({ 
        title: "Isolamento Finalizado", 
        description: "O isolamento foi finalizado com sucesso." 
      });
    } catch (error) {
      console.error('Erro ao finalizar isolamento:', error);
      toast({ 
        title: "Erro", 
        description: "Não foi possível finalizar o isolamento.", 
        variant: "destructive" 
      });
    }
  };

  const concluirTransferencia = async (leitoDestino: Leito, setorDestinoId: string) => {
    if (!leitoDestino.dadosPaciente?.origem) {
      toast({ title: "Erro de Dados", description: "Não foi possível encontrar a origem do paciente para concluir a transferência.", variant: "destructive" });
      return;
    }

    const { deSetor, deLeito } = leitoDestino.dadosPaciente.origem;

    try {
      setLoading(true);
      const batch = writeBatch(db);
      const agora = new Date().toISOString();

      // 1. Atualiza o leito de ORIGEM (de 'Regulado' para 'Higienizacao')
      const setorOrigem = setores.find(s => s.nomeSetor === deSetor);
      if (setorOrigem) {
        const setorOrigemRef = doc(db, 'setoresRegulaFacil', setorOrigem.id!);
        const leitosOrigemAtualizado = setorOrigem.leitos.map(l => {
          if (l.codigoLeito === deLeito) {
            return { 
              ...l, 
              statusLeito: 'Higienizacao' as const, 
              dataAtualizacaoStatus: agora, 
              dadosPaciente: null, 
              regulacao: undefined 
            };
          }
          return l;
        });
        batch.update(setorOrigemRef, { leitos: leitosOrigemAtualizado });
      }

      // 2. Atualiza o leito de DESTINO (de 'Reservado' para 'Ocupado')
      const setorDestinoData = setores.find(s => s.id === setorDestinoId);
      if (setorDestinoData) {
          const setorDestinoRef = doc(db, 'setoresRegulaFacil', setorDestinoId);
          const leitosDestinoAtualizado = setorDestinoData.leitos.map(l => {
            if (l.id === leitoDestino.id) {
              const dadosPacienteFinal = { ...l.dadosPaciente };
              delete dadosPacienteFinal.origem; // Remove a informação de origem
              return { 
                ...l, 
                statusLeito: 'Ocupado' as const, 
                dataAtualizacaoStatus: agora, 
                dadosPaciente: dadosPacienteFinal 
              };
            }
            return l;
          });
          batch.update(setorDestinoRef, { leitos: leitosDestinoAtualizado });
      }

      await batch.commit();
      toast({ title: 'Transferência Concluída!', description: `Paciente alocado com sucesso no leito ${leitoDestino.codigoLeito}.` });
    } catch (error) {
      console.error('Erro ao concluir transferência:', error);
      toast({ title: 'Erro', description: 'Não foi possível concluir a transferência.', variant: 'destructive' });
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
    cancelarReserva,
    adicionarIsolamentoPaciente,
    atualizarRegrasIsolamento,
    confirmarRegulacao,
    concluirRegulacao,
    alterarRegulacao: (paciente: any, leitoOrigem: any, leitoDestino: any, observacoes: string) => 
      alterarRegulacao(paciente, leitoOrigem, leitoDestino, observacoes),
    cancelarRegulacao,
    finalizarIsolamentoPaciente,
    concluirTransferencia,
  };
};
