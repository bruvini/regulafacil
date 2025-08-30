import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import SetorCard from '@/components/SetorCard';
import GerenciamentoModal from '@/components/modals/GerenciamentoModal';
import { FiltrosMapaLeitos } from '@/components/FiltrosMapaLeitos';
import { IndicadoresGerais } from '@/components/IndicadoresGerais';
import { LimpezaPacientesModal } from '@/components/modals/LimpezaPacientesModal';
import { AltaNoLeitoModal } from '@/components/modals/AltaNoLeitoModal';
import { InternacaoManualModal } from '@/components/modals/InternacaoManualModal';
import { ReservaExternaModal } from '@/components/modals/ReservaExternaModal';
import AltaPendenteModal from '@/components/modals/AltaPendenteModal';
import { BoletimDiarioModal } from '@/components/modals/BoletimDiarioModal';
import { ReservaOncologiaModal } from '@/components/modals/ReservaOncologiaModal';
import { useReservaOncologia } from '@/hooks/useReservaOncologia';
import { useSetores } from '@/hooks/useSetores';
import { useLeitos } from '@/hooks/useLeitos';
import { usePacientes } from '@/hooks/usePacientes';
import { useIndicadoresHospital } from '@/hooks/useIndicadoresHospital';
import { useFiltrosMapaLeitos } from '@/hooks/useFiltrosMapaLeitos';
import { useAuth } from '@/hooks/useAuth';
import { useAuditoria } from '@/hooks/useAuditoria';
import { useBoletimDiario } from '@/hooks/useBoletimDiario';
import { Settings, ShieldQuestion, ClipboardList, Trash2, Stethoscope, Newspaper, ClipboardPlus } from 'lucide-react';
import { MovimentacaoModal } from '@/components/modals/MovimentacaoModal';
import { RelatorioIsolamentosModal } from '@/components/modals/RelatorioIsolamentosModal';
import { RelatorioVagosModal } from '@/components/modals/RelatorioVagosModal';
import { RelatorioEspecialidadeModal } from '@/components/modals/RelatorioEspecialidadeModal';
import { ObservacoesModal } from '@/components/modals/ObservacoesModal';
import { Leito, Paciente, HistoricoMovimentacao, AltaLeitoInfo, LeitoEnriquecido, InfoAltaPendente, DetalhesRemanejamento } from '@/types/hospital';
import { doc, updateDoc, arrayUnion, deleteDoc, arrayRemove, writeBatch, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Observacao } from '@/types/observacao';

