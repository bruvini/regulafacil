
import { useMemo } from 'react';
import { usePacientes } from './usePacientes';
import { useLeitos } from './useLeitos';
import { useSetores } from './useSetores';
import { Paciente } from '@/types/hospital';
import { format, isValid, differenceInHours } from 'date-fns';

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

  // Função auxiliar para determinar sexo compatível em quartos compartilhados
  const determinarSexoCompativel = (leito: any, todosLeitos: any[], todosPacientes: Paciente[]): string => {
    // Extrair número do quarto (ex: "206" de "206.01")
    const numeroQuarto = leito.codigoLeito.split('.')[0];
    
    // Encontrar outros leitos no mesmo quarto
    const leitosDoQuarto = todosLeitos.filter(l => 
      l.codigoLeito.startsWith(numeroQuarto + '.')
    );
    
    // Verificar se algum leito está ocupado
    for (const leitoQuarto of leitosDoQuarto) {
      const pacienteOcupante = todosPacientes.find(p => p.leitoId === leitoQuarto.id);
      if (pacienteOcupante) {
        return pacienteOcupante.sexoPaciente || 'Indefinido';
      }
    }
    
    return 'Ambos';
  };

  const getDadosPassagemPlantao = (pacientesRegulados: Paciente[]): DadosSetor[] => {
    return setores
      .filter(setor => {
        // Só incluir setores que tenham leitos ou pacientes
        const temLeitos = leitos.some(l => l.setorId === setor.id);
        const temPacientes = pacientesComDadosCompletos.some(p => p.setorId === setor.id);
        return temLeitos || temPacientes;
      })
      .map(setor => {
        const pacientesDoSetor = pacientesComDadosCompletos.filter(p => p.setorNome === setor.nomeSetor);
        const leitosDoSetor = leitos.filter(l => {
          const setorLeito = setores.find(s => s.id === l.setorId);
          return setorLeito?.nomeSetor === setor.nomeSetor;
        });

        // 1. ISOLAMENTOS
        const isolamentos = pacientesDoSetor
          .filter(p => p.isolamentosVigentes && p.isolamentosVigentes.length > 0)
          .map(p => `[${p.leitoCodigo}] ${p.nomeCompleto} - [${p.isolamentosVigentes!.map(i => i.sigla).join(', ')}]`);

        // 2. REGULAÇÕES PENDENTES
        const regulacoesPendentes = pacientesRegulados
          .filter(p => p.regulacao?.paraSetor === setor.nomeSetor)
          .sort((a, b) => (a.regulacao?.paraLeito || '').localeCompare(b.regulacao?.paraLeito || ''))
          .map(p => {
            let dataFormatada = 'Data Inválida';
            
            if (p.regulacao?.data) {
              try {
                const dataRegulacao = new Date(p.regulacao.data);
                if (isValid(dataRegulacao)) {
                  dataFormatada = format(dataRegulacao, 'dd/MM HH:mm');
                }
              } catch (error) {
                console.error('Erro ao formatar data de regulação:', error);
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
            const detalhes = [l.tipoLeito];
            if (l.leitoIsolamento) detalhes.push('Isolamento');
            if (l.leitoPCP) detalhes.push('PCP');
            if (sexoCompativel !== 'Ambos') detalhes.push(sexoCompativel);
            
            return `[${l.codigoLeito}] ${detalhes.join(' - ')}`;
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
                  tempoEspera = `${differenceInHours(new Date(), dataPedido)}h`;
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
          nomeSetor: setor.nomeSetor,
          dados: {
            isolamentos,
            regulacoesPendentes,
            leitosPCP,
            leitosVagos,
            pacientesUTI,
            pacientesTransferencia,
            pacientesRemanejamento,
            pacientesAltaProvavel,
            observacoesGerais
          }
        };
      })
      .filter(setor => {
        // Filtrar setores que tenham pelo menos uma categoria com dados
        const dados = setor.dados;
        return dados.isolamentos.length > 0 ||
               dados.regulacoesPendentes.length > 0 ||
               dados.leitosPCP.length > 0 ||
               dados.leitosVagos.length > 0 ||
               dados.pacientesUTI.length > 0 ||
               dados.pacientesTransferencia.length > 0 ||
               dados.pacientesRemanejamento.length > 0 ||
               dados.pacientesAltaProvavel.length > 0 ||
               dados.observacoesGerais.length > 0;
      });
  };

  return { getDadosPassagemPlantao };
};
