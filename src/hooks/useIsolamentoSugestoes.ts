
import { useMemo } from 'react';
import { Setor, Leito, DadosPaciente } from '@/types/hospital';

export interface SugestaoRemanejamento {
  paciente: DadosPaciente & { id: string, leitoId: string, setorId: string, setorNome: string, leitoCodigo: string };
  leitoDestino: Leito & { setorId: string, setorNome: string };
  motivo: string;
  tipo: 'CONSOLIDACAO' | 'COMPATIBILIDADE';
}

export const useIsolamentoSugestoes = (setores: Setor[]): SugestaoRemanejamento[] => {
  return useMemo(() => {
    if (!setores || setores.length === 0) return [];

    const todosLeitos = setores.flatMap(s => 
        s.leitos.map(l => ({ ...l, setorId: s.id!, setorNome: s.nomeSetor }))
    );

    const pacientesComIsolamento = todosLeitos
      .filter(l => l.statusLeito === 'Ocupado' && l.dadosPaciente?.isolamentosVigentes && l.dadosPaciente.isolamentosVigentes.length > 0)
      .map(l => ({ ...l.dadosPaciente!, id: l.dadosPaciente!.nomePaciente, leitoId: l.id, setorId: l.setorId, setorNome: l.setorNome, leitoCodigo: l.codigoLeito }));

    const sugestoes: SugestaoRemanejamento[] = [];
    const pacientesSugeridos = new Set<string>();

    // Lógica para sugestões
    pacientesComIsolamento.forEach(paciente => {
      if (pacientesSugeridos.has(paciente.id)) return;

      const isolamentosPacienteStr = paciente.isolamentosVigentes!.map(iso => iso.sigla).sort().join(',');

      // Encontrar todos os leitos vagos
      const leitosVagos = todosLeitos.filter(l => l.statusLeito === 'Vago' && !l.leitoIsolamento);

      for (const leitoVago of leitosVagos) {
        const quartoDestino = leitoVago.codigoLeito.match(/^(\d+[\s-]?\w*|\w+[\s-]?\d+)\s/)?.[1].trim();
        if (!quartoDestino) continue; // Só sugere para quartos agrupáveis

        const companheirosNoDestino = todosLeitos.filter(l => 
          l.id !== leitoVago.id &&
          l.statusLeito === 'Ocupado' &&
          l.codigoLeito.startsWith(quartoDestino)
        );

        if (companheirosNoDestino.length === 0) continue; // Quarto de destino precisa ter alguém

        // Todos no quarto de destino têm o mesmo sexo e o mesmo isolamento do paciente?
        const eCompativel = companheirosNoDestino.every(c => 
          c.dadosPaciente?.sexoPaciente === paciente.sexoPaciente &&
          c.dadosPaciente?.isolamentosVigentes?.map(iso => iso.sigla).sort().join(',') === isolamentosPacienteStr
        );

        if (eCompativel) {
          const motivo = `Otimização de coorte de isolamento (${isolamentosPacienteStr}) no Quarto ${quartoDestino}`;
          sugestoes.push({
            paciente: paciente,
            leitoDestino: leitoVago,
            motivo,
            tipo: 'CONSOLIDACAO'
          });
          pacientesSugeridos.add(paciente.id);
          break; // Próximo paciente
        }
      }
    });

    return sugestoes;
  }, [setores]);
};
