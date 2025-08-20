import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AcoesRapidas } from "@/components/AcoesRapidas";
import { RegulacaoModals } from "@/components/modals/regulacao/RegulacaoModals";
import { useRegulacaoLogic } from "@/hooks/useRegulacaoLogic";
import { useState } from "react";
import { useRegulacoes } from "@/hooks/useRegulacoes";
import { IndicadoresRegulacao } from "@/components/IndicadoresRegulacao";
// Importações necessárias para o cálculo
import { differenceInMinutes, isValid, parse } from 'date-fns'; 
import { useMemo } from "react";

// Componentes atualizados
import { FiltrosBlocoRegulacao } from "@/components/FiltrosBlocoRegulacao";
import { PacientesAguardandoRegulacao } from "@/components/PacientesAguardandoRegulacao";
import { PacientesReguladosBloco } from "@/components/PacientesReguladosBloco";
import { EsperaUTITransferencias } from "@/components/EsperaUTITransferencias";
import { CirurgiasEletivasBloco } from "@/components/CirurgiasEletivasBloco";
import { RemanejamentosPendentesBloco } from "@/components/RemanejamentosPendentesBloco";

// Novos modals
import { PanoramaSelecaoPeriodoModal } from "@/components/modals/PanoramaSelecaoPeriodoModal";
import { PanoramaVisualizacaoModal } from "@/components/modals/PanoramaVisualizacaoModal";

