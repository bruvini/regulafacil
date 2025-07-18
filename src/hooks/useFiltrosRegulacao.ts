
import { useState, useMemo } from 'react';
import { differenceInDays, differenceInHours, parse, isValid } from 'date-fns';

const calcularIdade = (dataNascimento: string): number => {
    if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return 999;
    const [dia, mes, ano] = dataNascimento.split('/').map(Number);
    const hoje = new Date();
    const nascimento = new Date(ano, mes - 1, dia);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
    return idade;
};

interface Paciente {
    nomeCompleto?: string;
    dataNascimento?: string;
    dataInternacao?: string;
    especialidadePaciente?: string;
    sexoPaciente?: string;
    [key: string]: unknown;
}

export const useFiltrosRegulacao = (pacientes: Paciente[]) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filtrosAvancados, setFiltrosAvancados] = useState({
        especialidade: '',
        sexo: '',
        idadeMin: '',
        idadeMax: '',
        tempoInternacaoMin: '',
        tempoInternacaoMax: '',
        unidadeTempo: 'dias', // 'dias' ou 'horas'
    });
    const [sortConfig, setSortConfig] = useState({ key: 'tempo', direction: 'desc' });

    const filteredPacientes = useMemo(() => {
        if (!pacientes || pacientes.length === 0) return [];
        
        const pacientesFiltrados = pacientes.filter(paciente => {
            // Verificar se o paciente existe e tem as propriedades necessárias
            if (!paciente) return false;

            // Filtro por Nome - usando nomeCompleto
            if (searchTerm && !paciente.nomeCompleto?.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // Filtros Avançados - Verificar se filtrosAvancados existe e tem a propriedade
            if (filtrosAvancados?.especialidade && paciente.especialidadePaciente !== filtrosAvancados.especialidade) {
                return false;
            }
            if (filtrosAvancados?.sexo && paciente.sexoPaciente !== filtrosAvancados.sexo) {
                return false;
            }
            
            // Verificar se dataNascimento existe antes de calcular idade
            if (paciente.dataNascimento && filtrosAvancados) {
                const idade = calcularIdade(paciente.dataNascimento);
                if (filtrosAvancados.idadeMin && idade < parseInt(filtrosAvancados.idadeMin)) {
                    return false;
                }
                if (filtrosAvancados.idadeMax && idade > parseInt(filtrosAvancados.idadeMax)) {
                    return false;
                }
            }

            // Filtro por Tempo de Internação
            if (paciente.dataInternacao && filtrosAvancados) {
                const dataEntrada = parse(paciente.dataInternacao, 'dd/MM/yyyy HH:mm', new Date());
                if (isValid(dataEntrada)) {
                    const tempo = filtrosAvancados.unidadeTempo === 'dias' 
                        ? differenceInDays(new Date(), dataEntrada)
                        : differenceInHours(new Date(), dataEntrada);

                    if (filtrosAvancados.tempoInternacaoMin && tempo < parseInt(filtrosAvancados.tempoInternacaoMin)) {
                        return false;
                    }
                    if (filtrosAvancados.tempoInternacaoMax && tempo > parseInt(filtrosAvancados.tempoInternacaoMax)) {
                        return false;
                    }
                }
            }

            return true;
        });

        // LÓGICA DE ORDENAÇÃO IMPLEMENTADA
        return pacientesFiltrados
            .map((paciente, index) => ({ paciente, index }))
            .sort((a, b) => {
                let comparison = 0;

                if (sortConfig?.key) {
                    switch (sortConfig.key) {
                        case 'nome':
                            comparison = (a.paciente?.nomeCompleto || '').localeCompare(
                                b.paciente?.nomeCompleto || ''
                            );
                            break;
                        case 'idade': {
                            const dataA = a.paciente?.dataNascimento
                                ? parse(a.paciente.dataNascimento, 'dd/MM/yyyy', new Date())
                                : new Date();
                            const dataB = b.paciente?.dataNascimento
                                ? parse(b.paciente.dataNascimento, 'dd/MM/yyyy', new Date())
                                : new Date();

                            if (isValid(dataA) && isValid(dataB)) {
                                comparison = dataA.getTime() - dataB.getTime();
                            }
                            break;
                        }
                        case 'tempo': {
                            const dataA = a.paciente?.dataInternacao
                                ? parse(a.paciente.dataInternacao, 'dd/MM/yyyy HH:mm', new Date())
                                : new Date();
                            const dataB = b.paciente?.dataInternacao
                                ? parse(b.paciente.dataInternacao, 'dd/MM/yyyy HH:mm', new Date())
                                : new Date();

                            if (isValid(dataA) && isValid(dataB)) {
                                comparison = dataA.getTime() - dataB.getTime();
                            }
                            break;
                        }
                    }
                }

                if (comparison === 0) return a.index - b.index;
                return sortConfig?.direction === 'desc' ? -comparison : comparison;
            })
            .map(({ paciente }) => paciente);
    }, [pacientes, searchTerm, filtrosAvancados, sortConfig]);

    const resetFiltros = () => {
        setSearchTerm('');
        setFiltrosAvancados({ 
            especialidade: '', 
            sexo: '', 
            idadeMin: '', 
            idadeMax: '', 
            tempoInternacaoMin: '', 
            tempoInternacaoMax: '', 
            unidadeTempo: 'dias' 
        });
    };

    return { 
        searchTerm, 
        setSearchTerm, 
        filtrosAvancados, 
        setFiltrosAvancados, 
        filteredPacientes, 
        resetFiltros, 
        sortConfig, 
        setSortConfig 
    };
};
