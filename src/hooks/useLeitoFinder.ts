import { useMemo, useCallback } from 'react';
import { useSetores } from './useSetores';
import { Leito, DadosPaciente } from '@/types/hospital';
import { parse, differenceInHours, isValid } from 'date-fns';

// --- FUNÇÕES AUXILIARES (do seu código original) ---

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
    return match ? match[1].trim() : codigoLeito; 
};

const determinarSexoLeito = (leito: any, todosLeitosComSetor: any[]): 'Masculino' | 'Feminino' | 'Ambos' => {
    const quartoId = getQuartoId(leito.codigoLeito);
    const companheirosDeQuarto = todosLeitosComSetor.filter(
        l => getQuartoId(l.codigoLeito) === quartoId && l.statusLeito === 'Ocupado' && l.dadosPaciente
    );

    if (companheirosDeQuarto.length === 0) {
        return 'Ambos';
    }
    const sexoQuarto = companheirosDeQuarto[0].dadosPaciente?.sexoPaciente;
    return sexoQuarto === 'Masculino' ? 'Masculino' : 'Feminino';
};

const priorizarPacientes = (pacientes: any[]): any[] => {
    return [...pacientes].sort((a, b) => {
        const temIsolamentoA = a.isolamentosVigentes && a.isolamentosVigentes.length > 0;
        const temIsolamentoB = b.isolamentosVigentes && b.isolamentosVigentes.length > 0;
        
        if (temIsolamentoA && !temIsolamentoB) return -1;
        if (!temIsolamentoA && temIsolamentoB) return 1;

        const dataA = a.dataInternacao ? parse(a.dataInternacao, 'dd/MM/yyyy HH:mm', new Date()) : new Date();
        const dataB = b.dataInternacao ? parse(b.dataInternacao, 'dd/MM/yyyy HH:mm', new Date()) : new Date();
        
        if (isValid(dataA) && isValid(dataB)) {
            const tempoA = differenceInHours(new Date(), dataA);
            const tempoB = differenceInHours(new Date(), dataB);
            
            if (tempoA !== tempoB) {
                return tempoB - tempoA;
            }
        }

        const idadeA = a.dataNascimento ? calcularIdade(a.dataNascimento) : 0;
        const idadeB = b.dataNascimento ? calcularIdade(b.dataNascimento) : 0;
        
        return idadeB - idadeA;
    });
};

// --- NOVA FUNÇÃO AUXILIAR PARA VERIFICAÇÃO DE HOMÔNIMO ---
const getPrimeiroNome = (nomeCompleto?: string): string => {
    if (!nomeCompleto) return '';
    return nomeCompleto.split(' ')[0].toUpperCase();
};


