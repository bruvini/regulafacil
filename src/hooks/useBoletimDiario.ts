import { useMemo } from 'react';
import { Paciente, Setor, LeitoEnriquecido } from '@/types/hospital';

export interface DadosManuaisBoletim {
  observadosDCL: number;
  observadosDCX: number;
  observadosNeurologicos: number;
  observadosSalaLaranja: number;
  observadosSalaEmergencia: number;
  salasAtivasCC: number;
  salasBloqueadasCC: number;
  salasTravadasCC: number;
}

interface UseBoletimDiarioParams {
  pacientes: Paciente[];
  leitos: LeitoEnriquecido[];
  setores: Setor[];
  nivelPCP: string;
}

export const useBoletimDiario = ({ pacientes: _pacientes, leitos, setores, nivelPCP }: UseBoletimDiarioParams) => {
  const normalizar = (text: string) =>
    text.normalize('NFD').replace(/[^\w\s-]/g, '').replace(/[\u0300-\u036f]/g, '').toUpperCase();

  const mapaSetores = useMemo(() => {
    const map: Record<string, string> = {};
    setores.forEach((s) => (map[s.id] = normalizar(s.nomeSetor)));
    return map;
  }, [setores]);

  const internadosDCL = useMemo(
    () =>
      leitos.filter((l) => {
        const nome = mapaSetores[l.setorId] || '';
        return nome.includes('DECISAO CLINICA') && l.statusLeito === 'Ocupado' && l.statusLeito !== 'Regulado';
      }).length,
    [leitos, mapaSetores]
  );

  const internadosDCX = useMemo(
    () =>
      leitos.filter((l) => {
        const nome = mapaSetores[l.setorId] || '';
        return nome.includes('DECISAO CIRURGICA') && l.statusLeito === 'Ocupado' && l.statusLeito !== 'Regulado';
      }).length,
    [leitos, mapaSetores]
  );

  const pacientesEmLeitoPCP = useMemo(
    () => leitos.filter((l) => l.leitoPCP && l.statusLeito === 'Ocupado').length,
    [leitos]
  );

  const internadosSalaLaranja = useMemo(
    () =>
      leitos.filter((l) => {
        const nome = mapaSetores[l.setorId] || '';
        return nome.includes('SALA LARANJA') && l.statusLeito === 'Ocupado' && l.statusLeito !== 'Regulado';
      }).length,
    [leitos, mapaSetores]
  );

  const internadosSalaEmergencia = useMemo(
    () =>
      leitos.filter((l) => {
        const nome = mapaSetores[l.setorId] || '';
        return nome.includes('SALA DE EMERGENCIA') && l.statusLeito === 'Ocupado' && l.statusLeito !== 'Regulado';
      }).length,
    [leitos, mapaSetores]
  );

  const pacientesRecuperacaoSemReserva = useMemo(
    () =>
      leitos.filter((l) => {
        const nome = mapaSetores[l.setorId] || '';
        return nome.includes('CC - RECUPERACAO') && l.statusLeito === 'Ocupado' && l.statusLeito !== 'Regulado';
      }).length,
    [leitos, mapaSetores]
  );

  const altasUTI = useMemo(() => {
    const grupos: Record<string, string[]> = {
      'UTI 01': [],
      'UTI 02': [],
      'UTI 03': [],
      'UTI 04': [],
    };

    leitos.forEach((l) => {
      const nome = mapaSetores[l.setorId] || '';
      if (nome.startsWith('UTI') && l.dadosPaciente?.provavelAlta) {
        const numero = parseInt(l.codigoLeito.replace(/\D/g, ''), 10);
        if (numero <= 10) grupos['UTI 01'].push(l.codigoLeito);
        else if (numero <= 20) grupos['UTI 02'].push(l.codigoLeito);
        else if (numero <= 30) grupos['UTI 03'].push(l.codigoLeito);
        else grupos['UTI 04'].push(l.codigoLeito);
      }
    });

    return grupos;
  }, [leitos, mapaSetores]);

  const orientacoes: Record<string, string> = {
    'Rotina Diária':
      '🔵  PCP Nível Rotina Diária:\n✅Fortaleça suas atividades de rotina!\n✅ Focar na resolução das pendências nas enfermarias!',
    'Nível 1':
      '🟢 PCP Nível 1\n✅ Focar na resolução das pendências nas enfermarias!\n✅ Altas planejadas, focar para o período matutino. Prioridade máxima!',
    'Nível 2':
      '🟡 PCP Nível 2\n✅ Focar na resolução das pendências na enfermaria! Acionar equipe residentes / Staff para auxiliar na tomada de decisão!\n✅ Selecionar os pacientes e realizar as transferências para o leito de PCP!\n✅ Altas planejadas, focar para o período matutino. Prioridade máxima',
    'Nível 3':
      '🔴 PCP Nível 3\n✅ Focar na resolução das pendências na enfermaria! Acionar equipe residentes / Staff para auxiliar na tomada de decisão!\n✅ Selecionar os pacientes e realizar as transferências para o leito de PCP!\n✅ Altas planejadas, focar para o período matutino. Prioridade máxima',
  };

  const formatarAltas = (lista: string[]) =>
    lista.length
      ? lista.map((l) => l.replace(/^UTI\s*/i, 'L ')).join(', ')
      : 'SEM PREVISÃO DE ALTA';

  const gerarTextoBoletim = (dados: DadosManuaisBoletim) => {
    const dataHora = new Date().toLocaleString('pt-BR');
    const texto =
      `⚠ ATENÇÃO\n\n` +
      `${dataHora}\n\n` +
      `Estamos em: ${nivelPCP}\n\n` +
      `${internadosDCL} Pacientes internados na DCL sem reserva de leito\n` +
      `${dados.observadosDCL} Pacientes observados na DCL\n` +
      `${internadosDCX} Pacientes internados na DCX sem reserva de leito\n` +
      `${dados.observadosDCX} Pacientes observados DCX\n` +
      `${dados.observadosNeurologicos} Pacientes observados neurológicos\n` +
      `${pacientesEmLeitoPCP} Pacientes ocupando leito de PCP\n` +
      `${internadosSalaLaranja} Pacientes internados na sala laranja\n` +
      `${dados.observadosSalaLaranja} Pacientes observados em sala laranja\n` +
      `${internadosSalaEmergencia} Internados na sala vermelha\n` +
      `${dados.observadosSalaEmergencia} Observados na sala vermelha\n` +
      `${pacientesRecuperacaoSemReserva} Paciente(s) em SRPA sem reserva de leito\n` +
      `${dados.salasAtivasCC} Salas ativas no Centro Cirúrgico\n` +
      `${dados.salasBloqueadasCC} Sala(s) bloqueada(s) no Centro Cirúrgico\n` +
      `${dados.salasTravadasCC} Sala(s) travada(s) no Centro Cirúrgico\n\n` +
      `### PREVISÃO DE ALTAS da UTI\n` +
      `UTI 01: ${formatarAltas(altasUTI['UTI 01'])}\n` +
      `UTI 02: ${formatarAltas(altasUTI['UTI 02'])}\n` +
      `UTI 03: ${formatarAltas(altasUTI['UTI 03'])}\n` +
      `UTI 04: ${formatarAltas(altasUTI['UTI 04'])}\n\n` +
      (orientacoes[nivelPCP] || '');

    return texto;
  };

  return { gerarTextoBoletim };
};

