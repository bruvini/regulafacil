
import { useState, useMemo } from 'react';
import { Setor } from '@/types/hospital';

const especialidades = [
  "CIRURGIA CABECA E PESCOCO", "CIRURGIA GERAL", "CIRURGIA TORACICA",
  "CIRURGIA VASCULAR", "CLINICA GERAL", "HEMATOLOGIA", "INTENSIVISTA",
  "NEFROLOGIA", "NEUROCIRURGIA", "NEUROLOGIA", "ODONTOLOGIA C.TRAUM.B.M.F.",
  "ONCOLOGIA CIRURGICA", "ONCOLOGIA CLINICA/CANCEROLOGIA",
  "ORTOPEDIA/TRAUMATOLOGIA", "PROCTOLOGIA", "UROLOGIA"
];

const todosStatus = ['Vago', 'Ocupado', 'Bloqueado', 'Higienizacao', 'Regulado', 'Reservado'];

export const useFiltrosMapaLeitos = (setores: Setor[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosAvancados, setFiltrosAvancados] = useState({
    especialidade: '',
    setor: '',
    sexo: '',
    status: '',
    isolamentos: [] as string[],
  });

  const filteredSetores = useMemo(() => {
    if (!setores) return [];

    let setoresFiltrados = [...setores];

    // 1. Filtro de Busca Principal (Termo de Pesquisa)
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      setoresFiltrados = setoresFiltrados
        .map(setor => {
          const leitosFiltrados = setor.leitos.filter(
            leito =>
              leito.codigoLeito.toLowerCase().includes(lowerCaseSearch) ||
              leito.dadosPaciente?.nomePaciente?.toLowerCase().includes(lowerCaseSearch)
          );
          return { ...setor, leitos: leitosFiltrados };
        })
        .filter(setor => setor.leitos.length > 0);
    }

    // 2. Filtros Avançados
    const { especialidade, setor, sexo, status, isolamentos } = filtrosAvancados;

    if (especialidade || setor || sexo || status || isolamentos.length > 0) {
      setoresFiltrados = setoresFiltrados
        .map(s => {
          const leitosFiltrados = s.leitos.filter(l => {
            if (setor && s.id !== setor) return false;
            if (status && l.statusLeito !== status) return false;
            if (sexo && l.dadosPaciente?.sexoPaciente !== sexo) return false;
            if (especialidade && l.dadosPaciente?.especialidadePaciente !== especialidade) return false;
            if (isolamentos.length > 0) {
              const isolamentosPaciente = l.dadosPaciente?.isolamentosVigentes?.map(iso => iso.isolamentoId) || [];
              if (!isolamentos.every(isoId => isolamentosPaciente.includes(isoId))) return false;
            }
            return true;
          });
          return { ...s, leitos: leitosFiltrados };
        })
        .filter(s => s.leitos.length > 0);
    }
    
    return setoresFiltrados;
  }, [setores, searchTerm, filtrosAvancados]);

  const resetFiltros = () => {
    setSearchTerm('');
    setFiltrosAvancados({ especialidade: '', setor: '', sexo: '', status: '', isolamentos: [] });
  };
  
  return { 
    searchTerm, setSearchTerm, 
    filtrosAvancados, setFiltrosAvancados,
    resetFiltros,
    filteredSetores,
    especialidades,
    todosStatus
  };
};
