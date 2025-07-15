import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FiltrosRegulacao } from '@/components/FiltrosRegulacao';
import { useSetores } from '@/hooks/useSetores';
import { useFiltrosRegulacao } from '@/hooks/useFiltrosRegulacao';
import { Leito } from '@/types/hospital';
import { RemanejamentoPendenteItem } from '@/components/RemanejamentoPendenteItem';
import { TransferenciaPendenteItem } from '@/components/TransferenciaPendenteItem';
import { RegulacaoPendenteItem } from '@/components/RegulacaoPendenteItem';
import { Skeleton } from "@/components/ui/skeleton"

const RegulacaoLeitos = () => {
  const { 
    setores, 
    loading, 
    cancelarRegulacao, 
    concluirRegulacao, 
    confirmarRegulacao,
    cancelarPedidoRemanejamento 
  } = useSetores();

  const handleCancelarRegulacao = (paciente: any, motivo: string) => {
    cancelarRegulacao(paciente, motivo);
  };

  const handleConcluirRegulacao = (paciente: any) => {
    concluirRegulacao(paciente);
  };

  const handleConfirmarRegulacao = (paciente: any, leitoDestino: any, pacienteParaLeito: any, observacoes: string) => {
    confirmarRegulacao(paciente, pacienteParaLeito, leitoDestino, observacoes);
  };

  const handleCancelarRemanejamento = (paciente: any) => {
    cancelarPedidoRemanejamento(paciente.setorId, paciente.leitoId);
  };

  const handleRemanejarPaciente = (paciente: any) => {
    // Implementar lógica de remanejamento
    console.log('Remanejar paciente:', paciente);
  };

  const leitosAguardandoRemanejamento = setores.flatMap(setor =>
    setor.leitos.filter(leito => leito.dadosPaciente?.remanejarPaciente).map(leito => ({
      ...leito,
      setorNome: setor.nomeSetor,
      setorId: setor.id,
      siglaSetor: setor.siglaSetor
    }))
  );

  const leitosAguardandoTransferencia = setores.flatMap(setor =>
    setor.leitos.filter(leito => leito.dadosPaciente?.transferirPaciente).map(leito => ({
      ...leito,
      setorNome: setor.nomeSetor,
      setorId: setor.id,
      siglaSetor: setor.siglaSetor
    }))
  );

  const leitosAguardandoRegulacao = setores.flatMap(setor =>
    setor.leitos.filter(leito => leito.statusLeito === 'Regulado').map(leito => ({
      ...leito,
      setorNome: setor.nomeSetor,
      setorId: setor.id,
      siglaSetor: setor.siglaSetor
    }))
  );

  // Use the new filter hook for regulation patients
  const { 
    searchTerm, 
    setSearchTerm, 
    filtrosAvancados, 
    setFiltrosAvancados, 
    filteredPacientes: filteredLeitosAguardandoRegulacao, 
    resetFiltros 
  } = useFiltrosRegulacao(leitosAguardandoRegulacao.map(leito => leito.dadosPaciente).filter(Boolean));

  // Keep the old filter logic for other sections
  const [oldSearchTerm, setOldSearchTerm] = useState('');
  const [oldFiltros, setOldFiltros] = useState({
    especialidade: '',
    aguardandoUTI: false,
    remanejarPaciente: false,
    transferirPaciente: false,
    provavelAlta: false,
  });

  const filteredLeitosAguardandoRemanejamento = leitosAguardandoRemanejamento.filter(leito => {
    const searchTermLower = oldSearchTerm.toLowerCase();
    const nomePaciente = leito.dadosPaciente?.nomePaciente?.toLowerCase() || '';
    const especialidadePaciente = leito.dadosPaciente?.especialidadePaciente?.toLowerCase() || '';

    const matchesSearchTerm = nomePaciente.includes(searchTermLower) ||
      especialidadePaciente.includes(searchTermLower) ||
      leito.codigoLeito?.toLowerCase().includes(searchTermLower) ||
      leito.setorNome?.toLowerCase().includes(searchTermLower);

    const matchesFilters = (
      (!oldFiltros.especialidade || leito.dadosPaciente?.especialidadePaciente === oldFiltros.especialidade) &&
      (!oldFiltros.aguardandoUTI || leito.dadosPaciente?.aguardaUTI === oldFiltros.aguardandoUTI) &&
      (!oldFiltros.remanejarPaciente || leito.dadosPaciente?.remanejarPaciente === oldFiltros.remanejarPaciente) &&
      (!oldFiltros.transferirPaciente || leito.dadosPaciente?.transferirPaciente === oldFiltros.transferirPaciente) &&
      (!oldFiltros.provavelAlta || leito.dadosPaciente?.provavelAlta === oldFiltros.provavelAlta)
    );

    return matchesSearchTerm && matchesFilters;
  });

  const filteredLeitosAguardandoTransferencia = leitosAguardandoTransferencia.filter(leito => {
    const searchTermLower = oldSearchTerm.toLowerCase();
    const nomePaciente = leito.dadosPaciente?.nomePaciente?.toLowerCase() || '';
    const especialidadePaciente = leito.dadosPaciente?.especialidadePaciente?.toLowerCase() || '';

    const matchesSearchTerm = nomePaciente.includes(searchTermLower) ||
      especialidadePaciente.includes(searchTermLower) ||
      leito.codigoLeito?.toLowerCase().includes(searchTermLower) ||
      leito.setorNome?.toLowerCase().includes(searchTermLower);

    const matchesFilters = (
      (!oldFiltros.especialidade || leito.dadosPaciente?.especialidadePaciente === oldFiltros.especialidade) &&
      (!oldFiltros.aguardandoUTI || leito.dadosPaciente?.aguardaUTI === oldFiltros.aguardandoUTI) &&
      (!oldFiltros.remanejarPaciente || leito.dadosPaciente?.remanejarPaciente === oldFiltros.remanejarPaciente) &&
      (!oldFiltros.transferirPaciente || leito.dadosPaciente?.transferirPaciente === oldFiltros.transferirPaciente) &&
      (!oldFiltros.provavelAlta || leito.dadosPaciente?.provavelAlta === oldFiltros.provavelAlta)
    );

    return matchesSearchTerm && matchesFilters;
  });

  const resetOldFiltros = () => {
    setOldFiltros({
      especialidade: '',
      aguardandoUTI: false,
      remanejarPaciente: false,
      transferirPaciente: false,
      provavelAlta: false,
    });
    setOldSearchTerm('');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4 text-medical-primary">Regulação de Leitos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Input
          type="text"
          placeholder="Buscar por nome, especialidade, leito ou setor..."
          value={oldSearchTerm}
          onChange={(e) => setOldSearchTerm(e.target.value)}
        />
        <Button onClick={resetOldFiltros}>Limpar Filtros</Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold">Remanejamentos Pendentes</h2>
            {loading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredLeitosAguardandoRemanejamento.length > 0 ? (
              filteredLeitosAguardandoRemanejamento.map((paciente: any) => (
                <RemanejamentoPendenteItem 
                  key={`${paciente.setorId}-${paciente.leitoId}`} 
                  paciente={paciente} 
                  onRemanejar={handleRemanejarPaciente}
                  onCancelar={handleCancelarRemanejamento} 
                />
              ))
            ) : (
              <p className="text-muted-foreground">Nenhum remanejamento pendente.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold">Transferências Externas Pendentes</h2>
            {loading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredLeitosAguardandoTransferencia.length > 0 ? (
              filteredLeitosAguardandoTransferencia.map((paciente: any) => (
                <TransferenciaPendenteItem key={`${paciente.setorId}-${paciente.leitoId}`} paciente={paciente} />
              ))
            ) : (
              <p className="text-muted-foreground">Nenhuma transferência pendente.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold">Leitos Regulados Aguardando Liberação</h2>
            
            <FiltrosRegulacao
              filtros={filtrosAvancados}
              setFiltros={setFiltrosAvancados}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              resetFiltros={resetFiltros}
            />

            {loading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredLeitosAguardandoRegulacao.length > 0 ? (
              leitosAguardandoRegulacao
                .filter(leito => filteredLeitosAguardandoRegulacao.includes(leito.dadosPaciente))
                .map((paciente: any) => (
                  <RegulacaoPendenteItem
                    key={`${paciente.setorId}-${paciente.leitoId}`}
                    paciente={paciente}
                    onCancelar={handleCancelarRegulacao}
                    onConcluir={handleConcluirRegulacao}
                    onConfirmar={handleConfirmarRegulacao}
                  />
                ))
            ) : (
              <p className="text-muted-foreground">Nenhum leito regulado aguardando liberação.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegulacaoLeitos;
