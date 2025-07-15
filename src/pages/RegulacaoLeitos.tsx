
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, BedDouble, ClipboardList, LogOut, MessageSquarePlus, Settings, ShieldQuestion } from 'lucide-react';
import { useSetores } from '@/hooks/useSetores';
import { RegulacaoModal } from '@/components/modals/RegulacaoModal';
import { AguardandoUTIItem } from '@/components/AguardandoUTIItem';
import { AguardandoTransferenciaItem } from '@/components/AguardandoTransferenciaItem';
import { PacientePendenteItem } from '@/components/PacientePendenteItem';
import { RemanejamentoPendenteItem } from '@/components/RemanejamentoPendenteItem';
import { DadosPaciente, SolicitacaoCirurgica } from '@/types/hospital';
import { CancelamentoModal } from '@/components/modals/CancelamentoModal';
import { PacienteReguladoItem } from '@/components/PacienteReguladoItem';
import { ResumoRegulacoesModal } from '@/components/modals/ResumoRegulacoesModal';
import { GerenciarTransferenciaModal } from '@/components/modals/GerenciarTransferenciaModal';
import { useCirurgiasEletivas } from '@/hooks/useCirurgiasEletivas';
import { CirurgiaEletivaItem } from '@/components/CirurgiaEletivaItem';
import { useFiltrosRegulacao } from '@/hooks/useFiltrosRegulacao';
import { FiltrosRegulacao } from '@/components/FiltrosRegulacao';
import { TransferenciaPendenteItem } from '@/components/TransferenciaPendenteItem';
import { RegulacaoPendenteItem } from '@/components/RegulacaoPendenteItem';

