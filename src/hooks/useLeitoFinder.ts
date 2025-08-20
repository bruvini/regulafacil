
import { useMemo, useCallback } from 'react';
import { useSetores } from './useSetores';
import { Leito, DadosPaciente } from '@/types/hospital';
import { parse, differenceInHours, isValid } from 'date-fns';

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

// Nova função para determinar o sexo compatível para um leito
const determinarSexoLeito = (leito: any, todosLeitosComSetor: any[]): 'Masculino' | 'Feminino' | 'Ambos' => {
    const quartoId = getQuartoId(leito.codigoLeito);
    const companheirosDeQuarto = todosLeitosComSetor.filter(
        l => getQuartoId(l.codigoLeito) === quartoId && l.statusLeito === 'Ocupado' && l.dadosPaciente
    );

    if (companheirosDeQuarto.length === 0) {
        return 'Ambos'; // Quarto vazio, pode receber qualquer sexo
    }

    // Pega o sexo do primeiro paciente do quarto (todos devem ter o mesmo sexo)
    const sexoQuarto = companheirosDeQuarto[0].dadosPaciente?.sexoPaciente;
    return sexoQuarto === 'Masculino' ? 'Masculino' : 'Feminino';
};

// Nova função para priorizar pacientes
const priorizarPacientes = (pacientes: any[]): any[] => {
    return [...pacientes].sort((a, b) => {
        // 1ª Prioridade: Pacientes em Isolamento
        const temIsolamentoA = a.isolamentosVigentes && a.isolamentosVigentes.length > 0;
        const temIsolamentoB = b.isolamentosVigentes && b.isolamentosVigentes.length > 0;
        
        if (temIsolamentoA && !temIsolamentoB) return -1;
        if (!temIsolamentoA && temIsolamentoB) return 1;

        // 2ª Prioridade: Maior Tempo de Internação
        const dataA = a.dataInternacao ? parse(a.dataInternacao, 'dd/MM/yyyy HH:mm', new Date()) : new Date();
        const dataB = b.dataInternacao ? parse(b.dataInternacao, 'dd/MM/yyyy HH:mm', new Date()) : new Date();
        
        if (isValid(dataA) && isValid(dataB)) {
            const tempoA = differenceInHours(new Date(), dataA);
            const tempoB = differenceInHours(new Date(), dataB);
            
            if (tempoA !== tempoB) {
                return tempoB - tempoA; // Maior tempo primeiro (decrescente)
            }
        }

        // 3ª Prioridade: Idade do Paciente (mais velho primeiro)
        const idadeA = a.dataNascimento ? calcularIdade(a.dataNascimento) : 0;
        const idadeB = b.dataNascimento ? calcularIdade(b.dataNascimento) : 0;
        
        return idadeB - idadeA; // Mais velho primeiro
    });
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

        const setoresEnfermariaPermitidos = [
            "UNID. CLINICA MEDICA", "UNID. CIRURGICA", "UNID. NEFROLOGIA TRANSPLANTE", 
            "UNID. JS ORTOPEDIA", "UNID. ONCOLOGIA", "UNID. INT. GERAL - UIG"
        ];

        const isolamentosPacienteStr = paciente.isolamentosVigentes?.map(i => i.sigla).sort().join(',') || '';

        const leitosDisponiveis = todosLeitosComSetor.filter(leito => {
            // Filtro de enfermaria permitida para modo normal
            if (modo === 'normal' && !setoresEnfermariaPermitidos.includes(leito.setorNome)) {
                return false;
            }
            
            // 1. Filtro Básico: Apenas leitos vagos ou em higienização
            if (!['Vago', 'Higienizacao'].includes(leito.statusLeito)) return false;
            
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

    // Nova função para gerar sugestões inteligentes
    const generateSugestoes = useCallback((pacientesPendentes: any[]) => {
        if (!setores || pacientesPendentes.length === 0) return [];

        const todosLeitosComSetor = setores.flatMap(setor => 
            setor.leitos.map(leito => ({ ...leito, setorNome: setor.nomeSetor, setorId: setor.id! }))
        );

        const setoresEnfermariaPermitidos = [
            "UNID. CLINICA MEDICA", "UNID. CIRURGICA", "UNID. NEFROLOGIA TRANSPLANTE", 
            "UNID. JS ORTOPEDIA", "UNID. ONCOLOGIA", "UNID. INT. GERAL - UIG"
        ];

        // Filtrar apenas leitos vagos de enfermaria
        const leitosDisponiveis = todosLeitosComSetor.filter(leito => 
            ['Vago', 'Higienizacao'].includes(leito.statusLeito) &&
            setoresEnfermariaPermitidos.includes(leito.setorNome)
        );

        const sugestoes: any[] = [];

        leitosDisponiveis.forEach(leito => {
            // Determinar o sexo compatível para este leito
            const sexoLeito = determinarSexoLeito(leito, todosLeitosComSetor);
            
            // Filtrar pacientes compatíveis por sexo
            let pacientesCompativeis = pacientesPendentes.filter(paciente => {
                if (sexoLeito === 'Ambos') return true;
                return paciente.sexoPaciente === sexoLeito;
            });

            // Filtrar por especialidade se o leito pertence a um setor específico
            if (leito.setorNome === "UNID. JS ORTOPEDIA") {
                pacientesCompativeis = pacientesCompativeis.filter(p => 
                    p.especialidadePaciente === "Ortopedia"
                );
            } else if (leito.setorNome === "UNID. ONCOLOGIA") {
                pacientesCompativeis = pacientesCompativeis.filter(p => 
                    p.especialidadePaciente === "Oncologia"
                );
            } else if (leito.setorNome === "UNID. NEFROLOGIA TRANSPLANTE") {
                pacientesCompativeis = pacientesCompativeis.filter(p => 
                    p.especialidadePaciente === "Nefrologia"
                );
            }

            // Aplicar lógicas de isolamento
            const quartoId = getQuartoId(leito.codigoLeito);
            const companheirosDeQuarto = todosLeitosComSetor.filter(
                l => getQuartoId(l.codigoLeito) === quartoId && l.statusLeito === 'Ocupado'
            );

            if (companheirosDeQuarto.length > 0) {
                const isolamentosQuarto = companheirosDeQuarto[0].dadosPaciente?.isolamentosVigentes?.map(i => i.sigla).sort().join(',') || '';
                
                pacientesCompativeis = pacientesCompativeis.filter(paciente => {
                    const isolamentosPaciente = paciente.isolamentosVigentes?.map(i => i.sigla).sort().join(',') || '';
                    return isolamentosPaciente === isolamentosQuarto;
                });
            } else {
                // Quarto vazio - pode receber pacientes com ou sem isolamento
                // Mas se for paciente com isolamento, deve ser em leito de isolamento quando possível
                if (leito.leitoIsolamento) {
                    // Priorizar pacientes com isolamento para leitos de isolamento
                    const pacientesComIsolamento = pacientesCompativeis.filter(p => 
                        p.isolamentosVigentes && p.isolamentosVigentes.length > 0
                    );
                    if (pacientesComIsolamento.length > 0) {
                        pacientesCompativeis = pacientesComIsolamento;
                    }
                }
            }

            // Verificar regras de PCP
            if (leito.leitoPCP) {
                pacientesCompativeis = pacientesCompativeis.filter(paciente => {
                    const idade = calcularIdade(paciente.dataNascimento);
                    const temIsolamento = paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0;
                    return idade >= 18 && idade <= 60 && !temIsolamento;
                });
            }

            // Se há pacientes compatíveis, aplicar priorização
            if (pacientesCompativeis.length > 0) {
                const pacientesPriorizados = priorizarPacientes(pacientesCompativeis);
                
                sugestoes.push({
                    leito: {
                        ...leito,
                        sexoCompativel: sexoLeito
                    },
                    pacientesElegiveis: pacientesPriorizados
                });
            }
        });

        // Agrupar por setor
        const sugestoesAgrupadas = sugestoes.reduce((acc, sugestao) => {
            const setorNome = sugestao.leito.setorNome;
            if (!acc[setorNome]) {
                acc[setorNome] = [];
            }
            acc[setorNome].push(sugestao);
            return acc;
        }, {} as Record<string, any[]>);

        return Object.entries(sugestoesAgrupadas).map(([setorNome, sugestoes]) => ({
            setorNome,
            sugestoes
        }));
    }, [setores]);

    return { findAvailableLeitos, generateSugestoes };
};
