
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
  // Novos blocos
  contagemPacientes?: string[];
  reservas?: string[];
  utq?: string[];
  naoRegulados?: string[];
}

export interface DadosSetor {
  nomeSetor: string;
  dados: DadosPlantaoSetor;
}

// Configuração dos setores e seus blocos com tipagem adequada
interface ConfigSetor {
  blocos: string[];
  regrasEspeciais?: {
    leitosPCPAdicionais?: string[];
  };
}

const configPassagemPlantao: Record<string, ConfigSetor> = {
  'SALA DE EMERGENCIA': {
    blocos: ['contagemPacientes', 'aguardandoUTI', 'pacientesTransferencia']
  },
  'SALA LARANJA': {
    blocos: ['contagemPacientes', 'aguardandoUTI', 'isolamentos', 'pacientesTransferencia']
  },
  'PS DECISÃO CLINICA': {
    blocos: ['contagemPacientes', 'aguardandoUTI', 'pacientesTransferencia']
  },
  'PS DECISÃO CIRURGICA': {
    blocos: ['contagemPacientes', 'aguardandoUTI', 'pacientesTransferencia']
  },
  'CC - RECUPERAÇÃO': {
    blocos: ['contagemPacientes', 'naoRegulados', 'aguardandoUTI']
  },
  'UNID. NEFROLOGIA TRANSPLANTE': {
    blocos: ['isolamentos', 'regulacoesPendentes', 'leitosPCP', 'leitosVagos', 'pacientesUTI', 'pacientesTransferencia', 'pacientesRemanejamento', 'pacientesAltaProvavel', 'observacoesGerais'],
    regrasEspeciais: {
      leitosPCPAdicionais: ['EX 1 UNT', 'EX 2 UNT', 'EX 3 UNT']
    }
  },
  'UNID. ONCOLOGIA': {
    blocos: ['isolamentos', 'regulacoesPendentes', 'leitosPCP', 'leitosVagos', 'reservas', 'pacientesUTI', 'pacientesTransferencia', 'pacientesRemanejamento', 'pacientesAltaProvavel', 'observacoesGerais']
  },
  'UNID. CLINICA MEDICA': {
    blocos: ['isolamentos', 'regulacoesPendentes', 'leitosPCP', 'leitosVagos', 'utq', 'pacientesUTI', 'pacientesTransferencia', 'pacientesRemanejamento', 'pacientesAltaProvavel', 'observacoesGerais']
  },
  'UNID. CIRURGICA': {
    blocos: ['isolamentos', 'regulacoesPendentes', 'leitosPCP', 'leitosVagos', 'pacientesUTI', 'pacientesTransferencia', 'pacientesRemanejamento', 'pacientesAltaProvavel', 'observacoesGerais']
  },
  'UNID. JS ORTOPEDIA': {
    blocos: ['isolamentos', 'regulacoesPendentes', 'leitosPCP', 'leitosVagos', 'pacientesUTI', 'pacientesTransferencia', 'pacientesRemanejamento', 'pacientesAltaProvavel', 'observacoesGerais']
  },
  'UNID. INT. GERAL - UIG': {
    blocos: ['isolamentos', 'regulacoesPendentes', 'leitosPCP', 'leitosVagos', 'pacientesUTI', 'pacientesTransferencia', 'pacientesRemanejamento', 'pacientesAltaProvavel', 'observacoesGerais']
  },
  'UTI': {
    blocos: ['leitosVagos', 'pacientesRemanejamento', 'pacientesTransferencia', 'pacientesAltaProvavel']
  }
};

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

  // Geradores de bloco individuais
  const gerarBlocoContagemPacientes = (pacientesDoSetor: any[]): string[] => {
    return [`${pacientesDoSetor.length} pacientes internados`];
  };

  const gerarBlocoIsolamentos = (pacientesDoSetor: any[]): string[] => {
    return pacientesDoSetor
      .filter(p => p.isolamentosVigentes && p.isolamentosVigentes.length > 0)
      .map(p => `[${p.leitoCodigo}] ${p.nomeCompleto} - [${p.isolamentosVigentes!.map(i => i.sigla).join(', ')}]`);
  };

  const gerarBlocoRegulacoesPendentes = (pacientesRegulados: Paciente[], nomeSetor: string): string[] => {
    return pacientesRegulados
      .filter(p => p.regulacao?.paraSetor === nomeSetor)
      .sort((a, b) => (a.regulacao?.paraLeito || '').localeCompare(b.regulacao?.paraLeito || ''))
      .map(p => {
        let dataFormatada = 'Data Inválida';
        
        if (p.regulacao?.data) {
          try {
            let dataRegulacao: Date;
            
            // Fix the instanceof check by ensuring we have the right type
            const dataValue = p.regulacao.data;
            if (typeof dataValue === 'string') {
              if (dataValue.includes('T') || dataValue.includes('Z')) {
                dataRegulacao = parseISO(dataValue);
              } else {
                dataRegulacao = new Date(dataValue);
              }
            } else if (dataValue && typeof dataValue === 'object' && 'getTime' in dataValue) {
              dataRegulacao = dataValue as Date;
            } else {
              dataRegulacao = new Date(dataValue);
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
  };

  const gerarBlocoLeitosPCP = (leitosDoSetor: any[], pacientesDoSetor: any[], leitosPCPAdicionais?: string[]): string[] => {
    const leitosComFlag = leitosDoSetor.filter(l => l.leitoPCP);
    const leitosAdicionais = leitosPCPAdicionais 
      ? leitosDoSetor.filter(l => leitosPCPAdicionais.some(codigo => l.codigoLeito.includes(codigo)))
      : [];
    
    const todosLeitosPCP = [...leitosComFlag, ...leitosAdicionais];
    
    return todosLeitosPCP.map(l => {
      const paciente = pacientesDoSetor.find(p => p.leitoId === l.id);
      if (paciente) {
        return `[${l.codigoLeito}] ${paciente.nomeCompleto} - ${paciente.especialidadePaciente}`;
      }
      return `[${l.codigoLeito}] VAGO - Leito PCP`;
    });
  };

  const gerarBlocoLeitosVagos = (leitosDoSetor: any[], pacientesDoSetor: any[]): string[] => {
    return leitosDoSetor
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
  };

  const gerarBlocoAguardandoUTI = (pacientesDoSetor: any[]): string[] => {
    return pacientesDoSetor
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
  };

  const gerarBlocoTransferencias = (pacientesDoSetor: any[]): string[] => {
    return pacientesDoSetor
      .filter(p => p.transferirPaciente)
      .map(p => `[${p.leitoCodigo}] ${p.nomeCompleto} - Destino: ${p.destinoTransferencia} - Motivo: ${p.motivoTransferencia}`);
  };

  const gerarBlocoRemanejamentos = (pacientesDoSetor: any[]): string[] => {
    return pacientesDoSetor
      .filter(p => p.remanejarPaciente)
      .map(p => `[${p.leitoCodigo}] ${p.nomeCompleto} - Motivo: ${p.motivoRemanejamento}`);
  };

  const gerarBlocoAltaProvavel = (pacientesDoSetor: any[]): string[] => {
    return pacientesDoSetor
      .filter(p => p.provavelAlta)
      .map(p => {
        const isolamentos = p.isolamentosVigentes && p.isolamentosVigentes.length > 0 
          ? ` (Isolamentos: ${p.isolamentosVigentes.map(i => i.sigla).join(', ')})`
          : '';
        return `[${p.leitoCodigo}] ${p.nomeCompleto} - ${p.especialidadePaciente}${isolamentos}`;
      });
  };

  const gerarBlocoObservacoes = (pacientesDoSetor: any[]): string[] => {
    return pacientesDoSetor
      .filter(p => p.obsPaciente && p.obsPaciente.length > 0)
      .map(p => `[${p.leitoCodigo}] ${p.nomeCompleto} - ${p.obsPaciente![0].texto}`);
  };

  const gerarBlocoReservas = (pacientesDoSetor: any[]): string[] => {
    return pacientesDoSetor
      .filter(p => p.origemPaciente === 'Externa' && p.reservaLeito)
      .map(p => `${p.nomeCompleto} - Reservado`);
  };

  const gerarBlocoUTQ = (leitosDoSetor: any[], pacientesDoSetor: any[]): string[] => {
    return leitosDoSetor
      .filter(l => l.codigoLeito.startsWith('504'))
      .map(l => {
        const ultimoHistorico = l.historicoMovimentacao?.[l.historicoMovimentacao.length - 1];
        const status = ultimoHistorico?.statusLeito || 'Vago';
        
        if (status === 'Ocupado') {
          const paciente = pacientesDoSetor.find(p => p.leitoId === l.id);
          if (paciente) {
            const isolamentos = paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0
              ? ` - Isolamento: ${paciente.isolamentosVigentes.map(i => i.sigla).join(', ')}`
              : '';
            return `[${l.codigoLeito}] - ${paciente.nomeCompleto} / ${paciente.especialidadePaciente}${isolamentos}`;
          }
        }
        
        return `[${l.codigoLeito}] - ${status}`;
      });
  };

  const gerarBlocoNaoRegulados = (pacientesDoSetor: any[]): string[] => {
    return pacientesDoSetor
      .filter(p => !p.regulacao || !p.leitoId)
      .map(p => `${p.nomeCompleto} - ${p.especialidadePaciente}`);
  };

  const gerarDadosParaSetor = (nomeSetor: string, pacientesRegulados: Paciente[]): DadosPlantaoSetor => {
    const pacientesDoSetor = pacientesComDadosCompletos.filter(p => p.setorNome === nomeSetor);
    const leitosDoSetor = leitos.filter(l => {
      const setor = setores.find(s => s.id === l.setorId);
      return setor?.nomeSetor === nomeSetor;
    });

    const config = configPassagemPlantao[nomeSetor];
    const dados: DadosPlantaoSetor = {
      isolamentos: [],
      regulacoesPendentes: [],
      leitosPCP: [],
      leitosVagos: [],
      pacientesUTI: [],
      pacientesTransferencia: [],
      pacientesRemanejamento: [],
      pacientesAltaProvavel: [],
      observacoesGerais: []
    };

    if (!config) return dados;

    // Gerar blocos baseado na configuração
    if (config.blocos.includes('contagemPacientes')) {
      dados.contagemPacientes = gerarBlocoContagemPacientes(pacientesDoSetor);
    }
    if (config.blocos.includes('isolamentos')) {
      dados.isolamentos = gerarBlocoIsolamentos(pacientesDoSetor);
    }
    if (config.blocos.includes('regulacoesPendentes')) {
      dados.regulacoesPendentes = gerarBlocoRegulacoesPendentes(pacientesRegulados, nomeSetor);
    }
    if (config.blocos.includes('leitosPCP')) {
      dados.leitosPCP = gerarBlocoLeitosPCP(leitosDoSetor, pacientesDoSetor, config.regrasEspeciais?.leitosPCPAdicionais);
    }
    if (config.blocos.includes('leitosVagos')) {
      dados.leitosVagos = gerarBlocoLeitosVagos(leitosDoSetor, pacientesDoSetor);
    }
    if (config.blocos.includes('aguardandoUTI')) {
      dados.pacientesUTI = gerarBlocoAguardandoUTI(pacientesDoSetor);
    }
    if (config.blocos.includes('pacientesTransferencia')) {
      dados.pacientesTransferencia = gerarBlocoTransferencias(pacientesDoSetor);
    }
    if (config.blocos.includes('pacientesRemanejamento')) {
      dados.pacientesRemanejamento = gerarBlocoRemanejamentos(pacientesDoSetor);
    }
    if (config.blocos.includes('pacientesAltaProvavel')) {
      dados.pacientesAltaProvavel = gerarBlocoAltaProvavel(pacientesDoSetor);
    }
    if (config.blocos.includes('observacoesGerais')) {
      dados.observacoesGerais = gerarBlocoObservacoes(pacientesDoSetor);
    }
    if (config.blocos.includes('reservas')) {
      dados.reservas = gerarBlocoReservas(pacientesDoSetor);
    }
    if (config.blocos.includes('utq')) {
      dados.utq = gerarBlocoUTQ(leitosDoSetor, pacientesDoSetor);
    }
    if (config.blocos.includes('naoRegulados')) {
      dados.naoRegulados = gerarBlocoNaoRegulados(pacientesDoSetor);
    }

    return dados;
  };

  // Função principal que retorna dados para todos os setores configurados
  const getDadosPassagemPlantao = (pacientesRegulados: Paciente[]): DadosSetor[] => {
    const dadosSetores: DadosSetor[] = [];

    Object.keys(configPassagemPlantao).forEach(nomeSetor => {
      const dados = gerarDadosParaSetor(nomeSetor, pacientesRegulados);
      
      // Só adiciona o setor se tiver algum dado relevante
      const temDados = Object.values(dados).some(array => Array.isArray(array) && array.length > 0);
      
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
