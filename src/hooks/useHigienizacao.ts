
import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, addDoc, doc, updateDoc } from 'firebase/firestore';
import { differenceInMinutes, differenceInHours } from 'date-fns';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useAuditoria } from '@/hooks/useAuditoria';
import { useLeitos } from '@/hooks/useLeitos';
import { useSetores } from '@/hooks/useSetores';
import { toast } from '@/hooks/use-toast';
import { LeitoEnriquecido } from '@/types/hospital';

interface IndicadoresHigienizacao {
  quantidadeAguardando: number;
  tempoMedioEspera: string;
  top3Setores: { nome: string; quantidade: number }[];
  totalConcluidas: number;
}

interface LeitoHigienizacao extends LeitoEnriquecido {
  tempoEsperaMinutos: number;
  tempoEsperaFormatado: string;
  setor: string;
}

export const useHigienizacao = () => {
  const [leitosRaw, setLeitosRaw] = useState<LeitoEnriquecido[]>([]);
  const [totalConcluidas, setTotalConcluidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();
  const { registrarLog } = useAuditoria();
  const { atualizarStatusLeito } = useLeitos();
  const { setores } = useSetores();

  // Buscar leitos em higienização
  useEffect(() => {
    const q = query(collection(db, 'leitosRegulaFacil'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosLeitos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeitoEnriquecido[];

      // Filtrar apenas leitos em higienização
      const leitosHigienizacao = todosLeitos.filter(leito => {
        const ultimoStatus = leito.historicoMovimentacao?.slice(-1)[0];
        return ultimoStatus?.statusLeito === 'Higienizacao';
      });

      setLeitosRaw(leitosHigienizacao);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Buscar total de higienizações concluídas
  useEffect(() => {
    const q = query(collection(db, 'higienizacoesConcluidas'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTotalConcluidas(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  // Criar mapa de setores para traduzir IDs para nomes
  const mapaSetores = useMemo(() => {
    const mapa = new Map();
    setores.forEach(setor => {
      mapa.set(setor.id, setor.nomeSetor);
    });
    return mapa;
  }, [setores]);

  // Processar dados dos leitos
  const leitosProcessados = useMemo(() => {
    const agora = new Date();
    
    return leitosRaw.map(leito => {
      const ultimoStatus = leito.historicoMovimentacao?.slice(-1)[0];
      const inicioHigienizacao = new Date(ultimoStatus?.dataAtualizacaoStatus || new Date());
      const tempoEsperaMinutos = differenceInMinutes(agora, inicioHigienizacao);
      const horas = Math.floor(tempoEsperaMinutos / 60);
      const minutos = tempoEsperaMinutos % 60;
      
      return {
        ...leito,
        tempoEsperaMinutos,
        tempoEsperaFormatado: horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`,
        setor: mapaSetores.get(leito.setorId) || 'Setor não identificado'
      } as LeitoHigienizacao;
    });
  }, [leitosRaw, mapaSetores]);

  // Separar leitos prioritários dos normais
  const { leitosPrioritarios, leitosNormais } = useMemo(() => {
    const prioritarios = leitosProcessados
      .filter(leito => leito.prioridadeHigienizacao)
      .sort((a, b) => b.tempoEsperaMinutos - a.tempoEsperaMinutos);

    const normais = leitosProcessados
      .filter(leito => !leito.prioridadeHigienizacao)
      .sort((a, b) => b.tempoEsperaMinutos - a.tempoEsperaMinutos);

    return { leitosPrioritarios: prioritarios, leitosNormais: normais };
  }, [leitosProcessados]);

  // Agrupar leitos normais por setor
  const leitosAgrupados = useMemo(() => {
    const grupos = leitosNormais.reduce((acc, leito) => {
      if (!acc[leito.setor]) {
        acc[leito.setor] = [];
      }
      acc[leito.setor].push(leito);
      return acc;
    }, {} as Record<string, LeitoHigienizacao[]>);

    // Ordenar cada grupo por tempo de espera (maior primeiro) e prioridade
    Object.keys(grupos).forEach(setor => {
      grupos[setor].sort((a, b) => {
        // Primeiro prioridade, depois tempo
        if (a.prioridadeHigienizacao && !b.prioridadeHigienizacao) return -1;
        if (!a.prioridadeHigienizacao && b.prioridadeHigienizacao) return 1;
        return b.tempoEsperaMinutos - a.tempoEsperaMinutos;
      });
    });

    return grupos;
  }, [leitosNormais]);

  // Calcular indicadores
  const indicadores: IndicadoresHigienizacao = useMemo(() => {
    const quantidadeAguardando = leitosProcessados.length;
    
    // Tempo médio de espera
    let tempoMedioEspera = "N/A";
    if (quantidadeAguardando > 0) {
      const mediaMinutos = leitosProcessados.reduce((acc, l) => acc + l.tempoEsperaMinutos, 0) / quantidadeAguardando;
      const horas = Math.floor(mediaMinutos / 60);
      const minutos = Math.floor(mediaMinutos % 60);
      tempoMedioEspera = horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
    }

    // Top 3 setores com nomes corretos
    const setoresCount = leitosProcessados.reduce((acc, leito) => {
      acc[leito.setor] = (acc[leito.setor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const top3Setores = Object.entries(setoresCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([nome, quantidade]) => ({ nome, quantidade }));

    return {
      quantidadeAguardando,
      tempoMedioEspera,
      top3Setores,
      totalConcluidas
    };
  }, [leitosProcessados, totalConcluidas]);

  // Função para concluir higienização
  const handleConcluirHigienizacao = async (leito: LeitoHigienizacao) => {
    if (!userData) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const agora = new Date();
      const ultimoStatus = leito.historicoMovimentacao?.slice(-1)[0];
      const inicioHigienizacao = new Date(ultimoStatus?.dataAtualizacaoStatus || new Date());
      const duracaoMinutos = differenceInMinutes(agora, inicioHigienizacao);

      // 1. Criar registro na coleção de higienizações concluídas
      await addDoc(collection(db, 'higienizacoesConcluidas'), {
        leitoId: leito.id,
        leitoCodigo: leito.codigoLeito,
        setorNome: leito.setor,
        inicioHigienizacao: ultimoStatus?.dataAtualizacaoStatus,
        fimHigienizacao: agora.toISOString(),
        duracaoMinutos,
        usuarioIdConclusao: userData.uid,
        usuarioNomeConclusao: userData.nomeCompleto,
        prioritaria: leito.prioridadeHigienizacao || false
      });

      // 2. Atualizar status do leito para Vago
      await atualizarStatusLeito(leito.id, 'Vago');

      // 3. Limpar flag de prioridade se existir
      if (leito.prioridadeHigienizacao) {
        await updateDoc(doc(db, 'leitosRegulaFacil', leito.id), {
          prioridadeHigienizacao: false
        });
      }

      // 4. Registrar log de auditoria
      registrarLog(
        `Higienização do leito ${leito.codigoLeito} concluída em ${duracaoMinutos} minutos.`,
        'Central de Higienização'
      );

      toast({
        title: "Sucesso!",
        description: `Leito ${leito.codigoLeito} liberado para uso em ${Math.floor(duracaoMinutos / 60)}h ${duracaoMinutos % 60}m.`,
      });

    } catch (error) {
      console.error('Erro ao concluir higienização:', error);
      toast({
        title: "Erro",
        description: "Não foi possível concluir a higienização.",
        variant: "destructive",
      });
    }
  };

  return {
    leitosPrioritarios,
    leitosAgrupados,
    indicadores,
    handleConcluirHigienizacao,
    loading
  };
};
