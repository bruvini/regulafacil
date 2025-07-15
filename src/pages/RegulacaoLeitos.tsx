import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FiltrosRegulacao } from '@/components/FiltrosRegulacao';
import { useSetores } from '@/hooks/useSetores';
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
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState({
    especialidade: '',
    aguardandoUTI: false,
    remanejarPaciente: false,
    transferirPaciente: false,
    provavelAlta: false,
  });

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

  const filteredLeitosAguardandoRemanejamento = leitosAguardandoRemanejamento.filter(leito => {
    const searchTermLower = searchTerm.toLowerCase();
    const nomePaciente = leito.dadosPaciente?.nomePaciente?.toLowerCase() || '';
    const especialidadePaciente = leito.dadosPaciente?.especialidadePaciente?.toLowerCase() || '';

    const matchesSearchTerm = nomePaciente.includes(searchTermLower) ||
      especialidadePaciente.includes(searchTermLower) ||
      leito.codigoLeito?.toLowerCase().includes(searchTermLower) ||
      leito.setorNome?.toLowerCase().includes(searchTermLower);

    const matchesFilters = (
      (!filtros.especialidade || leito.dadosPaciente?.especialidadePaciente === filtros.especialidade) &&
      (!filtros.aguardandoUTI || leito.dadosPaciente?.aguardaUTI === filtros.aguardandoUTI) &&
      (!filtros.remanejarPaciente || leito.dadosPaciente?.remanejarPaciente === filtros.remanejarPaciente) &&
      (!filtros.transferirPaciente || leito.dadosPaciente?.transferirPaciente === filtros.transferirPaciente) &&
      (!filtros.provavelAlta || leito.dadosPaciente?.provavelAlta === filtros.provavelAlta)
    );

    return matchesSearchTerm && matchesFilters;
  });

  const filteredLeitosAguardandoTransferencia = leitosAguardandoTransferencia.filter(leito => {
    const searchTermLower = searchTerm.toLowerCase();
    const nomePaciente = leito.dadosPaciente?.nomePaciente?.toLowerCase() || '';
    const especialidadePaciente = leito.dadosPaciente?.especialidadePaciente?.toLowerCase() || '';

    const matchesSearchTerm = nomePaciente.includes(searchTermLower) ||
      especialidadePaciente.includes(searchTermLower) ||
      leito.codigoLeito?.toLowerCase().includes(searchTermLower) ||
      leito.setorNome?.toLowerCase().includes(searchTermLower);

    const matchesFilters = (
      (!filtros.especialidade || leito.dadosPaciente?.especialidadePaciente === filtros.especialidade) &&
      (!filtros.aguardandoUTI || leito.dadosPaciente?.aguardaUTI === filtros.aguardandoUTI) &&
      (!filtros.remanejarPaciente || leito.dadosPaciente?.remanejarPaciente === filtros.remanejarPaciente) &&
      (!filtros.transferirPaciente || leito.dadosPaciente?.transferirPaciente === filtros.transferirPaciente) &&
      (!filtros.provavelAlta || leito.dadosPaciente?.provavelAlta === filtros.provavelAlta)
    );

    return matchesSearchTerm && matchesFilters;
  });

  const filteredLeitosAguardandoRegulacao = leitosAguardandoRegulacao.filter(leito => {
    const searchTermLower = searchTerm.toLowerCase();
    const nomePaciente = leito.dadosPaciente?.nomePaciente?.toLowerCase() || '';

    const matchesSearchTerm = nomePaciente.includes(searchTermLower) ||
      leito.codigoLeito?.toLowerCase().includes(searchTermLower) ||
      leito.setorNome?.toLowerCase().includes(searchTermLower);

    return matchesSearchTerm;
  });

  const resetFiltros = () => {
    setFiltros({
      especialidade: '',
      aguardandoUTI: false,
      remanejarPaciente: false,
      transferirPaciente: false,
      provavelAlta: false,
    });
    setSearchTerm('');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4 text-medical-primary">Regulação de Leitos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Input
          type="text"
          placeholder="Buscar por nome, especialidade, leito ou setor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FiltrosRegulacao filtros={filtros} setFiltros={setFiltros} searchTerm={searchTerm} setSearchTerm={setSearchTerm} resetFiltros={resetFiltros} />
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
                <RemanejamentoPendenteItem key={`${paciente.setorId}-${paciente.leitoId}`} paciente={paciente} onCancelar={handleCancelarRemanejamento} />
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
            {loading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredLeitosAguardandoRegulacao.length > 0 ? (
              filteredLeitosAguardandoRegulacao.map((paciente: any) => (
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
