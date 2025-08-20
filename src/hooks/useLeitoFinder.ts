import { usePacientes } from './usePacientes';
import { useLeitos } from './useLeitos';
import { useSetores } from './useSetores';
import { Paciente } from '@/types/hospital';

// --- Funções Auxiliares ---

// Extrai o primeiro nome em maiúsculas para comparação
const getPrimeiroNome = (nomeCompleto?: string): string => {
  if (!nomeCompleto) return '';
  return nomeCompleto.split(' ')[0].toUpperCase();
};

// Extrai o identificador do quarto a partir do código do leito
const getQuartoId = (codigoLeito: string): string => {
  const match = codigoLeito.match(/^(\d+[\s-]?\w*|\w+[\s-]?\d+)\s/);
  return match ? match[1].trim() : codigoLeito.split('-')[0];
};

export const useLeitoFinder = () => {
  const { pacientes } = usePacientes();
  const { leitos } = useLeitos();
  const { setores } = useSetores();

  const findAvailableLeitos = (pacienteParaRegular: Paciente, modo: 'normal' | 'uti' = 'normal') => {
    if (!pacienteParaRegular || !pacientes.length || !leitos.length || !setores.length) {
      return [];
    }

    const mapaPacientes = new Map(pacientes.map(p => [p.leitoId, p]));
    const setoresDivididosPorQuarto = new Set(setores.filter(s => s.divisaoPorQuarto).map(s => s.id));

    // 1. Filtra leitos vagos e compatíveis com o modo (UTI ou Normal)
    const leitosFiltrados = leitos.filter(leito => {
      const historicoRecente = leito.historicoMovimentacao[leito.historicoMovimentacao.length - 1];
      const setor = setores.find(s => s.id === leito.setorId);
      if (!setor) return false;

      const isDisponivel = historicoRecente.statusLeito === 'Vago' || historicoRecente.statusLeito === 'Higienizacao';
      const isModoCorreto = modo === 'uti' ? setor.tipoUnidade?.toUpperCase() === 'UTI' : setor.tipoUnidade?.toUpperCase() !== 'UTI';
      
      return isDisponivel && isModoCorreto;
    });

    const primeiroNomePacienteParaRegular = getPrimeiroNome(pacienteParaRegular.nomeCompleto);

    // 2. Mapeia os leitos filtrados para adicionar compatibilidade e o novo alerta de homônimo
    return leitosFiltrados.map(leito => {
      const quartoId = getQuartoId(leito.codigoLeito);
      
      // Encontra todos os leitos no mesmo quarto
      const leitosDoQuarto = leitos.filter(
        l => l.setorId === leito.setorId && getQuartoId(l.codigoLeito) === quartoId
      );

      // Encontra os pacientes que já estão nesse quarto
      const pacientesNoQuarto = leitosDoQuarto
        .map(l => mapaPacientes.get(l.id))
        .filter((p): p is Paciente => !!p);

      // --- VERIFICAÇÕES DE COMPATIBILIDADE ---

      // a) Gênero
      const pacienteNoQuarto = pacientesNoQuarto[0];
      const sexoCompativel = pacienteNoQuarto ? pacienteNoQuarto.sexoPaciente === pacienteParaRegular.sexoPaciente : true;
      
      // b) Isolamento
      const precisaIsolamento = pacienteParaRegular.isolamentosVigentes && pacienteParaRegular.isolamentosVigentes.length > 0;
      const quartoTemIsolamento = pacientesNoQuarto.some(p => p.isolamentosVigentes && p.isolamentosVigentes.length > 0);
      const isCompativelIsolamento = precisaIsolamento ? leito.leitoIsolamento || pacientesNoQuarto.length === 0 : !quartoTemIsolamento;

      // c) Homônimo (NOVA VERIFICAÇÃO)
      let temHomonimo = false;
      if (setoresDivididosPorQuarto.has(leito.setorId)) {
        temHomonimo = pacientesNoQuarto.some(p => getPrimeiroNome(p.nomeCompleto) === primeiroNomePacienteParaRegular);
      }

      // Um leito é considerado compatível se atender a todas as regras
      const isCompativel = sexoCompativel && isCompativelIsolamento;

      return {
        ...leito,
        isCompativel,
        temHomonimo // Adiciona a nova propriedade
      };
    })
    // Retorna apenas os leitos compatíveis, mas com a informação de homônimo anexada
    .filter(leito => leito.isCompativel);
  };

  return { findAvailableLeitos };
};