const MapaLeitos = () => {
  // --- Estados de Modais e Ações ---
  const [modalOpen, setModalOpen] = useState(false);
  const [movimentacaoModalOpen, setMovimentacaoModalOpen] = useState(false);
  const [relatorioIsolamentoOpen, setRelatorioIsolamentoOpen] = useState(false);
  const [relatorioVagosOpen, setRelatorioVagosOpen] = useState(false);
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [limpezaModalOpen, setLimpezaModalOpen] = useState(false);
  const [altaNoLeitoModalOpen, setAltaNoLeitoModalOpen] = useState(false);
  const [internacaoModalOpen, setInternacaoModalOpen] = useState(false);
  const [reservaModalOpen, setReservaModalOpen] = useState(false);
  const [relatorioEspecialidadeOpen, setRelatorioEspecialidadeOpen] = useState(false);
  const [boletimModalOpen, setBoletimModalOpen] = useState(false);
  const [reservaOncologiaModalOpen, setReservaOncologiaModalOpen] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined);
  interface PacienteMoverInfo {
    dados: Paciente;
    leitoOrigemId: string;
    setorOrigemId: string;
  }

  const [pacienteParaMover, setPacienteParaMover] = useState<PacienteMoverInfo | null>(null);
  const [pacienteParaObs, setPacienteParaObs] = useState<LeitoEnriquecido | null>(null);
  const [pacienteParaAltaNoLeito, setPacienteParaAltaNoLeito] = useState<LeitoEnriquecido | null>(null);
  const [leitoParaAcao, setLeitoParaAcao] = useState<LeitoEnriquecido | null>(null);
  const [altaPendenteModalOpen, setAltaPendenteModalOpen] = useState(false);
  const [pacienteParaAltaPendente, setPacienteParaAltaPendente] = useState<Paciente | null>(null);

  const { toast } = useToast();
  const { userData } = useAuth();
  const { registrarLog } = useAuditoria();

  // --- Hooks de Dados (Nova Arquitetura) ---
  const { setores, loading: setoresLoading } = useSetores();
  const { leitos, loading: leitosLoading, atualizarStatusLeito, vincularPacienteLeito, togglePrioridadeHigienizacao } = useLeitos();
  const { pacientes, loading: pacientesLoading, criarPacienteManual, atualizarStatusAltaPendente } = usePacientes();
  const reservaOncologia = useReservaOncologia();
  const loading = setoresLoading || leitosLoading || pacientesLoading;

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // --- Lógica Central de Combinação de Dados ---
  const dadosCombinados = useMemo(() => {
    if (loading) {
      return { setoresEnriquecidos: [], todosLeitosEnriquecidos: [] };
    }

    const mapaPacientes = new Map(pacientes.map(p => [p.id, p]));
    const todosLeitosEnriquecidos: LeitoEnriquecido[] = leitos.map(leito => {
      const historicoRecente = leito.historicoMovimentacao[leito.historicoMovimentacao.length - 1];
      const pacienteId = historicoRecente?.pacienteId;
      return {
        ...leito,
        statusLeito: historicoRecente.statusLeito,
        dataAtualizacaoStatus: historicoRecente.dataAtualizacaoStatus,
        motivoBloqueio: historicoRecente.motivoBloqueio,
        regulacao: historicoRecente.infoRegulacao,
        dadosPaciente: pacienteId ? mapaPacientes.get(pacienteId) : null
      };
    });

    const mapaLeitosPorSetor = todosLeitosEnriquecidos.reduce((acc, leito) => {
      (acc[leito.setorId] = acc[leito.setorId] || []).push(leito);
      return acc;
    }, {} as Record<string, LeitoEnriquecido[]>);

    const setoresEnriquecidos = setores.map(setor => ({
      ...setor,
      leitos: mapaLeitosPorSetor[setor.id!] || []
    }));

    return { setoresEnriquecidos, todosLeitosEnriquecidos };
  }, [setores, leitos, pacientes, loading]);

  const { setoresEnriquecidos, todosLeitosEnriquecidos } = dadosCombinados;
  const leitosOncologia = useMemo(() => {
    return todosLeitosEnriquecidos.filter(l => {
      const setorInfo = setores.find(s => s.id === l.setorId);
      return setorInfo?.nomeSetor === 'UNID. ONCOLOGIA' && (l.statusLeito === 'Vago' || l.statusLeito === 'Higienizacao');
    });
  }, [todosLeitosEnriquecidos, setores]);
  const { contagemPorStatus, taxaOcupacao, tempoMedioStatus, nivelPCP } = useIndicadoresHospital(setoresEnriquecidos);
  const { filteredSetores, filtrosAvancados, setFiltrosAvancados, ...filtrosProps } = useFiltrosMapaLeitos(setoresEnriquecidos);

  const { gerarTextoBoletim } = useBoletimDiario({
    pacientes,
    leitos: todosLeitosEnriquecidos,
    setores,
    nivelPCP: nivelPCP.nivel,
  });

  // Verificar se o usuário é administrador
  const isAdmin = userData?.tipoAcesso === 'Administrador';

  const dadosOcupacaoEspecialidade = useMemo(() => {
    const ocupacao: Record<string, number> = {};
    todosLeitosEnriquecidos
      .filter(l => l.statusLeito === 'Ocupado' && l.dadosPaciente?.especialidadePaciente)
      .forEach(l => {
        const esp = l.dadosPaciente!.especialidadePaciente;
        ocupacao[esp] = (ocupacao[esp] || 0) + 1;
      });
    return ocupacao;
  }, [todosLeitosEnriquecidos]);

  // Funções de confirmação para internação e reserva
  interface InternacaoFormData {
    nomeCompleto: string;
    dataNascimento: string;
    sexoPaciente: 'Masculino' | 'Feminino';
    dataInternacao: string;
    especialidadePaciente: string;
  }

  const handleConfirmarInternacao = async (dadosForm: InternacaoFormData) => {
    if (!leitoParaAcao) return;

    try {
      const pacienteId = await criarPacienteManual({
        ...dadosForm,
        leitoId: leitoParaAcao.id,
        setorId: leitoParaAcao.setorId,
      });

      if (pacienteId) {
        await vincularPacienteLeito(leitoParaAcao.id, pacienteId, leitoParaAcao.setorId);

        registrarLog(
          `Internou manualmente o paciente ${dadosForm.nomeCompleto} no leito ${leitoParaAcao.codigoLeito}.`,
          'Mapa de Leitos'
        );

        toast({
          title: 'Sucesso!',
          description: 'Paciente internado e leito ocupado.'
        });
      }

      setInternacaoModalOpen(false);
      setLeitoParaAcao(null);
    } catch (error) {
      console.error('Erro ao internar paciente:', error);
    }
  };

  interface ReservaExternaFormData {
    nomeCompleto: string;
    dataNascimento: string;
    sexoPaciente: 'Masculino' | 'Feminino';
    origem: string;
  }

  const handleConfirmarReserva = async (
    dadosForm: ReservaExternaFormData,
    leitoParam?: LeitoEnriquecido
  ) => {
    const leitoAlvo = leitoParam || leitoParaAcao;
    if (!leitoAlvo) return;

    try {
      const setorInfo = setores.find(s => s.id === leitoAlvo.setorId);

      const pacienteId = await criarPacienteManual(
        {
          nomeCompleto: dadosForm.nomeCompleto,
          dataNascimento: dadosForm.dataNascimento,
          sexoPaciente: dadosForm.sexoPaciente,
          dataInternacao: new Date().toISOString(),
          especialidadePaciente: 'Não Informada',
          origem: {
            deSetor: dadosForm.origem,
            deLeito: 'Externo'
          }
        },
        { retornarExistente: true }
      );

      if (!pacienteId) {
        throw new Error('Não foi possível criar ou encontrar o paciente para a reserva.');
      }

      const batch = writeBatch(db);
      const agora = new Date().toISOString();

      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      batch.update(pacienteRef, { leitoId: leitoAlvo.id, setorId: leitoAlvo.setorId });

      const leitoRef = doc(db, 'leitosRegulaFacil', leitoAlvo.id);
      batch.update(leitoRef, {
        historicoMovimentacao: arrayUnion({
          statusLeito: 'Reservado',
          dataAtualizacaoStatus: agora,
          pacienteId,
          infoRegulacao: {
            paraSetor: setorInfo?.nomeSetor || 'Setor não encontrado',
            paraLeito: leitoAlvo.codigoLeito,
            origemExterna: dadosForm.origem,
            tipoReserva: 'externo',
          },
        })
      });

      await batch.commit();

      registrarLog(
        `Reservou o leito ${leitoAlvo.codigoLeito} para o paciente externo ${dadosForm.nomeCompleto} (origem: ${dadosForm.origem}).`,
        'Mapa de Leitos'
      );

      toast({
        title: 'Sucesso!',
        description: 'Leito reservado com sucesso.'
      });

      setReservaModalOpen(false);
      setLeitoParaAcao(null);
    } catch (error) {
      console.error('Erro ao confirmar reserva:', error);
      toast({ title: 'Erro', description: 'Não foi possível criar a reserva.', variant: 'destructive' });
    }
  };

  const handleCancelarAltaNoLeito = async (pacienteId: string) => {
    const confirmar = window.confirm('Deseja realmente cancelar a alta no leito para este paciente?');
    if (!confirmar) return;

    try {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, {
        altaNoLeito: deleteField()
      });

      const paciente = pacientes.find((p) => p.id === pacienteId);
      registrarLog(
        `Cancelou a alta no leito do paciente ${paciente?.nomeCompleto || pacienteId}.`,
        'Mapa de Leitos'
      );
      toast({ title: 'Sucesso!', description: 'Alta no leito cancelada.' });
    } catch (error) {
      console.error('Erro ao cancelar alta no leito:', error);
      toast({ title: 'Erro', description: 'Erro ao cancelar alta no leito.', variant: 'destructive' });
    }
  };

  // --- OBJETO CENTRALIZADO DE AÇÕES ---
  const leitoActions = {
    onMoverPaciente: (leito: LeitoEnriquecido) => {
      setPacienteParaMover({
        dados: leito.dadosPaciente,
        leitoOrigemId: leito.id,
        setorOrigemId: leito.setorId,
      });
      setMovimentacaoModalOpen(true);
    },

    onAbrirObs: (leito: LeitoEnriquecido) => {
      setPacienteParaObs(leito);
      setObsModalOpen(true);
    },

    onAltaNoLeito: (leito: LeitoEnriquecido) => {
      setPacienteParaAltaNoLeito(leito);
      setAltaNoLeitoModalOpen(true);
    },
    onCancelarAltaNoLeito: handleCancelarAltaNoLeito,

    onInternarManualmente: (leito: LeitoEnriquecido) => {
      setLeitoParaAcao(leito);
      setInternacaoModalOpen(true);
    },

    onReservarExterno: (leito: LeitoEnriquecido) => {
      setLeitoParaAcao(leito);
      setReservaModalOpen(true);
    },

    onLiberarLeito: async (leitoId: string, pacienteId: string) => {
      await deleteDoc(doc(db, 'pacientesRegulaFacil', pacienteId));
      await atualizarStatusLeito(leitoId, 'Higienizacao');
      toast({ title: "Sucesso!", description: "Paciente recebeu alta." });
    },

    onAtualizarStatus: atualizarStatusLeito,

    onSolicitarUTI: async (pacienteId: string) => {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, {
        aguardaUTI: true,
        dataPedidoUTI: new Date().toISOString()
      });
      toast({ title: "Sucesso!", description: "Pedido de UTI solicitado." });
    },

    onSolicitarRemanejamento: async (pacienteId: string, motivo: DetalhesRemanejamento) => {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, {
        remanejarPaciente: true,
        motivoRemanejamento: motivo,
        dataPedidoRemanejamento: new Date().toISOString()
      });
      toast({ title: "Sucesso!", description: "Solicitação de remanejamento registrada." });
    },

    onTransferirPaciente: async (pacienteId: string, destino: string, motivo: string) => {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, { 
        transferirPaciente: true, 
        destinoTransferencia: destino, 
        motivoTransferencia: motivo,
        dataTransferencia: new Date().toISOString()
      });
      toast({ title: "Sucesso!", description: "Solicitação de transferência externa registrada." });
    },

    onCancelarReserva: async (leitoId: string) => {
      try {
        await atualizarStatusLeito(leitoId, 'Vago');
        toast({ title: "Sucesso!", description: "Reserva cancelada." });
      } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        toast({ title: "Erro", description: "Erro ao cancelar reserva.", variant: "destructive" });
      }
    },

    onConcluirTransferencia: async (leito: LeitoEnriquecido) => {
      try {
        await atualizarStatusLeito(leito.id, 'Ocupado');
        toast({ title: "Sucesso!", description: "Transferência concluída." });
      } catch (error) {
        console.error('Erro ao concluir transferência:', error);
        toast({ title: "Erro", description: "Erro ao concluir transferência.", variant: "destructive" });
      }
    },

    onToggleProvavelAlta: async (pacienteId: string, valorAtual: boolean) => {
      await updateDoc(doc(db, 'pacientesRegulaFacil', pacienteId), { provavelAlta: !valorAtual });
    },

    onFinalizarHigienizacao: async (leitoId: string) => {
      await atualizarStatusLeito(leitoId, 'Vago');
      await updateDoc(doc(db, 'leitosRegulaFacil', leitoId), { prioridadeHigienizacao: false });
      toast({ title: "Sucesso!", description: "Leito liberado e pronto para uso." });
    },

    onBloquearLeito: async (leitoId: string, motivo: string) => {
      try {
        await atualizarStatusLeito(leitoId, 'Bloqueado', { motivoBloqueio: motivo });
        toast({ title: "Sucesso!", description: "Leito bloqueado." });
      } catch (error) {
        console.error('Erro ao bloquear leito:', error);
        toast({ title: "Erro", description: "Erro ao bloquear leito.", variant: "destructive" });
      }
    },

    onEnviarParaHigienizacao: async (leitoId: string) => {
      try {
        await atualizarStatusLeito(leitoId, 'Higienizacao');
        toast({ title: "Sucesso!", description: "Leito enviado para higienização." });
      } catch (error) {
        console.error('Erro ao enviar para higienização:', error);
        toast({ title: "Erro", description: "Erro ao enviar para higienização.", variant: "destructive" });
      }
    },

    onPriorizarHigienizacao: async (leitoId: string, prioridadeAtual: boolean) => {
      await togglePrioridadeHigienizacao(leitoId, prioridadeAtual);
    },

    onAltaPendente: (paciente: Paciente) => {
      setPacienteParaAltaPendente(paciente);
      setAltaPendenteModalOpen(true);
    }
  };

  const handleConfirmarMovimentacao = async (leitoDestino: Leito) => {
    if (pacienteParaMover && leitoDestino) {
      const batch = writeBatch(db);
      const agora = new Date().toISOString();

      const leitoOrigemRef = doc(db, 'leitosRegulaFacil', pacienteParaMover.leitoOrigemId);
      batch.update(leitoOrigemRef, {
        historicoMovimentacao: arrayUnion({
          statusLeito: 'Higienizacao',
          dataAtualizacaoStatus: agora,
          pacienteId: pacienteParaMover.dados.id,
        }),
      });

      const leitoDestinoRef = doc(db, 'leitosRegulaFacil', leitoDestino.id);
      const updateDestino: Record<string, unknown> = {
        historicoMovimentacao: arrayUnion({
          statusLeito: 'Ocupado',
          dataAtualizacaoStatus: agora,
          pacienteId: pacienteParaMover.dados.id,
        }),
      };
      if (leitoDestino.prioridadeHigienizacao) {
        updateDestino.prioridadeHigienizacao = false;
      }
      batch.update(leitoDestinoRef, updateDestino);

      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteParaMover.dados.id);
      batch.update(pacienteRef, { leitoId: leitoDestino.id, setorId: leitoDestino.setorId });

      await batch.commit();
      toast({ title: 'Sucesso!', description: 'Paciente movido com sucesso.' });
    }
    setMovimentacaoModalOpen(false);
    setPacienteParaMover(null);
  };

  const handleConfirmObs = async (obs: string) => {
    if (pacienteParaObs?.dadosPaciente && userData) {
      try {
        const novaObservacao = {
          id: crypto.randomUUID(),
          texto: obs,
          timestamp: new Date().toISOString(),
          usuario: userData.nomeCompleto
        };

        const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteParaObs.dadosPaciente.id);
        await updateDoc(pacienteRef, { 
          obsPaciente: arrayUnion(novaObservacao)
        });
        toast({ title: "Sucesso!", description: "Observação adicionada." });
      } catch (error) {
        console.error('Erro ao adicionar observação:', error);
        toast({ 
          title: "Erro", 
          description: "Erro ao adicionar observação.", 
          variant: "destructive" 
        });
      }
    }
    setObsModalOpen(false);
  };

  const handleConfirmarAltaPendente = async (dados: InfoAltaPendente) => {
    if (pacienteParaAltaPendente) {
      await atualizarStatusAltaPendente(pacienteParaAltaPendente.id, dados);
      toast({ title: 'Sucesso!', description: 'Pendência de alta registrada.' });
    }
    setAltaPendenteModalOpen(false);
    setPacienteParaAltaPendente(null);
  };

  const handleDeleteObs = async (observacaoId: string) => {
    if (pacienteParaObs?.dadosPaciente && userData) {
      try {
        const observacoes = pacienteParaObs.dadosPaciente.obsPaciente || [];
        const observacaoParaRemover = observacoes.find(obs => obs.id === observacaoId);
        
        if (!observacaoParaRemover) return;

        const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteParaObs.dadosPaciente.id);
        await updateDoc(pacienteRef, {
          obsPaciente: arrayRemove(observacaoParaRemover)
        });

        registrarLog(`Excluiu observação do paciente ${pacienteParaObs.dadosPaciente.nomeCompleto}.`, 'Mapa de Leitos');
        toast({ title: "Sucesso!", description: "Observação removida." });
      } catch (error) {
        console.error('Erro ao remover observação:', error);
        toast({ 
          title: "Erro", 
          description: "Erro ao remover observação.", 
          variant: "destructive" 
        });
      }
    }
  };

  const handleConfirmarAltaNoLeito = async (pendencia: string) => {
    if (pacienteParaAltaNoLeito?.dadosPaciente && userData) {
      try {
        const altaLeitoInfo: AltaLeitoInfo = {
          status: true,
          pendencia,
          timestamp: new Date().toISOString(),
          usuario: userData.nomeCompleto
        };

        const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteParaAltaNoLeito.dadosPaciente.id);
        await updateDoc(pacienteRef, { 
          altaNoLeito: altaLeitoInfo
        });

        registrarLog(`Registrou alta no leito para o paciente ${pacienteParaAltaNoLeito.dadosPaciente.nomeCompleto}.`, 'Mapa de Leitos');
        toast({ title: "Sucesso!", description: "Alta no leito registrada com sucesso." });
      } catch (error) {
        console.error('Erro ao registrar alta no leito:', error);
        toast({ 
          title: "Erro", 
          description: "Erro ao registrar alta no leito.", 
          variant: "destructive" 
        });
      }
    }
    setAltaNoLeitoModalOpen(false);
    setPacienteParaAltaNoLeito(null);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-medical-primary">Mapa de Leitos</h1>
              <p className="text-muted-foreground">Visualização em tempo real dos leitos hospitalares</p>
            </div>
          </header>

          {loading ? (
             <Card className="shadow-card border border-border/50">
              <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
              <CardContent><div className="space-y-4"><Skeleton className="h-8 w-full" /></div></CardContent>
            </Card>
          ) : (
            <IndicadoresGerais 
              contagem={contagemPorStatus} 
              taxa={taxaOcupacao} 
              tempos={tempoMedioStatus}
              nivelPCP={nivelPCP}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FiltrosMapaLeitos 
                setores={setores} 
                filtrosAvancados={filtrosAvancados}
                setFiltrosAvancados={setFiltrosAvancados}
                {...filtrosProps} 
              />
            </div>
            <div className="lg:col-span-1">
              <Card className="shadow-card border border-border/50">
                <CardHeader><CardTitle className="text-xl font-semibold text-medical-primary">Ações Rápidas</CardTitle></CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <div className="flex space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => setModalOpen(true)}><Settings className="h-4 w-4" /></Button></TooltipTrigger>
                        <TooltipContent><p>Gerenciar Setores e Leitos</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => setRelatorioIsolamentoOpen(true)}><ShieldQuestion className="h-4 w-4" /></Button></TooltipTrigger>
                        <TooltipContent><p>Relatório de Isolamentos</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => setRelatorioVagosOpen(true)}><ClipboardList className="h-4 w-4" /></Button></TooltipTrigger>
                        <TooltipContent><p>Relatório de Leitos Vagos</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setRelatorioEspecialidadeOpen(true)}>
                            <Stethoscope className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Ocupação por Especialidade</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setBoletimModalOpen(true)}>
                            <Newspaper className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Gerar Boletim Diário</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setReservaOncologiaModalOpen(true)}>
                            <ClipboardPlus className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Reservas Oncologia</p></TooltipContent>
                      </Tooltip>
                      {isAdmin && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon" 
                              onClick={() => setLimpezaModalOpen(true)}
                              className="border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Limpar Lista de Pacientes</p></TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Card className="shadow-card border border-border/50">
            <CardHeader>
              <h2 className="text-2xl font-bold text-medical-primary">Mapa de Setores</h2>
              <p className="text-muted-foreground">Visualização em tempo real dos leitos hospitalares</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : filteredSetores.length > 0 ? (
                <Accordion 
                  type="single" 
                  collapsible 
                  value={accordionValue} 
                  onValueChange={setAccordionValue}
                  className="w-full space-y-2"
                >
                  {filteredSetores.map((setor) => {
                    // Calcular indicadores do setor aqui
                    const leitosVagos = setor.leitos.filter(l => l.statusLeito === 'Vago').length;
                    const totalLeitos = setor.leitos.length;
                    const taxaOcupacao = totalLeitos > 0 ? Math.round(((totalLeitos - leitosVagos) / totalLeitos) * 100) : 0;
                    
                    return (
                      <AccordionItem key={setor.id} value={setor.id!} className="border border-border/50 rounded-lg">
                        <AccordionTrigger className="hover:no-underline px-4">
                          <div className="flex justify-between items-center w-full pr-4">
                            <div className="flex flex-col items-start">
                              <h3 className="text-lg font-semibold text-foreground">{setor.nomeSetor}</h3>
                              <p className="text-sm text-muted-foreground font-mono">{setor.siglaSetor}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-medical-primary">
                                {taxaOcupacao}%
                              </div>
                              <p className="text-xs text-muted-foreground">{leitosVagos}/{totalLeitos} Vagos</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4">
                          <SetorCard 
                            setor={setor}
                            actions={leitoActions}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                 <div className="text-center py-12"><p className="text-lg text-muted-foreground">Nenhum resultado encontrado.</p></div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <GerenciamentoModal open={modalOpen} onOpenChange={setModalOpen} />
      <MovimentacaoModal open={movimentacaoModalOpen} onOpenChange={setMovimentacaoModalOpen} pacienteNome={pacienteParaMover?.dados?.nomeCompleto || ''} onConfirm={handleConfirmarMovimentacao}/>
      <RelatorioIsolamentosModal open={relatorioIsolamentoOpen} onOpenChange={setRelatorioIsolamentoOpen}/>
      <RelatorioVagosModal open={relatorioVagosOpen} onOpenChange={setRelatorioVagosOpen}/>
      <RelatorioEspecialidadeModal
        open={relatorioEspecialidadeOpen}
        onOpenChange={setRelatorioEspecialidadeOpen}
        dadosOcupacao={dadosOcupacaoEspecialidade}
      />
      <ObservacoesModal
        open={obsModalOpen}
        onOpenChange={setObsModalOpen}
        pacienteNome={pacienteParaObs?.dadosPaciente?.nomeCompleto || ''}
        observacoes={pacienteParaObs?.dadosPaciente?.obsPaciente || []}
        onConfirm={handleConfirmObs}
        onDelete={handleDeleteObs}
      />
      <AltaPendenteModal
        open={altaPendenteModalOpen}
        onOpenChange={setAltaPendenteModalOpen}
        pacienteNome={pacienteParaAltaPendente?.nomeCompleto || ''}
        onConfirm={handleConfirmarAltaPendente}
      />
      <AltaNoLeitoModal
        open={altaNoLeitoModalOpen}
        onOpenChange={setAltaNoLeitoModalOpen}
        pacienteNome={pacienteParaAltaNoLeito?.dadosPaciente?.nomeCompleto || ''}
        onConfirm={handleConfirmarAltaNoLeito}
      />
      <InternacaoManualModal
        open={internacaoModalOpen}
        onOpenChange={setInternacaoModalOpen}
        onConfirm={handleConfirmarInternacao}
        leito={leitoParaAcao}
      />
      <ReservaExternaModal
        open={reservaModalOpen}
        onOpenChange={setReservaModalOpen}
        onConfirm={handleConfirmarReserva}
        leito={leitoParaAcao}
      />
      <ReservaOncologiaModal
        open={reservaOncologiaModalOpen}
        onOpenChange={setReservaOncologiaModalOpen}
        leitos={leitosOncologia}
        handleConfirmarReserva={handleConfirmarReserva}
        registrarTentativa={reservaOncologia.registrarTentativaContato}
        marcarComoInternado={reservaOncologia.marcarComoInternado}
        adicionarReserva={reservaOncologia.adicionarReserva}
        atualizarReserva={reservaOncologia.atualizarReserva}
        excluirReserva={reservaOncologia.excluirReserva}
        reservas={reservaOncologia.reservas}
      />
      <LimpezaPacientesModal open={limpezaModalOpen} onOpenChange={setLimpezaModalOpen} />
      <BoletimDiarioModal
        open={boletimModalOpen}
        onOpenChange={setBoletimModalOpen}
        gerarTextoBoletim={gerarTextoBoletim}
      />
    </div>
  );
};

export default MapaLeitos;
