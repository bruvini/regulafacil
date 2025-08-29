import { useMemo } from 'react';
import { Paciente, Leito, Setor } from '@/types/hospital';

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
        return `${leito?.codigoLeito || ''} - ${p.nomeCompleto}`;
      });

    const regulacoesSaindo = leitosSetor
      .filter((l) => getUltimoHistorico(l)?.statusLeito === 'Regulado')
      .map((l) => {
        const hist = getUltimoHistorico(l);
        const paciente = hist?.pacienteId
          ? getPaciente(hist.pacienteId)
          : undefined;
        const destino = hist?.infoRegulacao?.paraSetor || '';
        return `${l.codigoLeito} - ${paciente?.nomeCompleto || ''} → ${destino}`;
      });

    const regulacoesEntrando = leitosSetor
      .filter((l) => getUltimoHistorico(l)?.statusLeito === 'Reservado')
      .map((l) => {
        const hist = getUltimoHistorico(l);
        const origem = hist?.infoRegulacao?.paraSetor || '';
        return `${l.codigoLeito} ← ${origem}`;
      });

    const remanejamentos = pacientesSetor
      .filter((p) => p.remanejarPaciente)
      .map((p) => {
        const leito = getLeito(p.leitoId);
        const motivo = typeof p.motivoRemanejamento === 'object'
          ? p.motivoRemanejamento.tipo
          : p.motivoRemanejamento;
        return `${leito?.codigoLeito || ''} - ${p.nomeCompleto} (${motivo || ''})`;
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

    const altaNoLeito = pacientesSetor
      .filter((p) => p.altaNoLeito?.status)
      .map((p) => `${getLeito(p.leitoId)?.codigoLeito || ''} - ${p.nomeCompleto}`);

    const aguardandoUti = pacientesSetor
      .filter((p) => p.aguardaUTI)
      .map((p) => `${getLeito(p.leitoId)?.codigoLeito || ''} - ${p.nomeCompleto}`);

    const transferenciaExterna = pacientesSetor
      .filter((p) => p.transferirPaciente)
      .map(
        (p) => `${getLeito(p.leitoId)?.codigoLeito || ''} - ${p.nomeCompleto}`
      );

    const observacoes = pacientesSetor
      .filter((p) => p.obsPaciente && p.obsPaciente.length > 0)
      .map((p) => `${getLeito(p.leitoId)?.codigoLeito || ''} - ${p.nomeCompleto}`);

    const blocos: BlocoInfo[] = [
      { titulo: 'Isolamentos', itens: isolamentos },
      { titulo: 'Regulações Saindo', itens: regulacoesSaindo },
      { titulo: 'Regulações Entrando', itens: regulacoesEntrando },
      { titulo: 'Remanejamentos', itens: remanejamentos },
      { titulo: 'Leitos PCP', itens: leitosPcp },
      { titulo: 'Provável Alta', itens: provavelAlta },
      { titulo: 'Alta no Leito', itens: altaNoLeito },
      { titulo: 'Aguardando UTI', itens: aguardandoUti },
      { titulo: 'Transferência Externa', itens: transferenciaExterna },
      { titulo: 'Observações', itens: observacoes },
    ];

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
