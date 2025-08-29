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
      'UTI 01-10': [],
      'UTI 11-20': [],
      'UTI 21-30': [],
      'UTI 31+': [],
    };

    leitos.forEach((l) => {
      const nome = mapaSetores[l.setorId] || '';
      if (nome.startsWith('UTI') && l.dadosPaciente?.provavelAlta) {
        const numero = parseInt(l.codigoLeito.replace(/\D/g, ''), 10);
        if (numero <= 10) grupos['UTI 01-10'].push(l.codigoLeito);
        else if (numero <= 20) grupos['UTI 11-20'].push(l.codigoLeito);
        else if (numero <= 30) grupos['UTI 21-30'].push(l.codigoLeito);
        else grupos['UTI 31+'].push(l.codigoLeito);
      }
    });

    return grupos;
  }, [leitos, mapaSetores]);

  const orientacoes: Record<string, string> = {
    'Rotina Diária':
      '🔵  PCP Nível Rotina Diária:\n\n✅Fortaleça suas atividades de rotina!\n\n✅ Focar na resolução das pendências nas enfermarias!\n',
    'Nível 1':
      '🟢 PCP Nível 1\n\n✅ Focar na resolução das pendências nas enfermarias!\n\n✅ Altas planejadas, focar para o período matutino. Prioridade máxima!\n',
    'Nível 2':
      '🟡 PCP Nível 2\n\n✅ Focar na resolução das pendências na enfermaria! Acionar equipe residentes / Staff para auxiliar na tomada de decisão!\n\n✅ Selecionar os pacientes e realizar as transferências para o leito de PCP!\n\n✅ Altas planejadas, focar para o período matutino. Prioridade máxima\n',
    'Nível 3':
      '🔴 PCP Nível 3\n\n✅ Focar na resolução das pendências na enfermaria! Acionar equipe residentes / Staff para auxiliar na tomada de decisão!\n\n✅ Selecionar os pacientes e realizar as transferências para o leito de PCP!\n\n✅ Altas planejadas, focar para o período matutino. Prioridade máxima\n',
  };

  const formatarLista = (lista: string[]) => (lista.length ? lista.join(', ') : 'Nenhuma');

  const gerarTextoBoletim = (dados: DadosManuaisBoletim) => {
    const texto = `📋 *Boletim Diário* 📋\n\n` +
      `🔢 *Dados do Sistema*\n` +
      `• Internados DCL: ${internadosDCL}\n` +
      `• Internados DCX: ${internadosDCX}\n` +
      `• Leitos PCP ocupados: ${pacientesEmLeitoPCP}\n` +
      `• Sala Laranja: ${internadosSalaLaranja}\n` +
      `• Sala de Emergência: ${internadosSalaEmergencia}\n` +
      `• Recuperação sem reserva: ${pacientesRecuperacaoSemReserva}\n\n` +
      `📝 *Dados Manuais*\n` +
      `• Observados DCL: ${dados.observadosDCL}\n` +
      `• Observados DCX: ${dados.observadosDCX}\n` +
      `• Observados Neurológicos: ${dados.observadosNeurologicos}\n` +
      `• Observados Sala Laranja: ${dados.observadosSalaLaranja}\n` +
      `• Observados Sala Emergência: ${dados.observadosSalaEmergencia}\n` +
      `• Salas Ativas CC: ${dados.salasAtivasCC}\n` +
      `• Salas Bloqueadas CC: ${dados.salasBloqueadasCC}\n` +
      `• Salas Travadas CC: ${dados.salasTravadasCC}\n\n` +
      `🛏️ *Altas UTI previstas*\n` +
      `• UTI 01-10: ${formatarLista(altasUTI['UTI 01-10'])}\n` +
      `• UTI 11-20: ${formatarLista(altasUTI['UTI 11-20'])}\n` +
      `• UTI 21-30: ${formatarLista(altasUTI['UTI 21-30'])}\n` +
      `• UTI 31+: ${formatarLista(altasUTI['UTI 31+'])}\n\n` +
      (orientacoes[nivelPCP] || '');

    return texto;
  };

  return { gerarTextoBoletim };
};

