
import { useCallback } from 'react';
import { useSetores } from './useSetores';
import { SolicitacaoCirurgica } from '@/types/hospital';

export const useLeitoFinderCirurgico = () => {
  const { setores } = useSetores();

  const findLeitosParaCirurgia = useCallback((cirurgia: SolicitacaoCirurgica) => {
    if (!cirurgia || !setores) {
      console.log('Dados insuficientes para busca de leitos:', { cirurgia: !!cirurgia, setores: !!setores });
      return [];
    }

    console.log('Buscando leitos para cirurgia:', cirurgia);
    console.log('Setores disponíveis:', setores.length);

    const todosLeitosComSetor = setores.flatMap(setor => {
      if (!setor.leitos || setor.leitos.length === 0) {
        return [];
      }
      
      return setor.leitos.map(leito => {
        const leitoCompleto = { 
          ...leito, 
          setorNome: setor.nomeSetor, 
          setorId: setor.id,
          // Garantir que temos o statusLeito do histórico mais recente
          statusLeito: leito.historicoMovimentacao && leito.historicoMovimentacao.length > 0 
            ? leito.historicoMovimentacao[leito.historicoMovimentacao.length - 1].statusLeito
            : 'Vago'
        };
        return leitoCompleto;
      });
    });

    console.log('Todos os leitos com setor:', todosLeitosComSetor.length);

    const setoresEnfermariaPermitidos = [
      "UNID. CIRURGICA", 
      "UNID. CLINICA MEDICA", 
      "UNID. INT. GERAL - UIG", 
      "UNID. JS ORTOPEDIA", 
      "UNID. NEFROLOGIA TRANSPLANTE", 
      "UNID. ONCOLOGIA"
    ];

    const leitosFiltrados = todosLeitosComSetor.filter(leito => {
        // Log para debug
        console.log(`Avaliando leito ${leito.codigoLeito}: status=${leito.statusLeito}, setor=${leito.setorNome}, tipoNecessario=${cirurgia.tipoLeitoNecessario}`);
        
        if (!['Vago', 'Higienizacao'].includes(leito.statusLeito)) {
            console.log(`Leito ${leito.codigoLeito} rejeitado: status inválido`);
            return false;
        }

        if (cirurgia.tipoLeitoNecessario === 'UTI') {
            const isUTI = leito.setorNome === 'UTI';
            if (!isUTI) console.log(`Leito ${leito.codigoLeito} rejeitado: não é UTI`);
            return isUTI;
        }

        if (cirurgia.tipoLeitoNecessario === 'Enfermaria') {
            if (!setoresEnfermariaPermitidos.includes(leito.setorNome) || leito.leitoPCP) {
                console.log(`Leito ${leito.codigoLeito} rejeitado: setor não permitido ou é PCP`);
                return false;
            }
            return true;
        }

        return false;
    });

    console.log(`Leitos filtrados para cirurgia: ${leitosFiltrados.length}`);
    console.log('Leitos disponíveis:', leitosFiltrados.map(l => `${l.codigoLeito} (${l.setorNome})`));

    return leitosFiltrados;
  }, [setores]);

  return { findLeitosParaCirurgia };
};
