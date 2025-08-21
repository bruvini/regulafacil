
import { useMemo } from 'react';
import { usePacientes } from './usePacientes';
import { useLeitos } from './useLeitos';
import { useSetores } from './useSetores';
import { Paciente } from '@/types/hospital';
import { format, isValid, parseISO, differenceInHours } from 'date-fns';

export interface DadosPlantaoSetor {
  isolamentos: string[];
  regulacoesPendentes: string[];
  leitosPCP: string[];
  leitosVagos: string[];
  pacientesUTI: string[];
  pacientesTransferencia: string[];
  pacientesRemanejamento: string[];
  pacientesAltaProvavel: string[];
  internacoesProlongadas: string[];
  observacoesGerais: string[];
}

export const usePassagemPlantaoData = () => {
  const { pacientes } = usePacientes();
  const { leitos } = useLeitos();
  const { setores } = useSetores();

  // Combine e enriqueça os dados
  const pacientesComDadosCompletos = useMemo(() => {
    return pacientes.map(paciente => {
      const leito = leitos.find(l => l.id === paciente.leitoId);
      const setor = setores.find(s => s.id === paciente.setorId);
      
      return {
        ...paciente,
        leitoCodigo: leito?.codigoLeito || 'N/A',
        setorNome: setor?.nomeSetor || 'N/A',
        siglaSetorOrigem: setor?.siglaSetor || 'N/A'
      };
    });
  }, [pacientes, leitos, setores]);

  const gerarDadosParaSetor = (nomeSetor: string, pacientesRegulados: Paciente[]): DadosPlantaoSetor => {
    const pacientesDoSetor = pacientesComDadosCompletos.filter(p => p.setorNome === nomeSetor);
    const leitosDoSetor = leitos.filter(l => {
      const setor = setores.find(s => s.id === l.setorId);
      return setor?.nomeSetor === nomeSetor;
    });

    // 1. ISOLAMENTOS
    const isolamentos = pacientesDoSetor
      .filter(p => p.isolamentosVigentes && p.isolamentosVigentes.length > 0)
      .map(p => `[${p.leitoCodigo}] ${p.nomeCompleto} - [${p.isolamentosVigentes!.map(i => i.sigla).join(', ')}]`);

    // 2. REGULAÇÕES PENDENTES
    const regulacoesPendentes = pacientesRegulados
      .filter(p => p.regulacao?.paraSetor === nomeSetor)
      .sort((a, b) => (a.regulacao?.paraLeito || '').localeCompare(b.regulacao?.paraLeito || ''))
      .map(p => {
        const dataRegulacao = p.regulacao?.data ? new Date(p.regulacao.data) : null;
        const dataFormatada = dataRegulacao && isValid(dataRegulacao) ? 
          format(dataRegulacao, 'dd/MM HH:mm') : 'Data Inválida';
        return `[${p.regulacao?.paraLeito}] ${p.nomeCompleto} / Vem de [${p.siglaSetorOrigem}] [${p.leitoCodigo}] - Regulado em [${dataFormatada}]`;
      });

    // 3. LEITOS PCP
    const leitosPCP = leitosDoSetor
      .filter(l => l.leitoPCP)
      .map(l => {
        const paciente = pacientesDoSetor.find(p => p.leitoId === l.id);
        if (paciente) {
          return `[${l.codigoLeito}] ${paciente.nomeCompleto} - ${paciente.especialidadePaciente}`;
        }
        return `[${l.codigoLeito}] VAGO - Leito PCP`;
      });

    // 4. LEITOS VAGOS
    const leitosVagos = leitosDoSetor
      .filter(l => {
        const ultimoHistorico = l.historicoMovimentacao?.[l.historicoMovimentacao.length - 1];
        return ultimoHistorico?.statusLeito === 'Vago';
      })
      .map(l => `[${l.codigoLeito}] ${l.tipoLeito}${l.leitoIsolamento ? ' - Isolamento' : ''}${l.leitoPCP ? ' - PCP' : ''}`);

    // 5. PACIENTES AGUARDANDO UTI
    const pacientesUTI = pacientesDoSetor
      .filter(p => p.aguardaUTI)
      .map(p => {
        const dataPedido = p.dataPedidoUTI ? new Date(p.dataPedidoUTI) : null;
        const tempoEspera = dataPedido && isValid(dataPedido) ? 
          `${differenceInHours(new Date(), dataPedido)}h` : 'N/A';
        return `[${p.leitoCodigo}] ${p.nomeCompleto} - Aguardando há ${tempoEspera}`;
      });

    // 6. TRANSFERÊNCIAS EXTERNAS
    const pacientesTransferencia = pacientesDoSetor
      .filter(p => p.transferirPaciente)
      .map(p => `[${p.leitoCodigo}] ${p.nomeCompleto} - Destino: ${p.destinoTransferencia} - Motivo: ${p.motivoTransferencia}`);

    // 7. REMANEJAMENTOS
    const pacientesRemanejamento = pacientesDoSetor
      .filter(p => p.remanejarPaciente)
      .map(p => `[${p.leitoCodigo}] ${p.nomeCompleto} - Motivo: ${p.motivoRemanejamento}`);

    // 8. ALTA PROVÁVEL
    const pacientesAltaProvavel = pacientesDoSetor
      .filter(p => p.provavelAlta)
      .map(p => `[${p.leitoCodigo}] ${p.nomeCompleto} - ${p.especialidadePaciente}`);

    // 9. INTERNAÇÕES PROLONGADAS (>7 dias)
    const internacoesProlongadas = pacientesDoSetor
      .filter(p => {
        const dataInternacao = p.dataInternacao ? new Date(p.dataInternacao) : null;
        return dataInternacao && isValid(dataInternacao) && 
               differenceInHours(new Date(), dataInternacao) > 168; // 7 dias = 168 horas
      })
      .map(p => {
        const dataInternacao = new Date(p.dataInternacao);
        const diasInternado = Math.floor(differenceInHours(new Date(), dataInternacao) / 24);
        return `[${p.leitoCodigo}] ${p.nomeCompleto} - ${diasInternado} dias internado`;
      });

    // 10. OBSERVAÇÕES GERAIS
    const observacoesGerais = pacientesDoSetor
      .filter(p => p.obsPaciente && p.obsPaciente.length > 0)
      .map(p => `[${p.leitoCodigo}] ${p.nomeCompleto} - ${p.obsPaciente![0].texto}`);

    return {
      isolamentos: isolamentos.length > 0 ? isolamentos : ["Sem registros"],
      regulacoesPendentes: regulacoesPendentes.length > 0 ? regulacoesPendentes : ["Sem registros"],
      leitosPCP: leitosPCP.length > 0 ? leitosPCP : ["Sem registros"],
      leitosVagos: leitosVagos.length > 0 ? leitosVagos : ["Sem registros"],
      pacientesUTI: pacientesUTI.length > 0 ? pacientesUTI : ["Sem registros"],
      pacientesTransferencia: pacientesTransferencia.length > 0 ? pacientesTransferencia : ["Sem registros"],
      pacientesRemanejamento: pacientesRemanejamento.length > 0 ? pacientesRemanejamento : ["Sem registros"],
      pacientesAltaProvavel: pacientesAltaProvavel.length > 0 ? pacientesAltaProvavel : ["Sem registros"],
      internacoesProlongadas: internacoesProlongadas.length > 0 ? internacoesProlongadas : ["Sem registros"],
      observacoesGerais: observacoesGerais.length > 0 ? observacoesGerais : ["Sem registros"]
    };
  };

  return { gerarDadosParaSetor };
};
