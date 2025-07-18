
import { useState, useMemo } from 'react';
import { SetorComLeitos } from './useSetores';

const especialidades = [
  "CIRURGIA CABECA E PESCOCO", "CIRURGIA GERAL", "CIRURGIA TORACICA",
  "CIRURGIA VASCULAR", "CLINICA GERAL", "HEMATOLOGIA", "INTENSIVISTA",
  "NEFROLOGIA", "NEUROCIRURGIA", "NEUROLOGIA", "ODONTOLOGIA C.TRAUM.B.M.F.",
  "ONCOLOGIA CIRURGICA", "ONCOLOGIA CLINICA/CANCEROLOGIA",
  "ORTOPEDIA/TRAUMATOLOGIA", "PROCTOLOGIA", "UROLOGIA"
];

const todosStatus = ['Vago', 'Ocupado', 'Bloqueado', 'Higienizacao', 'Regulado', 'Reservado'];

export const useFiltrosMapaLeitos = (setores: SetorComLeitos[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosAvancados, setFiltrosAvancados] = useState({
    especialidade: '',
    setor: '',
    sexo: '',
    status: '',
    provavelAlta: '',
    aguardaUTI: '',
    isolamentos: [] as string[],
  });

  const todosLeitosGeral = useMemo(() => setores.flatMap(s => 
      s.leitos.map(l => ({ ...l, setorId: s.id, setorNome: s.nomeSetor }))
  ), [setores]);

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
              leito.dadosPaciente?.nomeCompleto?.toLowerCase().includes(lowerCaseSearch)
          );
          return { ...setor, leitos: leitosFiltrados };
        })
        .filter(setor => setor.leitos.length > 0);
    }

    // 2. Filtros Avançados
    const { especialidade, setor, sexo, status, provavelAlta, aguardaUTI, isolamentos } = filtrosAvancados;

    if (especialidade || setor || sexo || status || provavelAlta || aguardaUTI || isolamentos.length > 0) {
      setoresFiltrados = setoresFiltrados
        .map(s => {
          const leitosFiltrados = s.leitos.filter(l => {
            if (setor && s.id !== setor) return false;
            if (status && l.statusLeito !== status) return false;
            
            // Lógica de filtro por sexo
            if (sexo) {
              if (l.statusLeito === 'Ocupado') {
                if (l.dadosPaciente?.sexoPaciente !== sexo) return false;
              } else if (l.statusLeito === 'Vago') {
                // NOVA LÓGICA: Verifica o sexo dos companheiros de quarto
                const quarto = l.codigoLeito.match(/^(\d+[\s-]?\w*|\w+[\s-]?\d+)\s/)?.[1].trim();
                if (!quarto) return false; // Se não for um quarto, não filtra

                const companheiros = todosLeitosGeral.filter(
                  outroLeito =>
                    outroLeito.codigoLeito.startsWith(quarto) &&
                    outroLeito.statusLeito === 'Ocupado'
                );
                
                // Se houver companheiros, verifica se o sexo deles bate com o filtro.
                // Se não houver companheiros, o leito vago aparece para qualquer sexo.
                if (companheiros.length > 0 && companheiros.some(c => c.dadosPaciente?.sexoPaciente !== sexo)) {
                  return false;
                }
              } else {
                 // Para outros status (Bloqueado, Higienização etc.), não aplica filtro de sexo
              }
            }

            // Filtro por provável alta
            if (provavelAlta) {
              const deveTerAlta = provavelAlta === 'sim';
              if (!!l.dadosPaciente?.provavelAlta !== deveTerAlta) return false;
            }

            // Filtro por aguardando UTI
            if (aguardaUTI) {
              const deveAguardarUTI = aguardaUTI === 'sim';
              if (!!l.dadosPaciente?.aguardaUTI !== deveAguardarUTI) return false;
            }

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
  }, [setores, searchTerm, filtrosAvancados, todosLeitosGeral]);

  const resetFiltros = () => {
    setSearchTerm('');
    setFiltrosAvancados({ especialidade: '', setor: '', sexo: '', status: '', provavelAlta: '', aguardaUTI: '', isolamentos: [] });
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
