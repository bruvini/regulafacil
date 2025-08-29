
import { useMemo } from 'react';
import { Paciente, Leito, Setor } from '@/types/hospital';

interface DadosManuais {
  observadosDCL: number;
  observadosDCX: number;
  observadosNeurologicos: number;
  observadosSalaLaranja: number;
  observadosSalaEmergencia: number;
  salasAtivasCC: number;
  salasBloqueadasCC: number;
  salasTravadasCC: number;
}

interface UseBoletimDiarioProps {
  pacientes: Paciente[];
  leitos: Leito[];
  setores: Setor[];
  nivelPCP: {
    nivel: string;
    cor: string;
    count: number;
  };
}

export const useBoletimDiario = ({
  pacientes,
  leitos,
  setores,
  nivelPCP
}: UseBoletimDiarioProps) => {
  
  // Calcular dados automáticos do sistema
  const dadosAutomaticos = useMemo(() => {
    // Encontrar IDs dos setores
    const setorDCL = setores.find(s => s.nomeSetor === 'PS DECISÃO CLINICA');
    const setorDCX = setores.find(s => s.nomeSetor === 'PS DECISÃO CIRURGICA');
    const setorSalaLaranja = setores.find(s => s.nomeSetor === 'SALA LARANJA');
    const setorSalaEmergencia = setores.find(s => s.nomeSetor === 'SALA DE EMERGENCIA');
    const setorRecuperacao = setores.find(s => s.nomeSetor === 'CC - RECUPERAÇÃO');
    const setorUTI = setores.find(s => s.nomeSetor === 'UTI');

    // Filtrar pacientes que não estão regulados
    const pacientesNaoRegulados = pacientes.filter(p => {
      const leito = leitos.find(l => l.id === p.leitoId);
      const ultimoHistorico = leito?.historicoMovimentacao?.[leito.historicoMovimentacao.length - 1];
      return ultimoHistorico?.statusLeito !== 'Regulado';
    });

    // Calcular internados por setor
    const internadosDCL = pacientesNaoRegulados.filter(p => p.setorId === setorDCL?.id).length;
    const internadosDCX = pacientesNaoRegulados.filter(p => p.setorId === setorDCX?.id).length;
    const internadosSalaLaranja = pacientesNaoRegulados.filter(p => p.setorId === setorSalaLaranja?.id).length;
    const internadosSalaEmergencia = pacientesNaoRegulados.filter(p => p.setorId === setorSalaEmergencia?.id).length;
    const pacientesRecuperacaoSemReserva = pacientesNaoRegulados.filter(p => p.setorId === setorRecuperacao?.id).length;

    // Calcular pacientes em leito PCP
    const pacientesEmLeitoPCP = leitos.filter(leito => {
      if (!leito.leitoPCP) return false;
      const ultimoHistorico = leito.historicoMovimentacao?.[leito.historicoMovimentacao.length - 1];
      return ultimoHistorico?.statusLeito === 'Ocupado';
    }).length;

    // Calcular altas UTI por faixas
    const altasUTI = {
      uti0110: [],
      uti1120: [],
      uti2130: [],
      uti3140: []
    } as Record<string, string[]>;

    if (setorUTI) {
      const pacientesUTIComAlta = pacientes.filter(p => 
        p.setorId === setorUTI.id && p.provavelAlta === true
      );

      pacientesUTIComAlta.forEach(paciente => {
        const leito = leitos.find(l => l.id === paciente.leitoId);
        if (leito) {
          const numeroLeito = parseInt(leito.codigoLeito.replace(/\D/g, ''));
          if (numeroLeito >= 1 && numeroLeito <= 10) {
            altasUTI.uti0110.push(leito.codigoLeito);
          } else if (numeroLeito >= 11 && numeroLeito <= 20) {
            altasUTI.uti1120.push(leito.codigoLeito);
          } else if (numeroLeito >= 21 && numeroLeito <= 30) {
            altasUTI.uti2130.push(leito.codigoLeito);
          } else if (numeroLeito >= 31 && numeroLeito <= 40) {
            altasUTI.uti3140.push(leito.codigoLeito);
          }
        }
      });
    }

    return {
      internadosDCL,
      internadosDCX,
      pacientesEmLeitoPCP,
      internadosSalaLaranja,
      internadosSalaEmergencia,
      pacientesRecuperacaoSemReserva,
      altasUTI
    };
  }, [pacientes, leitos, setores]);

  // Função para gerar orientações por nível PCP
  const gerarOrientacoesPCP = (nivel: string): string => {
    switch (nivel) {
      case 'Rotina Diária':
        return `🔵 PCP Nível Rotina Diária:

✅Fortaleça suas atividades de rotina!
✅ Focar na resolução das pendências nas enfermarias!`;

      case 'Nível 1':
        return `🟢 PCP Nível 1

✅ Focar na resolução das pendências nas enfermarias!
✅ Altas planejadas, focar para o período matutino. Prioridade máxima!`;

      case 'Nível 2':
        return `🟡 PCP Nível 2

✅ Focar na resolução das pendências na enfermaria! Acionar equipe residentes / Staff para auxiliar na tomada de decisão!
✅ Selecionar os pacientes e realizar as transferências para o leito de PCP!
✅ Altas planejadas, focar para o período matutino. Prioridade máxima`;

      case 'Nível 3':
        return `🔴 PCP Nível 3

✅ Focar na resolução das pendências na enfermaria! Acionar equipe residentes / Staff para auxiliar na tomada de decisão!
✅ Selecionar os pacientes e realizar as transferências para o leito de PCP!
✅ Altas planejadas, focar para o período matutino. Prioridade máxima`;

      default:
        return '';
    }
  };

  // Função principal para gerar o texto do boletim
  const gerarTextoBoletim = (dadosManuais: DadosManuais): string => {
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const horaFormatada = dataAtual.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Montar seções do relatório de altas UTI
    const montarSecaoAltasUTI = () => {
      let secao = '';
      
      if (dadosAutomaticos.altasUTI.uti0110.length > 0) {
        secao += `🏥 UTI 01-10: ${dadosAutomaticos.altasUTI.uti0110.join(', ')}\n`;
      }
      if (dadosAutomaticos.altasUTI.uti1120.length > 0) {
        secao += `🏥 UTI 11-20: ${dadosAutomaticos.altasUTI.uti1120.join(', ')}\n`;
      }
      if (dadosAutomaticos.altasUTI.uti2130.length > 0) {
        secao += `🏥 UTI 21-30: ${dadosAutomaticos.altasUTI.uti2130.join(', ')}\n`;
      }
      if (dadosAutomaticos.altasUTI.uti3140.length > 0) {
        secao += `🏥 UTI 31-40: ${dadosAutomaticos.altasUTI.uti3140.join(', ')}\n`;
      }

      return secao || '🏥 Nenhuma alta programada no momento\n';
    };

    return `📋 *BOLETIM DIÁRIO NIR*
📅 ${dataFormatada} - ${horaFormatada}h

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔹 *DECISÃO CLÍNICA*
• Internados: ${dadosAutomaticos.internadosDCL}
• Observados: ${dadosManuais.observadosDCL}

🔸 *DECISÃO CIRÚRGICA* 
• Internados: ${dadosAutomaticos.internadosDCX}
• Observados: ${dadosManuais.observadosDCX}

🧠 *NEUROLÓGICOS*
• Observados: ${dadosManuais.observadosNeurologicos}

🟠 *SALA LARANJA*
• Internados: ${dadosAutomaticos.internadosSalaLaranja}
• Observados: ${dadosManuais.observadosSalaLaranja}

🚨 *SALA DE EMERGÊNCIA*
• Internados: ${dadosAutomaticos.internadosSalaEmergencia}
• Observados: ${dadosManuais.observadosSalaEmergencia}

🛏️ *LEITOS PCP*
• Ocupados: ${dadosAutomaticos.pacientesEmLeitoPCP}

🏥 *CENTRO CIRÚRGICO*
• Salas Ativas: ${dadosManuais.salasAtivasCC}
• Salas Bloqueadas: ${dadosManuais.salasBloqueadasCC}
• Salas Travadas: ${dadosManuais.salasTravadasCC}

🔄 *RECUPERAÇÃO PÓS-ANESTÉSICA*
• Pacientes: ${dadosAutomaticos.pacientesRecuperacaoSemReserva}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏥 *ALTAS PROGRAMADAS UTI*

${montarSecaoAltasUTI()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${gerarOrientacoesPCP(nivelPCP.nivel)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 *Relatório gerado automaticamente*
🕐 ${horaFormatada}h`;
  };

  return {
    dadosAutomaticos,
    gerarTextoBoletim
  };
};
