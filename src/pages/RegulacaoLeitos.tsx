
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AcoesRapidas } from "@/components/AcoesRapidas";
import { RegulacaoModals } from "@/components/modals/regulacao/RegulacaoModals";
import { useRegulacaoLogic } from "@/hooks/useRegulacaoLogic";
import { useState } from "react";

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
  const {
    loading,
    listas,
    modals,
    handlers,
    filtrosProps,
  } = useRegulacaoLogic();

  // Estados para os novos modais de panorama
  const [panoramaSelecaoOpen, setPanoramaSelecaoOpen] = useState(false);
  const [panoramaVisualizacaoOpen, setPanoramaVisualizacaoOpen] = useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] = useState({ inicio: '', fim: '' });

  const handleAbrirPanorama = () => {
    setPanoramaSelecaoOpen(true);
  };

  const handleGerarPanorama = (dataInicio: string, dataFim: string) => {
    setPeriodoSelecionado({ inicio: dataInicio, fim: dataFim });
    setPanoramaVisualizacaoOpen(true);
  };

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
            showAllButtons={true}
            sugestoesDisponiveis={listas.sugestoesDeRegulacao.length > 0}
          />
        </header>

        {/* 2. Bloco de Indicadores */}
        <Card className="shadow-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-medical-primary">
              Indicadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">
              Funcionalidade em desenvolvimento.
            </p>
          </CardContent>
        </Card>

        {/* 3. Bloco de Filtros */}
        <FiltrosBlocoRegulacao filtrosProps={filtrosProps} />

        {/* 4. Bloco Principal: Pacientes Aguardando Regulação */}
        <PacientesAguardandoRegulacao
          listas={{
            decisaoCirurgica: listas.decisaoCirurgica,
            decisaoClinica: listas.decisaoClinica,
            recuperacaoCirurgica: listas.recuperacaoCirurgica,
            totalPendentes: listas.totalPendentes,
            pacientesJaRegulados: listas.pacientesJaRegulados
          }}
          handlers={{
            handleOpenRegulacaoModal: handlers.handleOpenRegulacaoModal,
            handleConcluir: handlers.handleConcluir,
            handleAlterar: handlers.handleAlterar,
            handleCancelar: handlers.handleCancelar,
            altaAposRecuperacao: handlers.altaAposRecuperacao,
            setResumoModalOpen: handlers.setResumoModalOpen
          }}
          filtrosProps={filtrosProps}
        />

        {/* 5. Bloco: Pacientes Regulados */}
        <PacientesReguladosBloco
          pacientesRegulados={listas.pacientesJaRegulados}
          onConcluir={handlers.handleConcluir}
          onAlterar={handlers.handleAlterar}
          onCancelar={handlers.handleCancelar}
          onVerResumo={() => handlers.setResumoModalOpen(true)}
          onAbrirPanorama={handleAbrirPanorama}
        />

        {/* 6. Bloco Agrupador: Espera por UTI e Transferências Externas */}
        <EsperaUTITransferencias
          pacientesAguardandoUTI={listas.pacientesAguardandoUTI}
          pacientesAguardandoTransferencia={listas.pacientesAguardandoTransferencia}
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
        <RemanejamentosPendentesBloco
          pacientesAguardandoRemanejamento={listas.pacientesAguardandoRemanejamento}
          onRemanejar={(paciente) => handlers.handleOpenRegulacaoModal(paciente, "normal")}
          onCancelar={handlers.handleCancelarRemanejamento}
        />

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
          onConfirmarTransferenciaExterna={handlers.handleConfirmarTransferenciaExterna}
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
          pacientesPendentes={[
            ...listas.decisaoCirurgica,
            ...listas.decisaoClinica,
            ...listas.recuperacaoCirurgica
          ]}
          pacientesRegulados={listas.pacientesJaRegulados}
          dataInicio={periodoSelecionado.inicio}
          dataFim={periodoSelecionado.fim}
        />
      </div>
    </div>
  );
};

export default RegulacaoLeitos;
