
import { useMemo } from 'react';
import { Setor, Leito, DadosPaciente } from '@/types/hospital';

export interface SugestaoRemanejamento {
  paciente: DadosPaciente & { id: string, leitoId: string, setorId: string, setorNome: string, leitoCodigo: string };
  leitoDestino: Leito & { setorId: string, setorNome: string };
  motivo: string;
  tipo: 'CONSOLIDACAO' | 'COMPATIBILIDADE';
}

// Função para obter o identificador do quarto a partir do código do leito
const getQuartoId = (codigoLeito: string): string | null => {
  const match = codigoLeito.match(/^(\d+[\s-]?\w*|\w+[\s-]?\d+)\s/);
  return match ? match[1].trim() : codigoLeito; // Usa o código do leito como fallback se não for um quarto
};

export const useIsolamentoSugestoes = (setores: Setor[]): SugestaoRemanejamento[] => {
  return useMemo(() => {
    if (!setores || setores.length === 0) return [];

    const todosLeitos = setores.flatMap(s => 
        s.leitos.map(l => ({ ...l, setorId: s.id!, setorNome: s.nomeSetor }))
    );

    const pacientesComIsolamento = todosLeitos
      .filter(l => l.statusLeito === 'Ocupado' && l.dadosPaciente?.isolamentosVigentes?.length)
      .map(l => ({ ...l.dadosPaciente!, id: l.dadosPaciente!.nomePaciente, leitoId: l.id, setorId: l.setorId, setorNome: l.setorNome, leitoCodigo: l.codigoLeito }));

    const sugestoes: SugestaoRemanejamento[] = [];
    const pacientesJaSugeridos = new Set<string>();

    for (const paciente of pacientesComIsolamento) {
      if (pacientesJaSugeridos.has(paciente.id)) continue;

      const isolamentoPaciente = paciente.isolamentosVigentes!.map(i => i.sigla).sort().join(',');
      const quartoAtualId = getQuartoId(paciente.leitoCodigo);

      const companheirosAtuais = todosLeitos.filter(l => 
        getQuartoId(l.codigoLeito) === quartoAtualId && l.id !== paciente.leitoId && l.statusLeito === 'Ocupado'
      );

      // Cenário 1: Paciente está sozinho ou com companheiros compatíveis, mas existe um quarto melhor para consolidar.
      const estaSozinhoOuCompativel = companheirosAtuais.every(c => 
        c.dadosPaciente?.isolamentosVigentes?.map(i => i.sigla).sort().join(',') === isolamentoPaciente
      );

      if (estaSozinhoOuCompativel) {
        // Procurar um quarto de destino com MAIS de um paciente com o mesmo perfil para justificar a consolidação
        const quartosCandidatos = todosLeitos.reduce((acc, l) => {
          if (l.statusLeito === 'Ocupado' && l.dadosPaciente?.isolamentosVigentes?.length) {
            const quartoId = getQuartoId(l.codigoLeito);
            if (quartoId !== quartoAtualId) {
              acc[quartoId] = acc[quartoId] || [];
              acc[quartoId].push(l);
            }
          }
          return acc;
        }, {} as Record<string, any[]>);

        for (const quartoId in quartosCandidatos) {
          const companheirosDestino = quartosCandidatos[quartoId];
          const eCompativel = companheirosDestino.length > 0 && companheirosDestino.every(c => 
              c.dadosPaciente?.sexoPaciente === paciente.sexoPaciente &&
              c.dadosPaciente?.isolamentosVigentes?.map(i => i.sigla).sort().join(',') === isolamentoPaciente
          );

          if (eCompativel) {
            const leitoVagoNoDestino = todosLeitos.find(l => getQuartoId(l.codigoLeito) === quartoId && l.statusLeito === 'Vago');
            if (leitoVagoNoDestino) {
              const motivo = `Consolidar coorte de isolamento (${isolamentoPaciente}) no Quarto ${quartoId}`;
              sugestoes.push({ paciente, leitoDestino: leitoVagoNoDestino, motivo, tipo: 'CONSOLIDACAO' });
              pacientesJaSugeridos.add(paciente.id);
              break; 
            }
          }
        }
      }
    }
    return sugestoes;
  }, [setores]);
};
