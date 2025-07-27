
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiltrosRegulacao } from "@/components/FiltrosRegulacao";
import { RemanejamentoPendenteItem } from "@/components/RemanejamentoPendenteItem";
import { PacienteReguladoItem } from "@/components/PacienteReguladoItem";
import { ListaPacientesPendentes } from "@/components/ListaPacientesPendentes";
import { AcoesRapidas } from "@/components/AcoesRapidas";
import { ListasLaterais } from "@/components/ListasLaterais";
import { RegulacaoModals } from "@/components/modals/regulacao/RegulacaoModals";
import { useRegulacaoLogic } from "@/hooks/useRegulacaoLogic";

const RegulacaoLeitos = () => {
  const {
    loading,
    listas,
    modals,
    handlers,
    filtrosProps,
  } = useRegulacaoLogic();

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

        {/* Filtros movidos para cá - agora bloco independente */}
        <Card className="shadow-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-medical-primary">
              Filtros de Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FiltrosRegulacao
              filtrosAvancados={filtrosProps.filtrosAvancados}
              setFiltrosAvancados={filtrosProps.setFiltrosAvancados}
              searchTerm={filtrosProps.searchTerm}
              setSearchTerm={filtrosProps.setSearchTerm}
              resetFiltros={filtrosProps.resetFiltros}
              sortConfig={filtrosProps.sortConfig}
              setSortConfig={filtrosProps.setSortConfig}
            />
          </CardContent>
        </Card>

        {/* Bloco principal de Pacientes Aguardando Regulação */}
        <Card className="shadow-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-medical-primary flex items-center gap-2">
              Pacientes Aguardando Regulação
              <Badge>{listas.totalPendentes}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ListaPacientesPendentes
                titulo="Decisão Cirúrgica"
                pacientes={listas.decisaoCirurgica}
                onRegularClick={handlers.handleOpenRegulacaoModal}
                onConcluir={handlers.handleConcluir}
                onAlterar={handlers.handleAlterar}
                onCancelar={handlers.handleCancelar}
                onAlta={(leitoId) => handlers.altaAposRecuperacao(leitoId)}
              />
              <ListaPacientesPendentes
                titulo="Decisão Clínica"
                pacientes={listas.decisaoClinica}
                onRegularClick={handlers.handleOpenRegulacaoModal}
                onConcluir={handlers.handleConcluir}
                onAlterar={handlers.handleAlterar}
                onCancelar={handlers.handleCancelar}
                onAlta={(leitoId) => handlers.altaAposRecuperacao(leitoId)}
              />
              <ListaPacientesPendentes
                titulo="Recuperação Cirúrgica"
                pacientes={listas.recuperacaoCirurgica}
                onRegularClick={handlers.handleOpenRegulacaoModal}
                onAlta={(leitoId) => handlers.altaAposRecuperacao(leitoId)}
                onConcluir={handlers.handleConcluir}
                onAlterar={handlers.handleAlterar}
                onCancelar={handlers.handleCancelar}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bloco de Pacientes Regulados - agora separado */}
        {listas.pacientesJaRegulados.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="regulados" className="border rounded-lg bg-card shadow-card">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    Pacientes Regulados
                  </h3>
                  <Badge variant="secondary">
                    {listas.pacientesJaRegulados.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex justify-between items-center mb-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlers.setResumoModalOpen(true)}
                  >
                    Ver Resumo
                  </Button>
                </div>
                <div className="space-y-2">
                  {listas.pacientesJaRegulados.map((paciente) => (
                    <PacienteReguladoItem
                      key={paciente.id}
                      paciente={paciente}
                      onConcluir={handlers.handleConcluir}
                      onAlterar={handlers.handleAlterar}
                      onCancelar={handlers.handleCancelar}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Bloco Aguardando UTI - linha exclusiva */}
        {listas.pacientesAguardandoUTI.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="uti" className="border rounded-lg bg-card shadow-card">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    Aguardando UTI
                  </h3>
                  <Badge variant="destructive">
                    {listas.pacientesAguardandoUTI.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ListasLaterais
                  pacientesAguardandoUTI={listas.pacientesAguardandoUTI}
                  pacientesAguardandoTransferencia={[]}
                  cirurgias={[]}
                  onCancelarUTI={handlers.cancelarPedidoUTI}
                  onTransferirExterna={handlers.handleIniciarTransferenciaExterna}
                  onRegularUTI={(p) => handlers.handleOpenRegulacaoModal(p, "uti")}
                  onGerenciarTransferencia={handlers.handleGerenciarTransferencia}
                  onAlocarCirurgia={handlers.handleAlocarLeitoCirurgia}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Bloco Aguardando Transferência - linha exclusiva */}
        {listas.pacientesAguardandoTransferencia.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="transferencia" className="border rounded-lg bg-card shadow-card">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    Aguardando Transferência
                  </h3>
                  <Badge variant="destructive">
                    {listas.pacientesAguardandoTransferencia.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ListasLaterais
                  pacientesAguardandoUTI={[]}
                  pacientesAguardandoTransferencia={listas.pacientesAguardandoTransferencia}
                  cirurgias={[]}
                  onCancelarUTI={handlers.cancelarPedidoUTI}
                  onTransferirExterna={handlers.handleIniciarTransferenciaExterna}
                  onRegularUTI={(p) => handlers.handleOpenRegulacaoModal(p, "uti")}
                  onGerenciarTransferencia={handlers.handleGerenciarTransferencia}
                  onAlocarCirurgia={handlers.handleAlocarLeitoCirurgia}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Bloco Cirurgia Eletiva - linha exclusiva */}
        {listas.cirurgias.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="cirurgia" className="border rounded-lg bg-card shadow-card">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    Aguardando Cirurgia Eletiva
                  </h3>
                  <Badge variant="destructive">
                    {listas.cirurgias.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ListasLaterais
                  pacientesAguardandoUTI={[]}
                  pacientesAguardandoTransferencia={[]}
                  cirurgias={listas.cirurgias}
                  onCancelarUTI={handlers.cancelarPedidoUTI}
                  onTransferirExterna={handlers.handleIniciarTransferenciaExterna}
                  onRegularUTI={(p) => handlers.handleOpenRegulacaoModal(p, "uti")}
                  onGerenciarTransferencia={handlers.handleGerenciarTransferencia}
                  onAlocarCirurgia={handlers.handleAlocarLeitoCirurgia}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Bloco Remanejamentos Pendentes */}
        {listas.pacientesAguardandoRemanejamento.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="remanejamento" className="border rounded-lg bg-card shadow-card">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    REMANEJAMENTOS PENDENTES
                  </h3>
                  <Badge variant="destructive">
                    {listas.pacientesAguardandoRemanejamento.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2">
                  {listas.pacientesAguardandoRemanejamento.map((paciente) => (
                    <RemanejamentoPendenteItem
                      key={paciente.id}
                      paciente={paciente}
                      onRemanejar={() =>
                        handlers.handleOpenRegulacaoModal(paciente, "normal")
                      }
                      onCancelar={() => handlers.handleCancelarRemanejamento(paciente)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

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
      </div>
    </div>
  );
};

export default RegulacaoLeitos;