export const useLeitoFinder = () => {
    const { setores } = useSetores();

    const findAvailableLeitos = useCallback((paciente: DadosPaciente, modo: 'normal' | 'uti' = 'normal') => {
        if (!paciente || !setores) return [];

        // CORREÇÃO 1: Adicionar 'divisaoPorQuarto' ao objeto do leito para a verificação de homônimos
        const todosLeitosComSetor = setores.flatMap(setor => 
            setor.leitos.map(leito => ({ 
                ...leito, 
                setorNome: setor.nomeSetor, 
                setorId: setor.id!,
                divisaoPorQuarto: setor.divisaoPorQuarto // Esta propriedade é essencial
            }))
        );

        // Se o modo for 'uti', filtre apenas leitos da UTI
        if (modo === 'uti') {
            return todosLeitosComSetor.filter(leito => {
                const setor = setores.find(s => s.id === leito.setorId);
                return setor?.tipoUnidade?.toUpperCase() === 'UTI' && ['Vago', 'Higienizacao'].includes(leito.statusLeito);
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

        // PASSO 1: Filtra leitos disponíveis com base nas regras existentes
        const leitosDisponiveis = todosLeitosComSetor.filter(leito => {
            if (modo === 'normal' && !setoresEnfermariaPermitidos.includes(leito.setorNome)) return false;
            if (!['Vago', 'Higienizacao'].includes(leito.statusLeito)) return false;
            if (setoresExcluidos.includes(leito.setorNome)) return false;

            const quartoId = getQuartoId(leito.codigoLeito);
            const companheirosDeQuarto = todosLeitosComSetor.filter(
                l => getQuartoId(l.codigoLeito) === quartoId && l.statusLeito === 'Ocupado'
            );

            const isolamentosCompanheirosStr = companheirosDeQuarto.length > 0
                ? companheirosDeQuarto[0].dadosPaciente?.isolamentosVigentes?.map(i => i.sigla).sort().join(',') || ''
                : '';

            if (isolamentosPacienteStr) {
                if (companheirosDeQuarto.length > 0) {
                    if (isolamentosCompanheirosStr !== isolamentosPacienteStr) return false;
                }
            } else {
                if (isolamentosCompanheirosStr) return false;
            }

            if (companheirosDeQuarto.length > 0) {
                const sexoCompanheiros = companheirosDeQuarto[0].dadosPaciente?.sexoPaciente;
                if (sexoCompanheiros && sexoCompanheiros !== paciente.sexoPaciente) return false;
            }

            if (leito.leitoPCP) {
                const idade = calcularIdade(paciente.dataNascimento);
                if (idade < 18 || idade > 60 || isolamentosPacienteStr) return false;
            }

            return true;
        });

        // PASSO 2: Adiciona a verificação de homônimo aos leitos já filtrados
        const primeiroNomePacienteParaRegular = getPrimeiroNome(paciente.nomeCompleto);

        return leitosDisponiveis.map(leito => {
            // Se o setor não for dividido por quarto, não há como ter homônimo
            if (!leito.divisaoPorQuarto) {
                return { ...leito, temHomonimo: false };
            }

            const quartoId = getQuartoId(leito.codigoLeito);
            const companheirosDeQuarto = todosLeitosComSetor.filter(
                l => getQuartoId(l.codigoLeito) === quartoId && l.statusLeito === 'Ocupado' && l.dadosPaciente
            );

            const temHomonimo = companheirosDeQuarto.some(
                companheiro => getPrimeiroNome(companheiro.dadosPaciente!.nomeCompleto) === primeiroNomePacienteParaRegular
            );

            return { ...leito, temHomonimo };
        });

    }, [setores]);

    // A função 'generateSugestoes' permanece exatamente como estava no seu código original
    const generateSugestoes = useCallback((pacientesPendentes: any[]) => {
        if (!setores || pacientesPendentes.length === 0) return [];

        const todosLeitosComSetor = setores.flatMap(setor => 
            setor.leitos.map(leito => ({ ...leito, setorNome: setor.nomeSetor, setorId: setor.id! }))
        );

        const setoresEnfermariaPermitidos = [
            "UNID. CLINICA MEDICA", "UNID. CIRURGICA", "UNID. NEFROLOGIA TRANSPLANTE", 
            "UNID. JS ORTOPEDIA", "UNID. ONCOLOGIA", "UNID. INT. GERAL - UIG"
        ];

        const leitosDisponiveis = todosLeitosComSetor.filter(leito => 
            ['Vago', 'Higienizacao'].includes(leito.statusLeito) &&
            setoresEnfermariaPermitidos.includes(leito.setorNome)
        );

        const sugestoes: any[] = [];

        leitosDisponiveis.forEach(leito => {
            const sexoLeito = determinarSexoLeito(leito, todosLeitosComSetor);
            
            let pacientesCompativeis = pacientesPendentes.filter(paciente => {
                if (sexoLeito === 'Ambos') return true;
                return paciente.sexoPaciente === sexoLeito;
            });

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
                if (leito.leitoIsolamento) {
                    const pacientesComIsolamento = pacientesCompativeis.filter(p => 
                        p.isolamentosVigentes && p.isolamentosVigentes.length > 0
                    );
                    if (pacientesComIsolamento.length > 0) {
                        pacientesCompativeis = pacientesComIsolamento;
                    }
                }
            }

            if (leito.leitoPCP) {
                pacientesCompativeis = pacientesCompativeis.filter(paciente => {
                    const idade = calcularIdade(paciente.dataNascimento);
                    const temIsolamento = paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0;
                    return idade >= 18 && idade <= 60 && !temIsolamento;
                });
            }

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