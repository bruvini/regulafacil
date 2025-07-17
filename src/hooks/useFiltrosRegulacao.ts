
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

    const filteredPacientes = useMemo(() => {
        return pacientes.filter(paciente => {
            // Filtro por Nome
            if (searchTerm && !paciente.nomePaciente.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // Filtros Avançados
            if (filtrosAvancados.especialidade && paciente.especialidadePaciente !== filtrosAvancados.especialidade) {
                return false;
            }
            if (filtrosAvancados.sexo && paciente.sexoPaciente !== filtrosAvancados.sexo) {
                return false;
            }
            const idade = calcularIdade(paciente.dataNascimento);
            if (filtrosAvancados.idadeMin && idade < parseInt(filtrosAvancados.idadeMin)) {
                return false;
            }
            if (filtrosAvancados.idadeMax && idade > parseInt(filtrosAvancados.idadeMax)) {
                return false;
            }

            // Filtro por Tempo de Internação
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

            return true;
        });
    }, [pacientes, searchTerm, filtrosAvancados]);

    const resetFiltros = () => {
        setSearchTerm('');
        setFiltrosAvancados({ especialidade: '', sexo: '', idadeMin: '', idadeMax: '', tempoInternacaoMin: '', tempoInternacaoMax: '', unidadeTempo: 'dias' });
    };

    return { searchTerm, setSearchTerm, filtrosAvancados, setFiltrosAvancados, filteredPacientes, resetFiltros };
};
