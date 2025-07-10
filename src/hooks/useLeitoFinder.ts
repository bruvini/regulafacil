import { useMemo, useCallback } from 'react';
import { useSetores } from './useSetores';
import { Leito, DadosPaciente } from '@/types/hospital';

// Função para calcular idade, já que a usaremos aqui
const calcularIdade = (dataNascimento: string): number => {
  if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return 999;
  const [dia, mes, ano] = dataNascimento.split('/').map(Number);
  const hoje = new Date();
  const nascimento = new Date(ano, mes - 1, dia);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
};

const getQuartoId = (codigoLeito: string): string => {
    const match = codigoLeito.match(/^(\d+[\s-]?\w*|\w+[\s-]?\d+)\s/);
    return match ? match[1].trim() : codigoLeito; // Retorna o prefixo do quarto ou o código do leito se não houver
};

export const useLeitoFinder = () => {
    const { setores } = useSetores();

    const findAvailableLeitos = useCallback((paciente: DadosPaciente, modo: 'normal' | 'uti' = 'normal') => {
        if (!paciente || !setores) return [];

        const todosLeitosComSetor = setores.flatMap(setor => 
            setor.leitos.map(leito => ({ ...leito, setorNome: setor.nomeSetor, setorId: setor.id! }))
        );

        // Se o modo for 'uti', filtre apenas leitos da UTI
        if (modo === 'uti') {
            return todosLeitosComSetor.filter(leito => {
                return leito.setorNome === 'UTI' && ['Vago', 'Higienizacao'].includes(leito.statusLeito);
            });
        }

        const setoresExcluidos = [
            "UTI", "CC - PRE OPERATORIO", "CC - RECUPERAÇÃO", "CC - SALAS CIRURGICAS",
            "PS DECISÃO CIRURGICA", "PS DECISÃO CLINICA", "SALA LARANJA", 
            "UNID. AVC AGUDO", "UNID. DE AVC - INTEGRAL"
        ];

        const isolamentosPacienteStr = paciente.isolamentosVigentes?.map(i => i.sigla).sort().join(',') || '';

        const leitosDisponiveis = todosLeitosComSetor.filter(leito => {
            // 1. Filtro Básico: Apenas leitos vagos
            if (leito.statusLeito !== 'Vago') return false;
            
            // 2. Filtro de Setor Excluído
            if (setoresExcluidos.includes(leito.setorNome)) return false;

            const quartoId = getQuartoId(leito.codigoLeito);
            const companheirosDeQuarto = todosLeitosComSetor.filter(
                l => getQuartoId(l.codigoLeito) === quartoId && l.statusLeito === 'Ocupado'
            );

            // 3. Lógica de Isolamento
            const isolamentosCompanheirosStr = companheirosDeQuarto.length > 0
                ? companheirosDeQuarto[0].dadosPaciente?.isolamentosVigentes?.map(i => i.sigla).sort().join(',') || ''
                : '';

            if (isolamentosPacienteStr) { // Se o paciente que precisa de leito TEM isolamento
                if (companheirosDeQuarto.length > 0) {
                    // O quarto já tem gente. Os isolamentos precisam ser idênticos.
                    if (isolamentosCompanheirosStr !== isolamentosPacienteStr) return false;
                }
                // Se o quarto está vazio, ele pode entrar.
            } else { // Se o paciente que precisa de leito NÃO TEM isolamento
                if (isolamentosCompanheirosStr) {
                    // Não pode entrar em um quarto que já tem isolamento
                    return false;
                }
            }

            // 4. Lógica de Sexo (SÓ se o quarto já tiver ocupantes)
            if (companheirosDeQuarto.length > 0) {
                const sexoCompanheiros = companheirosDeQuarto[0].dadosPaciente?.sexoPaciente;
                if (sexoCompanheiros && sexoCompanheiros !== paciente.sexoPaciente) {
                    return false; // Sexos incompatíveis
                }
            }

            // 5. Filtro de Leito PCP
            if (leito.leitoPCP) {
                const idade = calcularIdade(paciente.dataNascimento);
                if (idade < 18 || idade > 60 || isolamentosPacienteStr) {
                    return false;
                }
            }

            return true; // Se passou por todas as regras, o leito está disponível
        });

        return leitosDisponiveis;
    }, [setores]);

    return { findAvailableLeitos };
};
