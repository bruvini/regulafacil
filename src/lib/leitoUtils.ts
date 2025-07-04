
import { Leito } from '@/types/hospital';

const comparadorNatural = (a: string, b: string) => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

type GrupoLeitos = {
  quartos: Record<string, Leito[]>;
  leitosSoltos: Leito[];
};

export const agruparLeitosPorQuarto = (leitos: Leito[]): GrupoLeitos => {
  const grupos: Record<string, Leito[]> = {};
  const leitosSoltos: Leito[] = [];

  // 1. Tenta agrupar leitos por prefixo
  leitos.forEach(leito => {
    const match = leito.codigoLeito.match(/^(\d+[\s-]?\w*|\w+[\s-]?\d+)\s/);
    const prefixo = match ? match[1].trim() : null;

    if (prefixo) {
      if (!grupos[prefixo]) {
        grupos[prefixo] = [];
      }
      grupos[prefixo].push(leito);
    } else {
      leitosSoltos.push(leito);
    }
  });

  const resultado: GrupoLeitos = {
    quartos: {},
    leitosSoltos: [...leitosSoltos],
  };

  // 2. Filtra grupos que são de fato "quartos" (mais de 1 leito)
  Object.keys(grupos).forEach(prefixo => {
    if (grupos[prefixo].length > 1) {
      resultado.quartos[prefixo] = grupos[prefixo];
    } else {
      resultado.leitosSoltos.push(...grupos[prefixo]);
    }
  });
  
  // 3. Verifica a regra de exceção: se SÓ existe UM quarto, não agrupa.
  const nomesDosQuartos = Object.keys(resultado.quartos);
  if (nomesDosQuartos.length === 1 && resultado.leitosSoltos.length === 0) {
    return {
      quartos: {},
      leitosSoltos: leitos, // Retorna todos como soltos
    };
  }

  return resultado;
};
