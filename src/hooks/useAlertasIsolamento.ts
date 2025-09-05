
import { useState, useEffect } from 'react';
import { useSetores } from './useSetores';
import { useAuditoria } from './useAuditoria';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export interface AlertaIncompatibilidade {
  pacienteId: string;
  nomePaciente: string;
  setorNome: string;
  leitoCodigo: string;
  isolamentos: string[];
  motivo: string;
  status: 'suspeita' | 'confirmada';
}

export const useAlertasIsolamento = () => {
  const { setores, loading: setoresLoading } = useSetores();
  const [alertas, setAlertas] = useState<AlertaIncompatibilidade[]>([]);
  const [loading, setLoading] = useState(true);
  const { registrarLog } = useAuditoria();

  useEffect(() => {
    if (setoresLoading) {
        setLoading(true);
        return;
    }

    if (setores.length === 0) {
        setAlertas([]);
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
      leito => leito.statusLeito === 'Ocupado' && leito.dadosPaciente?.isolamentosVigentes?.some(iso => iso.status === 'suspeita' || iso.status === 'confirmada')
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
        const status = dadosPaciente.isolamentosVigentes!.some(iso => iso.status === 'suspeita') ? 'suspeita' : 'confirmada';
        novosAlertas.push({
            pacienteId: dadosPaciente.id,
            nomePaciente: dadosPaciente.nomeCompleto,
            setorNome: leitoComIsolamento.setorNome,
            leitoCodigo: leitoComIsolamento.codigoLeito,
            isolamentos: isolamentosPaciente,
            motivo,
            status
        });

        if (!dadosPaciente.alertaIncompatibilidadeLogado) {
          registrarLog(
            `Alerta de incompatibilidade: Paciente ${dadosPaciente.nomeCompleto} no leito ${leitoComIsolamento.codigoLeito} com isolamento ${isolamentosPaciente.join(', ')} incompatível com vizinho.`,
            'Gestão de Isolamentos'
          );
          updateDoc(
            doc(db, 'pacientesRegulaFacil', dadosPaciente.id),
            { alertaIncompatibilidadeLogado: true }
          );
        }
      }
    });

    setAlertas(novosAlertas);
    setLoading(false);

  }, [setores, setoresLoading]);

  return { alertas, loading };
};
