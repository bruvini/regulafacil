
import { useCallback } from 'react';
import { useSetores } from './useSetores';
import { Leito, DadosPaciente, HistoricoLeito } from '@/types/hospital';
import { parse, differenceInHours, isValid } from 'date-fns';
import { getQuartoId, determinarSexoLeito, isQuartoUTQ } from '@/lib/utils';

export interface LeitoCompativel extends Leito {
  setorNome: string;
  setorId: string;
  statusLeito: HistoricoLeito['statusLeito'];
  dadosPaciente?: DadosPaciente | null;
  temHomonimo: boolean;
}

const SETORES_CONTRA_FLUXO = [
  'SALA DE EMERGENCIA',
  'SALA LARANJA',
  'UNID. AVC AGUDO'
];

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

// Verifica compatibilidade de sexo entre paciente e ocupantes do quarto
const verificarCompatibilidadeSexo = (
    leito: any,
    paciente: DadosPaciente,
    companheirosDeQuarto: any[]
): boolean => {
    if (isQuartoUTQ(leito)) return true;
    if (companheirosDeQuarto.length > 0) {
        const sexoCompanheiros = companheirosDeQuarto[0].dadosPaciente?.sexoPaciente;
        if (sexoCompanheiros && sexoCompanheiros !== paciente.sexoPaciente) {
            return false;
        }
    }
    return true;
};

// Verifica compatibilidade de isolamento entre paciente e ocupantes do quarto
const verificarCompatibilidadeIsolamento = (
    leito: any,
    isolamentosPacienteStr: string,
    isolamentosCompanheirosStr: string,
    companheirosDeQuarto: any[]
): boolean => {
    if (isQuartoUTQ(leito)) return true;
    if (isolamentosPacienteStr) {
        if (companheirosDeQuarto.length > 0) {
            if (isolamentosCompanheirosStr !== isolamentosPacienteStr) return false;
        }
    } else {
        if (isolamentosCompanheirosStr) {
            return false;
        }
    }
    return true;
};

export const useLeitoFinder = () => {
    const { setores } = useSetores();

    const findAvailableLeitos = useCallback(
        (
            paciente: DadosPaciente,
            modo: 'normal' | 'uti' = 'normal',
            opcoes: { isContraFluxo?: boolean } = {}
        ): LeitoCompativel[] => {
            if (!paciente || !setores) return [];

            const { isContraFluxo } = opcoes;

            const todosLeitosComSetor = setores.flatMap(setor =>
                setor.leitos.map(leito => ({ ...leito, setorNome: setor.nomeSetor, setorId: setor.id! }))
            );

            if (isContraFluxo) {
                const leitosContraFluxo: LeitoCompativel[] = [];
                const setoresDeDestino = setores.filter(setor =>
                    SETORES_CONTRA_FLUXO.includes(setor.nomeSetor.toUpperCase())
                );
                setoresDeDestino.forEach(setor => {
                    setor.leitos.forEach(leito => {
                        if (leito.statusLeito === 'Vago' || leito.statusLeito === 'Higienizacao') {
                            leitosContraFluxo.push({
                                ...leito,
                                setorNome: setor.nomeSetor,
                                setorId: setor.id!,
                                temHomonimo: false,
                            });
                        }
                    });
                });
                return leitosContraFluxo;
            }

            const primeiroNomePaciente = paciente.nomeCompleto
                .split(' ')[0]
                .toUpperCase();

            // Se o modo for 'uti', filtre apenas leitos da UTI
            if (modo === 'uti') {
                return todosLeitosComSetor
                    .filter(leito => leito.setorNome === 'UTI' && ['Vago', 'Higienizacao'].includes(leito.statusLeito))
                    .map(leito => ({ ...leito, temHomonimo: false }));
            }

            const setoresExcluidos = [
                'UTI',
                'CC - PRE OPERATORIO',
                'CC - RECUPERAÇÃO',
                'CC - SALAS CIRURGICAS',
                'PS DECISÃO CIRURGICA',
                'PS DECISÃO CLINICA',
                'SALA LARANJA',
                'UNID. AVC AGUDO',
                'UNID. DE AVC - INTEGRAL'
            ];

            const setoresEnfermariaPermitidos = [
                'UNID. CLINICA MEDICA',
                'UNID. CIRURGICA',
                'UNID. NEFROLOGIA TRANSPLANTE',
                'UNID. JS ORTOPEDIA',
                'UNID. ONCOLOGIA',
                'UNID. INT. GERAL - UIG'
            ];

            const isolamentosPacienteStr =
                paciente.isolamentosVigentes?.map(i => i.sigla).sort().join(',') || '';

            const leitosDisponiveis: LeitoCompativel[] = [];

            todosLeitosComSetor.forEach(leito => {
                // Filtro de enfermaria permitida para modo normal
                if (modo === 'normal' && !setoresEnfermariaPermitidos.includes(leito.setorNome)) {
                    return;
                }

                // 1. Filtro Básico: Apenas leitos vagos ou em higienização
                if (!['Vago', 'Higienizacao'].includes(leito.statusLeito)) return;

                // 2. Filtro de Setor Excluído
                if (setoresExcluidos.includes(leito.setorNome)) return;

                const quartoId = getQuartoId(leito.codigoLeito);
                const companheirosDeQuarto = todosLeitosComSetor.filter(
                    l =>
                        getQuartoId(l.codigoLeito) === quartoId &&
                        l.statusLeito === 'Ocupado' &&
                        l.dadosPaciente
                );

                // 3. Lógicas de isolamento e sexo com regra de exceção para o quarto 504
                const isolamentosCompanheirosStr =
                    companheirosDeQuarto.length > 0
                        ?
                              companheirosDeQuarto[0].dadosPaciente?.isolamentosVigentes
                                  ?.map(i => i.sigla)
                                  .sort()
                                  .join(',') || ''
                        : '';

                if (
                    !verificarCompatibilidadeIsolamento(
                        leito,
                        isolamentosPacienteStr,
                        isolamentosCompanheirosStr,
                        companheirosDeQuarto
                    )
                ) {
                    return;
                }

                if (!verificarCompatibilidadeSexo(leito, paciente, companheirosDeQuarto)) {
                    return;
                }

                // 5. Filtro de Leito PCP
                if (leito.leitoPCP) {
                    const idade = calcularIdade(paciente.dataNascimento);
                    if (idade < 18 || idade > 60 || isolamentosPacienteStr) {
                        return;
                    }
                }

                const temHomonimo = companheirosDeQuarto.some(c => {
                    const nome = c.dadosPaciente?.nomeCompleto
                        ?.split(' ')[0]
                        ?.toUpperCase();
                    return nome === primeiroNomePaciente;
                });

                leitosDisponiveis.push({ ...leito, temHomonimo });
            });

            return leitosDisponiveis;
        },
        [setores]
    );

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

            // Aplicar lógicas de isolamento, exceto para o quarto 504 (UTQ)
            const quartoId = getQuartoId(leito.codigoLeito);
            const companheirosDeQuarto = todosLeitosComSetor.filter(
                l => getQuartoId(l.codigoLeito) === quartoId && l.statusLeito === 'Ocupado'
            );

            if (!isQuartoUTQ(leito)) {
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
