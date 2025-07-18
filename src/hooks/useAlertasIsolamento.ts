
import { useState, useEffect } from 'react';
import { useSetores } from './useSetores';

export interface AlertaIncompatibilidade {
  pacienteId: string;
  nomePaciente: string;
  setorNome: string;
  leitoCodigo: string;
  isolamentos: string[];
  motivo: string;
}

export const useAlertasIsolamento = () => {
  const { setores } = useSetores();
  const [alertas, setAlertas] = useState<AlertaIncompatibilidade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (setores.length === 0) {
        setLoading(false);
        return;
    };

    const novosAlertas: AlertaIncompatibilidade[] = [];
    const setoresExcluidos = ["UTI", "CC - PRE OPERATORIO", "CC - SALAS CIRURGICAS"];

    // 1. Mapeia todos os leitos com seus pacientes e setores
    const todosOsLeitos = setores.flatMap(setor => 
      setor.leitos.map(leito => ({ ...leito, setorNome: setor.nomeSetor, setorId: setor.id }))
    );

    const pacientesComIsolamento = todosOsLeitos.filter(
      leito => leito.statusLeito === 'Ocupado' && leito.dadosPaciente?.isolamentosVigentes?.length && leito.dadosPaciente.isolamentosVigentes.length > 0
    );

    pacientesComIsolamento.forEach(leitoComIsolamento => {
      // 2. Aplica as regras de exclusão
      if (setoresExcluidos.includes(leitoComIsolamento.setorNome) || leitoComIsolamento.leitoIsolamento) {
        return; // Pula para o próximo paciente
      }

      const dadosPaciente = leitoComIsolamento.dadosPaciente!;
      const isolamentosPaciente = dadosPaciente.isolamentosVigentes!.map(iso => iso.sigla);

      const companheirosDeQuarto = todosOsLeitos.filter(outroLeito => {
          const mesmoQuarto = leitoComIsolamento.codigoLeito.split(' ')[0] === outroLeito.codigoLeito.split(' ')[0];
          return outroLeito.id !== leitoComIsolamento.id && mesmoQuarto && outroLeito.statusLeito === 'Ocupado';
      });

      // 3. Regra de Alerta
      const temIncompatibilidade = companheirosDeQuarto.some(companheiro => {
          const isolamentosCompanheiro = companheiro.dadosPaciente?.isolamentosVigentes?.map(iso => iso.sigla) || [];
          // CORREÇÃO AQUI: Ordene os arrays antes de comparar
          return isolamentosPaciente.sort().join(',') !== isolamentosCompanheiro.sort().join(',');
      });

      if (temIncompatibilidade) {
        const motivo = `Risco de contaminação cruzada. Paciente com isolamento por [${isolamentosPaciente.join(', ')}]`;
        novosAlertas.push({
            pacienteId: dadosPaciente.nomeCompleto, // Usando nomeCompleto como ID temporário
            nomePaciente: dadosPaciente.nomeCompleto,
            setorNome: leitoComIsolamento.setorNome,
            leitoCodigo: leitoComIsolamento.codigoLeito,
            isolamentos: isolamentosPaciente,
            motivo
        });
      }
    });

    setAlertas(novosAlertas);
    setLoading(false);

  }, [setores]);

  return { alertas, loading };
};
