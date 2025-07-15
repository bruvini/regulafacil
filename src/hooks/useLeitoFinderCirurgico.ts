
import { useCallback } from 'react';
import { useSetores } from './useSetores';
import { SolicitacaoCirurgica } from '@/types/hospital';

export const useLeitoFinderCirurgico = () => {
  const { setores } = useSetores();

  const findLeitosParaCirurgia = useCallback((cirurgia: SolicitacaoCirurgica) => {
    if (!cirurgia || !setores) return [];

    const todosLeitosComSetor = setores.flatMap(setor => 
        setor.leitos.map(leito => ({ ...leito, setorNome: setor.nomeSetor, setorId: setor.id! }))
    );

    const setoresEnfermariaPermitidos = ["UNID. CIRURGICA", "UNID. CLINICA MEDICA", "UNID. INT. GERAL - UIG", "UNID. JS ORTOPEDIA", "UNID. NEFROLOGIA TRANSPLANTE", "UNID. ONCOLOGIA"];

    return todosLeitosComSetor.filter(leito => {
        if (!['Vago', 'Higienizacao'].includes(leito.statusLeito)) return false;

        if (cirurgia.tipoLeitoNecessario === 'UTI') {
            return leito.setorNome === 'UTI';
        }

        if (cirurgia.tipoLeitoNecessario === 'Enfermaria') {
            if (!setoresEnfermariaPermitidos.includes(leito.setorNome) || leito.leitoPCP) {
                return false;
            }
            return true;
        }

        return false;
    });
  }, [setores]);

  return { findLeitosParaCirurgia };
};
