import { useMemo } from 'react';
import { Paciente, Leito, Setor, InfoAltaPendente } from '@/types/hospital';

export interface BlocoInfo {
  titulo: string;
  itens: string[];
}

export interface SetorPassagem {
  setor?: Setor;
  blocos: BlocoInfo[];
}

export interface PassagemPlantaoData {
  enfermarias: SetorPassagem[];
  uti: SetorPassagem[];
  ccRecuperacao: SetorPassagem[];
  ccSalas: SetorPassagem[];
  avcAgudo: SetorPassagem[];
  ps: SetorPassagem[];
}

const getUltimoHistorico = (leito: Leito) =>
  leito.historicoMovimentacao[leito.historicoMovimentacao.length - 1];

export function usePassagemPlantao(
  pacientes: Paciente[],
  leitos: Leito[],
  setores: Setor[]
): PassagemPlantaoData {
  const getLeito = (id: string) => leitos.find((l) => l.id === id);
  const getPaciente = (id?: string) =>
    pacientes.find((p) => p.id === id);

  const processSetor = (
    nome: string,
    options?: { contarPacientes?: boolean }
  ): SetorPassagem => {
    const setor = setores.find((s) => s.nomeSetor === nome);
    const pacientesSetor = pacientes.filter((p) => p.setorId === setor?.id);
    const leitosSetor = leitos.filter((l) => l.setorId === setor?.id);

    const isolamentos = pacientesSetor
      .filter((p) => p.isolamentosVigentes?.length)
      .map((p) => {
        const leito = getLeito(p.leitoId);
        const siglas = p.isolamentosVigentes.map((i) => i.sigla).join(', ');
        return `${leito?.codigoLeito || ''} - ${p.nomeCompleto} (${siglas})`;
      });

    const leitosRegulados = leitosSetor
      .filter((l) => {
        const status = getUltimoHistorico(l)?.statusLeito;
        return status === 'Regulado' || status === 'Reservado';
      })
      .map((l) => {
        const hist = getUltimoHistorico(l);
        const paciente = hist?.pacienteId ? getPaciente(hist.pacienteId) : undefined;
        if (hist?.statusLeito === 'Regulado') {
          const destino = `${hist.infoRegulacao?.paraSetor || ''} - ${hist.infoRegulacao?.paraLeito || ''}`;
          return `${l.codigoLeito} - ${paciente?.nomeCompleto || ''} - VAI PARA: ${destino}`;
        }
        if (hist?.statusLeito === 'Reservado') {
          const origemSetor = hist.infoRegulacao?.deSetor || 'Origem Externa';
          const origemLeitoId = paciente?.origem?.deLeito;
          const origemLeito = origemLeitoId
            ? getLeito(origemLeitoId)?.codigoLeito || origemLeitoId
            : '';
          return `${l.codigoLeito} - ${paciente?.nomeCompleto || ''} - VEM DE: ${origemSetor} - ${origemLeito}`;
        }
        return '';
      })
      .filter(Boolean);

    const remanejamentos = pacientesSetor
      .filter((p) => p.remanejarPaciente)
      .map((p) => {
        const leito = getLeito(p.leitoId);
        const motivo = p.motivoRemanejamento;
        let textoMotivo = typeof motivo === 'object' ? motivo.tipo : motivo;
        if (typeof motivo === 'object' && motivo.detalhes) {
          textoMotivo += `: ${motivo.detalhes}`;
        }
        return `${leito?.codigoLeito || ''} - ${p.nomeCompleto} (${textoMotivo || ''})`;
      });

    const leitosPcp = leitosSetor
      .filter((l) => l.leitoPCP)
      .map((l) => {
        const hist = getUltimoHistorico(l);
        const paciente = hist?.pacienteId ? getPaciente(hist.pacienteId) : undefined;
        if (hist?.statusLeito === 'Vago' || hist?.statusLeito === 'Higienizacao') {
          return `${l.codigoLeito} - ${hist.statusLeito}`;
        }
        return `${l.codigoLeito} - ${paciente?.nomeCompleto || 'Reservado'}`;
      });

    const provavelAlta = pacientesSetor
      .filter((p) => p.provavelAlta)
      .map((p) => `${getLeito(p.leitoId)?.codigoLeito || ''} - ${p.nomeCompleto}`);

    const pendenciasDeAlta = pacientesSetor
      .filter(
        (p) => Array.isArray(p.altaPendente) && p.altaPendente.length > 0
      )
      .map((p) => {
        const leito = getLeito(p.leitoId);
        const pendencias = (p.altaPendente as InfoAltaPendente[])
          .map((pend) => `${pend.tipo}: ${pend.detalhe}`)
          .join('; ');
        return `${leito?.codigoLeito || ''} - ${p.nomeCompleto} - Pendências: ${pendencias}`;
      });

    const aguardandoUti = pacientesSetor
      .filter((p) => p.aguardaUTI)
      .map((p) => `${getLeito(p.leitoId)?.codigoLeito || ''} - ${p.nomeCompleto}`);

    const transferenciaExterna = pacientesSetor
      .filter((p) => p.transferirPaciente)
      .map((p) => {
        const leito = getLeito(p.leitoId);
        const ultimoStatus = p.historicoTransferencia && p.historicoTransferencia.length > 0
          ? p.historicoTransferencia[p.historicoTransferencia.length - 1].etapa
          : 'N/A';
        return `${leito?.codigoLeito || ''} - ${p.nomeCompleto} | Destino: ${p.destinoTransferencia || ''} | Motivo: ${p.motivoTransferencia || ''} | Último Status: ${ultimoStatus}`;
      });

    const observacoes = pacientesSetor
      .filter((p) => p.obsPaciente && p.obsPaciente.length > 0)
      .map((p) => {
        const leito = getLeito(p.leitoId);
        const obsTextos = p.obsPaciente
          .map((obs) => `- ${obs.texto} (${new Date(obs.timestamp).toLocaleDateString('pt-BR')})`)
          .join('\n');
        return `${leito?.codigoLeito || ''} - ${p.nomeCompleto}:\n${obsTextos}`;
      });

    const blocos: BlocoInfo[] = [
      { titulo: 'Isolamentos', itens: isolamentos },
      { titulo: 'Leitos Regulados', itens: leitosRegulados },
      { titulo: 'Remanejamentos', itens: remanejamentos },
    ];

    if (leitosPcp.length > 0) {
      blocos.push({ titulo: 'Leitos PCP', itens: leitosPcp });
    }

    blocos.push(
      { titulo: 'Provável Alta', itens: provavelAlta },
      { titulo: 'Pendências de Alta', itens: pendenciasDeAlta },
      { titulo: 'Aguardando UTI', itens: aguardandoUti },
      { titulo: 'Transferência Externa', itens: transferenciaExterna },
      { titulo: 'Observações', itens: observacoes }
    );

    if (setor?.nomeSetor === 'UNID. CLINICA MEDICA') {
      const leitoUtq = leitosSetor.find((l) => l.codigoLeito === '504');
      if (leitoUtq) {
        const hist = getUltimoHistorico(leitoUtq);
        const pacienteUtq = hist?.pacienteId ? getPaciente(hist.pacienteId) : undefined;
        let textoUtq = '';
        if (hist?.statusLeito === 'Vago' || hist?.statusLeito === 'Higienizacao') {
          textoUtq = `${leitoUtq.codigoLeito} - ${hist.statusLeito}`;
        } else {
          textoUtq = `${leitoUtq.codigoLeito} - ${pacienteUtq?.nomeCompleto || 'Reservado'}`;
        }
        blocos.push({ titulo: 'Leito UTQ (504)', itens: [textoUtq] });
      }
    }

    if (options?.contarPacientes) {
      blocos.unshift({
        titulo: 'Total de Pacientes',
        itens: [`${pacientesSetor.length}`],
      });
    }

    return { setor, blocos };
  };

  return useMemo(
    () => ({
      enfermarias: [
        processSetor('UNID. JS ORTOPEDIA'),
        processSetor('UNID. INT. GERAL - UIG'),
        processSetor('UNID. DE AVC - INTEGRAL'),
        processSetor('UNID. NEFROLOGIA TRANSPLANTE'),
        processSetor('UNID. CIRURGICA'),
        processSetor('UNID. ONCOLOGIA'),
        processSetor('UNID. CLINICA MEDICA'),
      ],
      uti: [processSetor('UTI')],
      ccRecuperacao: [processSetor('CC - RECUPERAÇÃO')],
      ccSalas: [processSetor('CC - SALAS CIRURGICAS')],
      avcAgudo: [processSetor('UNID. AVC AGUDO', { contarPacientes: true })],
      ps: [
        processSetor('SALA DE EMERGENCIA', { contarPacientes: true }),
        processSetor('SALA LARANJA', { contarPacientes: true }),
        processSetor('PS DECISÃO CIRURGICA', { contarPacientes: true }),
        processSetor('PS DECISÃO CLINICA', { contarPacientes: true }),
      ],
    }),
    [pacientes, leitos, setores]
  );
}

export default usePassagemPlantao;