const RegulacaoLeitos = () => {
  // ESTADO E HOOKS (TODOS NECESSÁRIOS)
  const { 
    setores, 
    loading: setoresLoading, 
    cancelarPedidoUTI, 
    cancelarTransferencia, 
    altaAposRecuperacao, 
    confirmarRegulacao, 
    concluirRegulacao, 
    cancelarRegulacao,
    cancelarPedidoRemanejamento 
  } = useSetores();
  
  const { cirurgias, loading: cirurgiasLoading } = useCirurgiasEletivas();

  const [regulacaoModalOpen, setRegulacaoModalOpen] = useState(false);
  const [cancelamentoModalOpen, setCancelamentoModalOpen] = useState(false);
  const [pacienteParaRegular, setPacienteParaRegular] = useState<any | null>(null);
  const [pacienteParaAcao, setPacienteParaAcao] = useState<any | null>(null);
  const [isAlteracaoMode, setIsAlteracaoMode] = useState(false);
  const [modoRegulacao, setModoRegulacao] = useState<'normal' | 'uti' | 'remanejamento'>('normal');
  const [resumoModalOpen, setResumoModalOpen] = useState(false);
  const [gerenciarTransferenciaOpen, setGerenciarTransferenciaOpen] = useState(false);

  // LÓGICA DE DADOS (TODA NECESSÁRIA)
  const todosPacientesPendentes = setores.flatMap(setor =>
    setor.leitos
      .filter(leito => leito.dadosPaciente && leito.statusLeito === 'Ocupado')
      .map(leito => ({
        ...leito.dadosPaciente,
        setorId: setor.id,
        leitoId: leito.id,
        setorOrigem: setor.nomeSetor,
        siglaSetorOrigem: setor.siglaSetor,
        leitoCodigo: leito.codigoLeito,
        statusLeito: leito.statusLeito,
        regulacao: leito.regulacao
      }))
  );

  const pacientesAguardandoRegulacao = todosPacientesPendentes.filter(p => p.statusLeito === 'Ocupado');
  const pacientesJaRegulados = setores.flatMap(setor =>
    setor.leitos
      .filter(leito => leito.statusLeito === 'Regulado')
      .map(leito => ({
        ...leito.dadosPaciente,
        setorId: setor.id,
        leitoId: leito.id,
        setorOrigem: setor.nomeSetor,
        siglaSetorOrigem: setor.siglaSetor,
        leitoCodigo: leito.codigoLeito,
        statusLeito: leito.statusLeito,
        regulacao: leito.regulacao
      }))
  );

  const { searchTerm, setSearchTerm, filtrosAvancados, setFiltrosAvancados, filteredPacientes, resetFiltros } = useFiltrosRegulacao(pacientesAguardandoRegulacao);

  const decisaoCirurgica = filteredPacientes.filter(p => p.setorOrigem === "PS DECISÃO CIRURGICA");
  const decisaoClinica = filteredPacientes.filter(p => p.setorOrigem === "PS DECISÃO CLINICA");
  const recuperacaoCirurgica = filteredPacientes.filter(p => p.setorOrigem === "CC - RECUPERAÇÃO");
  const totalPendentes = filteredPacientes.length;

  const pacientesAguardandoUTI = todosPacientesPendentes.filter(p => p.aguardaUTI);
  const pacientesAguardandoTransferencia = todosPacientesPendentes.filter(p => p.transferirPaciente);
  const pacientesAguardandoRemanejamento = todosPacientesPendentes.filter(p => p.remanejarPaciente);

  // HANDLERS (TODOS NECESSÁRIOS)
  const handleConcluir = (paciente: any) => concluirRegulacao(paciente);
  
  const handleAlterar = (paciente: any) => {
    setPacienteParaRegular(paciente);
    setIsAlteracaoMode(true);
    setModoRegulacao('normal');
    setRegulacaoModalOpen(true);
  };

  const handleCancelar = (paciente: any) => {
    setPacienteParaAcao(paciente);
    setCancelamentoModalOpen(true);
  };

  const onConfirmarCancelamento = (motivo: string) => {
    if (pacienteParaAcao) {
      cancelarRegulacao(pacienteParaAcao, motivo);
    }
    setCancelamentoModalOpen(false);
    setPacienteParaAcao(null);
  };

  const handleOpenRegulacaoModal = (paciente: any, modo: 'normal' | 'uti' = 'normal') => {
    setPacienteParaRegular(paciente);
    setModoRegulacao(modo);
    setIsAlteracaoMode(false);
    setRegulacaoModalOpen(true);
  };

  const handleOpenRemanejamentoModal = (paciente: any) => {
    setPacienteParaRegular(paciente);
    setModoRegulacao('remanejamento');
    setIsAlteracaoMode(false);
    setRegulacaoModalOpen(true);
  };

  const handleCancelarRemanejamento = (paciente: any) => {
    cancelarPedidoRemanejamento(paciente.setorId, paciente.leitoId);
  };

  const handleConfirmarRegulacao = async (leitoDestino: any, observacoes: string, motivoAlteracao?: string) => {
    if (pacienteParaRegular) {
      await confirmarRegulacao(pacienteParaRegular, pacienteParaRegular, leitoDestino, observacoes);
    }
    setRegulacaoModalOpen(false);
    setPacienteParaRegular(null);
    setIsAlteracaoMode(false);
  };

  const handleGerenciarTransferencia = (paciente: any) => {
    setPacienteParaAcao(paciente);
    setGerenciarTransferenciaOpen(true);
  };

  const handleAlocarLeitoCirurgia = (cirurgia: SolicitacaoCirurgica) => {
    console.log('Alocar leito para cirurgia:', cirurgia);
  };

  // JSX DE RETORNO - ESTRUTURA CORRETA
  return (
    <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* TÍTULO */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-medical-primary">Central de Regulação</h1>
          <p className="text-muted-foreground">Visão geral e controle das solicitações e pendências de leitos.</p>
        </header>

        {/* INDICADORES */}
        <Card className="shadow-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-medical-primary">Indicadores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">Funcionalidade em desenvolvimento.</p>
          </CardContent>
        </Card>

        {/* FILTROS E AÇÕES RÁPIDAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-full shadow-card border border-border/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground italic text-center md:text-left">Área destinada aos filtros de busca (em desenvolvimento).</p>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="h-full shadow-card border border-border/50">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    onClick={() => setResumoModalOpen(true)} 
                    className="w-full justify-start" 
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Resumo de Regulações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CARDS DE STATUS RÁPIDOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pacientesAguardandoUTI.length > 0 && (
            <Card className="shadow-card border border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-red-600">Aguardando UTI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{pacientesAguardandoUTI.length}</div>
                <p className="text-sm text-muted-foreground">pacientes na fila</p>
              </CardContent>
            </Card>
          )}
          
          {pacientesAguardandoTransferencia.length > 0 && (
            <Card className="shadow-card border border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-600">Transferências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{pacientesAguardandoTransferencia.length}</div>
                <p className="text-sm text-muted-foreground">pendentes</p>
              </CardContent>
            </Card>
          )}
          
          {cirurgias.length > 0 && (
            <Card className="shadow-card border border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-green-600">Cirurgias Eletivas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{cirurgias.length}</div>
                <p className="text-sm text-muted-foreground">hoje/amanhã</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ACCORDION PRINCIPAL */}
        <Accordion type="multiple" className="w-full space-y-4">
          {/* BLOCO DE PACIENTES AGUARDANDO REGULAÇÃO */}
          <AccordionItem value="item-1" className="border rounded-lg bg-card shadow-card">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">Pacientes Aguardando Regulação</h3>
                <Badge>{totalPendentes}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-6">
              <FiltrosRegulacao
                filtros={filtrosAvancados}
                setFiltros={setFiltrosAvancados}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                resetFiltros={resetFiltros}
              />
              
              {/* Cards por Setor */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {decisaoCirurgica.length > 0 && (
                  <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">PS Decisão Cirúrgica</CardTitle>
                      <Badge variant="destructive">{decisaoCirurgica.length}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {decisaoCirurgica.map((paciente) => (
                        <PacientePendenteItem
                          key={`${paciente.setorId}-${paciente.leitoId}`}
                          paciente={paciente}
                          onRegular={() => handleOpenRegulacaoModal(paciente)}
                          onSolicitarUTI={() => handleOpenRegulacaoModal(paciente, 'uti')}
                        />
                      ))}
                    </CardContent>
                  </Card>
                )}

                {decisaoClinica.length > 0 && (
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">PS Decisão Clínica</CardTitle>
                      <Badge variant="secondary">{decisaoClinica.length}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {decisaoClinica.map((paciente) => (
                        <PacientePendenteItem
                          key={`${paciente.setorId}-${paciente.leitoId}`}
                          paciente={paciente}
                          onRegular={() => handleOpenRegulacaoModal(paciente)}
                          onSolicitarUTI={() => handleOpenRegulacaoModal(paciente, 'uti')}
                        />
                      ))}
                    </CardContent>
                  </Card>
                )}

                {recuperacaoCirurgica.length > 0 && (
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">CC - Recuperação</CardTitle>
                      <Badge variant="outline">{recuperacaoCirurgica.length}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {recuperacaoCirurgica.map((paciente) => (
                        <PacientePendenteItem
                          key={`${paciente.setorId}-${paciente.leitoId}`}
                          paciente={paciente}
                          onRegular={() => handleOpenRegulacaoModal(paciente)}
                          onSolicitarUTI={() => handleOpenRegulacaoModal(paciente, 'uti')}
                        />
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Pacientes Regulados */}
              {pacientesJaRegulados.length > 0 && (
                <Card className="border-l-4 border-l-amber-500">
                  <CardHeader>
                    <CardTitle className="text-lg">Pacientes Regulados Aguardando Transferência</CardTitle>
                    <Badge variant="outline">{pacientesJaRegulados.length}</Badge>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {pacientesJaRegulados.map((paciente) => (
                          <RegulacaoPendenteItem
                            key={`${paciente.setorId}-${paciente.leitoId}`}
                            paciente={paciente}
                            onCancelar={handleCancelar}
                            onConcluir={handleConcluir}
                            onConfirmar={handleConfirmarRegulacao}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* BLOCO DE REMANEJAMENTOS PENDENTES */}
          {pacientesAguardandoRemanejamento.length > 0 && (
            <AccordionItem value="item-2" className="border rounded-lg bg-card shadow-card">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Remanejamentos Pendentes</h3>
                  <Badge variant="outline">{pacientesAguardandoRemanejamento.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2">
                  {pacientesAguardandoRemanejamento.map((paciente) => (
                    <RemanejamentoPendenteItem
                      key={`${paciente.setorId}-${paciente.leitoId}`}
                      paciente={paciente}
                      onRemanejar={() => handleOpenRemanejamentoModal(paciente)}
                      onCancelar={handleCancelarRemanejamento}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* BLOCO DE TRANSFERÊNCIAS PENDENTES */}
          {pacientesAguardandoTransferencia.length > 0 && (
            <AccordionItem value="item-3" className="border rounded-lg bg-card shadow-card">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Transferências Pendentes</h3>
                  <Badge variant="outline">{pacientesAguardandoTransferencia.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2">
                  {pacientesAguardandoTransferencia.map((paciente) => (
                    <TransferenciaPendenteItem
                      key={`${paciente.setorId}-${paciente.leitoId}`}
                      paciente={paciente}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* MODAIS */}
        <RegulacaoModal
          open={regulacaoModalOpen}
          onOpenChange={setRegulacaoModalOpen}
          paciente={pacienteParaRegular}
          origem={{
            setor: pacienteParaRegular?.setorOrigem || '',
            leito: pacienteParaRegular?.leitoCodigo || ''
          }}
          onConfirmRegulacao={handleConfirmarRegulacao}
          isAlteracao={isAlteracaoMode}
          modo={modoRegulacao}
        />

        <CancelamentoModal
          open={cancelamentoModalOpen}
          onOpenChange={setCancelamentoModalOpen}
          onConfirm={onConfirmarCancelamento}
          paciente={pacienteParaAcao}
        />

        <ResumoRegulacoesModal
          open={resumoModalOpen}
          onOpenChange={setResumoModalOpen}
          pacientesRegulados={pacientesJaRegulados}
        />

        <GerenciarTransferenciaModal
          open={gerenciarTransferenciaOpen}
          onOpenChange={setGerenciarTransferenciaOpen}
          paciente={pacienteParaAcao}
        />

      </div>
    </div>
  );
};

export default RegulacaoLeitos;
