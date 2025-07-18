
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

export const useFiltrosRegulacao = (pacientes: any[]) => {
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
        
        let pacientesFiltrados = pacientes.filter(paciente => {
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
        return [...pacientesFiltrados].sort((a, b) => {
            let comparison = 0;
            
            if (sortConfig?.key === 'nome') {
                comparison = (a?.nomeCompleto || '').localeCompare(b?.nomeCompleto || '');
            } else if (sortConfig?.key === 'idade') {
                const idadeA = a?.dataNascimento ? calcularIdade(a.dataNascimento) : 0;
                const idadeB = b?.dataNascimento ? calcularIdade(b.dataNascimento) : 0;
                comparison = idadeA - idadeB;
            } else if (sortConfig?.key === 'tempo') {
                // Para tempo de internação, usa dataInternacao
                const dataA = a?.dataInternacao ? parse(a.dataInternacao, 'dd/MM/yyyy HH:mm', new Date()) : new Date(0);
                const dataB = b?.dataInternacao ? parse(b.dataInternacao, 'dd/MM/yyyy HH:mm', new Date()) : new Date(0);
                if (isValid(dataA) && isValid(dataB)) {
                    const tempoA = differenceInHours(new Date(), dataA);
                    const tempoB = differenceInHours(new Date(), dataB);
                    comparison = tempoA - tempoB;
                }
            }

            return sortConfig?.direction === 'desc' ? -comparison : comparison;
        });
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
