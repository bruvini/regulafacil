
import { useMemo } from 'react';
import { usePacientes } from './usePacientes';
import { useLeitos } from './useLeitos';
import { useSetores } from './useSetores';
import { Paciente, Leito } from '@/types/hospital';
import { format, isValid, parseISO } from 'date-fns';

// Tipagem para a saída do nosso hook, garantindo consistência
export interface DadosPlantaoSetor {
  isolamentos: string[];
  regulacoesPendentes: string[];
  leitosPCP: string[];
  leitosVagos: string[];
  aguardandoUTI: string[];
  remanejamentos: string[];
  transferencias: string[];
  provavelAlta: string[];
  observacoes: string[];
}

// Hook principal
export const usePassagemPlantaoData = () => {
  const { pacientes } = usePacientes();
  const { leitos } = useLeitos();
  const { setores } = useSetores();

  // 1. Enriquecer os dados brutos uma única vez para otimizar a performance
  const pacientesComDadosCompletos = useMemo(() => {
    if (!pacientes.length || !leitos.length || !setores.length) return [];
    const mapaLeitos = new Map(leitos.map(l => [l.id, l]));
    const mapaSetores = new Map(setores.map(s => [s.id, s]));

    return pacientes.map(p => {
      const leito = mapaLeitos.get(p.leitoId);
      const setor = leito ? mapaSetores.get(leito.setorId) : undefined;
      return {
        ...p,
        leitoCodigo: leito?.codigoLeito || 'N/A',
        setorNome: setor?.nomeSetor || 'N/A',
        siglaSetor: setor?.siglaSetor || 'N/A',
      };
    });
  }, [pacientes, leitos, setores]);
  
  // 2. Função principal que será chamada pelo modal
  const gerarDadosParaSetor = (nomeSetor: string, pacientesJaRegulados: Paciente[]): DadosPlantaoSetor => {
    const pacientesDoSetor = pacientesComDadosCompletos.filter(p => p.setorNome === nomeSetor);
    const leitosDoSetor = leitos.filter(l => {
      const setor = setores.find(s => s.id === l.setorId);
      return setor?.nomeSetor === nomeSetor;
    });

    // Processamento de cada categoria de informação
    const isolamentos = pacientesDoSetor
      .filter(p => p.isolamentosVigentes && p.isolamentosVigentes.length > 0)
      .map(p => `${p.leitoCodigo} ${p.nomeCompleto} - ${p.isolamentosVigentes.map(i => i.sigla).join(', ')}`);

    const regulacoesPendentes = pacientesJaRegulados
      .filter(p => {
        // Verifica se o paciente tem uma regulação direcionada para este setor
        const setorDestino = setores.find(s => s.nomeSetor === nomeSetor);
        return setorDestino && p.setorId === setorDestino.id;
      })
      .map(p => {
        const dataInternacao = parseISO(p.dataInternacao);
        const dataFormatada = isValid(dataInternacao) ? format(dataInternacao, 'dd/MM HH:mm') : 'N/A';
        return `${p.leitoCodigo || 'N/A'} ${p.nomeCompleto} / Vem de ${p.setorOrigem || 'N/A'} - Regulado em ${dataFormatada}`;
      });

    const leitosPCP = leitosDoSetor
      .filter(l => l.leitoPCP)
      .sort((a, b) => a.codigoLeito.localeCompare(b.codigoLeito))
      .map(l => {
        const paciente = pacientesComDadosCompletos.find(p => p.leitoId === l.id);
        const ultimoHistorico = l.historicoMovimentacao?.[l.historicoMovimentacao.length - 1];
        const status = ultimoHistorico?.statusLeito || 'Vago';
        
        if (paciente) return `${l.codigoLeito} - ${paciente.nomeCompleto}`;
        if (status === 'Bloqueado') return `${l.codigoLeito} - BLOQUEADO (${ultimoHistorico?.motivoBloqueio || 'Sem motivo'})`;
        return `${l.codigoLeito} - ${status} (${l.tipoLeito})`;
      });

    const leitosVagos = leitosDoSetor
      .filter(l => {
        const ultimoHistorico = l.historicoMovimentacao?.[l.historicoMovimentacao.length - 1];
        const status = ultimoHistorico?.statusLeito || 'Vago';
        return ['Vago', 'Higienizacao'].includes(status) && !l.leitoPCP;
      })
      .map(l => {
        const ultimoHistorico = l.historicoMovimentacao?.[l.historicoMovimentacao.length - 1];
        const status = ultimoHistorico?.statusLeito || 'Vago';
        let infoExtra = `(${l.tipoLeito})`;
        if (l.leitoIsolamento) infoExtra = `(Isolamento - ${l.tipoLeito})`;
        return `${l.codigoLeito} - ${status} ${infoExtra}`;
      });

    const aguardandoUTI = pacientesDoSetor
      .filter(p => p.aguardaUTI && p.dataPedidoUTI)
      .map(p => {
        const dataPedido = parseISO(p.dataPedidoUTI!);
        const dataFormatada = isValid(dataPedido) ? format(dataPedido, 'dd/MM HH:mm') : 'N/A';
        return `${p.leitoCodigo} ${p.nomeCompleto} - Pedido em: ${dataFormatada}`;
      });

    const remanejamentos = pacientesDoSetor
      .filter(p => p.remanejarPaciente && p.dataPedidoRemanejamento)
      .map(p => {
        const dataPedido = parseISO(p.dataPedidoRemanejamento!);
        const dataFormatada = isValid(dataPedido) ? `desde ${format(dataPedido, 'dd/MM HH:mm')}` : '';
        return `${p.leitoCodigo} ${p.nomeCompleto} - Motivo: ${p.motivoRemanejamento} (${dataFormatada})`;
      });

    const transferencias = pacientesDoSetor
      .filter(p => p.transferirPaciente)
      .map(p => `${p.leitoCodigo} ${p.nomeCompleto} -> ${p.destinoTransferencia} (Obs: ${p.motivoTransferencia || 'N/A'})`);

    const provavelAlta = pacientesDoSetor
      .filter(p => p.provavelAlta)
      .map(p => `${p.leitoCodigo} - ${p.nomeCompleto} - Alta prevista`);

    const observacoes = pacientesDoSetor
      .filter(p => p.obsPaciente && p.obsPaciente.length > 0)
      .map(p => `${p.leitoCodigo} ${p.nomeCompleto} - "${p.obsPaciente![p.obsPaciente!.length - 1].texto}"`);

    return {
      isolamentos, regulacoesPendentes, leitosPCP, leitosVagos, aguardandoUTI,
      remanejamentos, transferencias, provavelAlta, observacoes,
    };
  };

  return { gerarDadosParaSetor };
};