const RegulacaoLeitos = () => {
  const { loading, listas, modals, handlers, filtrosProps } = useRegulacaoLogic();
  const { regulacoes, loading: regulacoesLoading } = useRegulacoes();

  // Estados para os novos modais de panorama
  const [panoramaSelecaoOpen, setPanoramaSelecaoOpen] = useState(false);
  const [panoramaVisualizacaoOpen, setPanoramaVisualizacaoOpen] =
    useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] = useState({
    inicio: "",
    fim: "",
  });

  const handleAbrirPanorama = () => {
    setPanoramaSelecaoOpen(true);
  };

  const handleGerarPanorama = (dataInicio: string, dataFim: string) => {
    setPeriodoSelecionado({ inicio: dataInicio, fim: dataFim });
    setPanoramaVisualizacaoOpen(true);
  };

  // Substitua todo este bloco 'useMemo' pelo novo código
  const indicadores = useMemo(() => {
    const agora = new Date();

    // --- INÍCIO DA LÓGICA ATUALIZADA ---

    // 1. Foco nos pacientes corretos
    const pacientesNoPs = [
      ...listas.decisaoCirurgica,
      ...listas.decisaoClinica,
    ];

    let tempoMedioInternacao = "0d 0h 0m";

    if (pacientesNoPs.length > 0) {
      // 2. Cálculo do total de minutos de espera
      const totalMinutos = pacientesNoPs.reduce((acc, p) => {
        // Garante que a data de internação seja lida corretamente
        const dataInicioEspera = parse(p.dataInternacao, 'dd/MM/yyyy HH:mm', new Date());
        if (isValid(dataInicioEspera)) {
          const diff = differenceInMinutes(agora, dataInicioEspera);
          // Adiciona ao total apenas se a diferença for positiva
          return acc + (diff > 0 ? diff : 0);
        }
        return acc;
      }, 0);

      // 3. Cálculo da média
      const mediaMinutos = totalMinutos / pacientesNoPs.length;

      // 4. Formatação do resultado
      if (!isNaN(mediaMinutos) && mediaMinutos > 0) {
        const dias = Math.floor(mediaMinutos / 1440);
        const horas = Math.floor((mediaMinutos % 1440) / 60);
        const minutos = Math.floor(mediaMinutos % 60);
        tempoMedioInternacao = `${dias}d ${horas}h ${minutos}m`;
      }
    }
    
    // --- FIM DA LÓGICA ATUALIZADA ---

    const aguardandoLeito = listas.decisaoCirurgica.length + listas.decisaoClinica.length;

    const contagemStatus = {
      Pendentes: regulacoes.filter(r => r.status === 'Pendente').length,
      Concluidas: regulacoes.filter(r => r.status === 'Concluída').length,
      Canceladas: regulacoes.filter(r => r.status === 'Cancelada').length,
      Alteradas: regulacoes.filter(r => r.historicoEventos.some(e => e.evento === 'alterada')).length,
    };
    
    let tempoMedioRegulacaoPendente = "N/A";
    const regulacoesPendentes = regulacoes.filter(r => r.status === 'Pendente');
    if (regulacoesPendentes.length > 0) {
      const totalMinutosPendentes = regulacoesPendentes.reduce((acc, r) => acc + differenceInMinutes(new Date(), new Date(r.criadaEm)), 0);
      const mediaMinutosPendentes = totalMinutosPendentes / regulacoesPendentes.length;
      const horas = Math.floor(mediaMinutosPendentes / 60);
      const minutos = Math.floor(mediaMinutosPendentes % 60);
      tempoMedioRegulacaoPendente = `${horas}h ${minutos}m`;
    }

    const getTopComContagem = (arr: string[]) => {
      if (!arr.length) return { nome: 'N/A', contagem: 0 };
      const contagens = arr.reduce((acc, val) => ({ ...acc, [val]: (acc[val] || 0) + 1 }), {} as Record<string, number>);
      const [nome, contagem] = Object.entries(contagens).sort((a, b) => b[1] - a[1])[0];
      return { nome, contagem };
    };
    
    const topOrigem = getTopComContagem(regulacoes.map(r => r.setorOrigemNome));
    const topDestino = getTopComContagem(regulacoes.map(r => r.setorDestinoNome));
    
    const turnos = regulacoes.map(r => {
      const hora = new Date(r.criadaEm).getHours() + new Date(r.criadaEm).getMinutes() / 60;
      if (hora >= 6.5 && hora < 12.5) return 'Manhã';
      if (hora >= 12.5 && hora < 18.5) return 'Tarde';
      return 'Noite';
    });
    const topTurno = getTopComContagem(turnos);

    return { 
      aguardandoLeito, 
      tempoMedioInternacao, 
      contagemStatus, 
      tempoMedioRegulacaoPendente, 
      topOrigem, 
      topDestino, 
      topTurno 
    };
  }, [listas, regulacoes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4"></div>
            <div className="h-4 bg-muted rounded w-96 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 1. Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-medical-primary">
              Central de Regulação
            </h1>
            <p className="text-muted-foreground">
              Visão geral e controle das solicitações e pendências de leitos.
            </p>
          </div>
          <AcoesRapidas
            onImportarClick={() => handlers.setImportModalOpen(true)}
            onPassagemClick={handlers.handlePassagemPlantao}
            onSugestoesClick={handlers.handleAbrirSugestoes}
            onPanoramaClick={handleAbrirPanorama}
            showAllButtons={true}
            sugestoesDisponiveis={listas.sugestoesDeRegulacao.length > 0}
            panoramaDisponivel={true}
          />
        </header>

        {/* 2. Bloco de Indicadores */}
        <IndicadoresRegulacao indicadores={indicadores} />

        {/* 3. Bloco de Filtros */}
        <FiltrosBlocoRegulacao filtrosProps={filtrosProps} />

        {/* 4. Bloco Principal: Pacientes Aguardando Regulação */}
        <PacientesAguardandoRegulacao
          listas={{
            decisaoCirurgica: listas.decisaoCirurgica,
            decisaoClinica: listas.decisaoClinica,
            recuperacaoCirurgica: listas.recuperacaoCirurgica,
            totalPendentes: listas.totalPendentes,
            pacientesJaRegulados: listas.pacientesJaRegulados,
          }}
          handlers={{
            handleOpenRegulacaoModal: handlers.handleOpenRegulacaoModal,
            handleConcluir: handlers.handleConcluir,
            handleAlterar: handlers.handleAlterar,
            handleCancelar: handlers.handleCancelar,
            altaAposRecuperacao: handlers.altaAposRecuperacao,
            setResumoModalOpen: handlers.setResumoModalOpen,
            handleAltaDireta: handlers.handleAltaDireta,
          }}
          filtrosProps={{
            sortConfig: filtrosProps.sortConfig,
          }}
          actingOnPatientId={modals.actingOnPatientId}
        />

        {/* 5. Bloco: Pacientes Regulados */}
        <PacientesReguladosBloco
          pacientesRegulados={listas.pacientesJaRegulados}
          onConcluir={handlers.handleConcluir}
          onAlterar={handlers.handleAlterar}
          onCancelar={handlers.handleCancelar}
          onVerResumo={() => handlers.setResumoModalOpen(true)}
          actingOnPatientId={modals.actingOnPatientId}
        />

        {/* 6. Bloco Agrupador: Espera por UTI e Transferências Externas */}
        <EsperaUTITransferencias
          pacientesAguardandoUTI={listas.pacientesAguardandoUTI}
          pacientesAguardandoTransferencia={
            listas.pacientesAguardandoTransferencia
          }
          onCancelarUTI={handlers.cancelarPedidoUTI}
          onTransferirExterna={handlers.handleIniciarTransferenciaExterna}
          onRegularUTI={(p) => handlers.handleOpenRegulacaoModal(p, "uti")}
          onGerenciarTransferencia={handlers.handleGerenciarTransferencia}
        />

        {/* 7. Bloco: Pacientes Aguardando Cirurgia Eletiva */}
        <CirurgiasEletivasBloco
          cirurgias={listas.cirurgias}
          onAlocarCirurgia={handlers.handleAlocarLeitoCirurgia}
        />

        {/* 8. Bloco: Remanejamentos Pendentes */}
        {listas.pacientesAguardandoRemanejamento.length > 0 && (
          <RemanejamentosPendentesBloco
            pacientesAguardandoRemanejamento={
              listas.pacientesAguardandoRemanejamento
            }
            onRemanejar={(paciente) =>
              handlers.handleOpenRegulacaoModal(paciente, "normal")
            }
            onCancelar={handlers.handleCancelarRemanejamento}
          />
        )}

        {/* Modais */}
        <RegulacaoModals
          importModalOpen={modals.importModalOpen}
          regulacaoModalOpen={modals.regulacaoModalOpen}
          cancelamentoModalOpen={modals.cancelamentoModalOpen}
          transferenciaModalOpen={modals.transferenciaModalOpen}
          alocacaoCirurgiaModalOpen={modals.alocacaoCirurgiaModalOpen}
          gerenciarTransferenciaOpen={modals.gerenciarTransferenciaOpen}
          resumoModalOpen={modals.resumoModalOpen}
          sugestoesModalOpen={modals.sugestoesModalOpen}
          pacienteParaRegular={modals.pacienteParaRegular}
          pacienteParaAcao={modals.pacienteParaAcao}
          cirurgiaParaAlocar={modals.cirurgiaParaAlocar}
          isAlteracaoMode={modals.isAlteracaoMode}
          validationResult={modals.validationResult}
          syncSummary={modals.syncSummary}
          modoRegulacao={modals.modoRegulacao}
          processing={loading}
          isSyncing={loading}
          pacientesRegulados={listas.pacientesJaRegulados}
          sugestoes={listas.sugestoesDeRegulacao}
          totalPendentes={listas.totalPendentes}
          onProcessFileRequest={handlers.handleProcessFileRequest}
          onConfirmSync={handlers.handleConfirmSync}
          onConfirmarRegulacao={handlers.handleConfirmarRegulacao}
          onConfirmarCancelamento={handlers.onConfirmarCancelamento}
          onConfirmarTransferenciaExterna={
            handlers.handleConfirmarTransferenciaExterna
          }
          onConfirmarAlocacaoCirurgia={handlers.handleConfirmarAlocacaoCirurgia}
          setImportModalOpen={handlers.setImportModalOpen}
          setRegulacaoModalOpen={handlers.setRegulacaoModalOpen}
          setCancelamentoModalOpen={handlers.setCancelamentoModalOpen}
          setTransferenciaModalOpen={handlers.setTransferenciaModalOpen}
          setAlocacaoCirurgiaModalOpen={handlers.setAlocacaoCirurgiaModalOpen}
          setGerenciarTransferenciaOpen={handlers.setGerenciarTransferenciaOpen}
          setResumoModalOpen={handlers.setResumoModalOpen}
          setSugestoesModalOpen={handlers.setSugestoesModalOpen}
        />

        {/* Novos Modais de Panorama */}
        <PanoramaSelecaoPeriodoModal
          open={panoramaSelecaoOpen}
          onOpenChange={setPanoramaSelecaoOpen}
          onGerarPanorama={handleGerarPanorama}
        />

        <PanoramaVisualizacaoModal
          open={panoramaVisualizacaoOpen}
          onOpenChange={setPanoramaVisualizacaoOpen}
          pacientesRegulados={listas.pacientesJaRegulados}
          dataInicio={periodoSelecionado.inicio}
          dataFim={periodoSelecionado.fim}
        />
      </div>
    </div>
  );
};

export default RegulacaoLeitos;