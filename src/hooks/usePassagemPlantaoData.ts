
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
  observacoesGerais: string[];
}

export interface DadosSetor {
  nomeSetor: string;
  dados: DadosPlantaoSetor;
}

export const usePassagemPlantaoData = () => {
  const { pacientes } = usePacientes();
  const { leitos } = useLeitos();
  const { setores } = useSetores();

  // Setores relevantes para a regulação
  const setoresRegulaçao = [
    "UNID. CLINICA MEDICA", 
    "UNID. CIRURGICA", 
    "UNID. NEFROLOGIA TRANSPLANTE", 
    "UNID. JS ORTOPEDIA", 
    "UNID. ONCOLOGIA", 
    "UNID. INT. GERAL - UIG"
  ];

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

  // Função auxiliar para determinar sexo compatível do leito
  const determinarSexoCompativel = (leito: any, todosLeitos: any[], todosPacientes: any[]): string => {
    const getQuartoId = (codigoLeito: string): string => {
      const match = codigoLeito.match(/^(\d+[\s-]?\w*|\w+[\s-]?\d+)\s/);
      return match ? match[1].trim() : codigoLeito;
    };

    const quartoId = getQuartoId(leito.codigoLeito);
    const leitosDoQuarto = todosLeitos.filter(l => getQuartoId(l.codigoLeito) === quartoId);
    
    // Buscar pacientes ocupando leitos do mesmo quarto
    for (const leitoQuarto of leitosDoQuarto) {
      const ultimoHistorico = leitoQuarto.historicoMovimentacao?.[leitoQuarto.historicoMovimentacao.length - 1];
      if (ultimoHistorico?.statusLeito === 'Ocupado') {
        const pacienteOcupante = todosPacientes.find(p => p.leitoId === leitoQuarto.id);
        if (pacienteOcupante?.sexoPaciente) {
          return pacienteOcupante.sexoPaciente;
        }
      }
    }
    
    return 'Ambos';
  };

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
        let dataFormatada = 'Data Inválida';
        
        if (p.regulacao?.data) {
          try {
            let dataRegulacao: Date;
            
            // Tentar diferentes formatos de data
            if (typeof p.regulacao.data === 'string') {
              if (p.regulacao.data.includes('T') || p.regulacao.data.includes('Z')) {
                // Formato ISO
                dataRegulacao = parseISO(p.regulacao.data);
              } else {
                // Tentar como string direta
                dataRegulacao = new Date(p.regulacao.data);
              }
            } else {
              dataRegulacao = new Date(p.regulacao.data);
            }
            
            if (isValid(dataRegulacao)) {
              dataFormatada = format(dataRegulacao, 'dd/MM HH:mm');
            }
          } catch (error) {
            console.error('Erro ao formatar data da regulação:', error);
          }
        }
        
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
      .map(l => {
        const sexoCompativel = determinarSexoCompativel(l, leitos, pacientesComDadosCompletos);
        const detalhesLeito = [
          l.tipoLeito,
          l.leitoIsolamento ? 'Isolamento' : null,
          l.leitoPCP ? 'PCP' : null,
          sexoCompativel !== 'Ambos' ? sexoCompativel : null
        ].filter(Boolean).join(' - ');
        
        return `[${l.codigoLeito}] ${detalhesLeito}`;
      });

    // 5. PACIENTES AGUARDANDO UTI
    const pacientesUTI = pacientesDoSetor
      .filter(p => p.aguardaUTI)
      .map(p => {
        let tempoEspera = 'N/A';
        if (p.dataPedidoUTI) {
          try {
            const dataPedido = new Date(p.dataPedidoUTI);
            if (isValid(dataPedido)) {
              const horas = differenceInHours(new Date(), dataPedido);
              tempoEspera = `${horas}h`;
            }
          } catch (error) {
            console.error('Erro ao calcular tempo de espera UTI:', error);
          }
        }
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

    // 9. OBSERVAÇÕES GERAIS
    const observacoesGerais = pacientesDoSetor
      .filter(p => p.obsPaciente && p.obsPaciente.length > 0)
      .map(p => `[${p.leitoCodigo}] ${p.nomeCompleto} - ${p.obsPaciente![0].texto}`);

    return {
      isolamentos,
      regulacoesPendentes,
      leitosPCP,
      leitosVagos,
      pacientesUTI,
      pacientesTransferencia,
      pacientesRemanejamento,
      pacientesAltaProvavel,
      observacoesGerais,
    };
  };

  // Função principal que retorna dados para todos os setores
  const getDadosPassagemPlantao = (pacientesRegulados: Paciente[]): DadosSetor[] => {
    const dadosSetores: DadosSetor[] = [];

    setoresRegulaçao.forEach(nomeSetor => {
      const dados = gerarDadosParaSetor(nomeSetor, pacientesRegulados);
      
      // Só adiciona o setor se tiver algum dado relevante
      const temDados = Object.values(dados).some(array => array.length > 0);
      
      if (temDados) {
        dadosSetores.push({
          nomeSetor,
          dados
        });
      }
    });

    return dadosSetores;
  };

  return { getDadosPassagemPlantao };
};
