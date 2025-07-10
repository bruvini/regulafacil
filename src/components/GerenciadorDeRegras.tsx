import { useState, useEffect } from 'react';
import { TipoIsolamento, RegraIsolamento } from '@/types/isolamento';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSetores } from '@/hooks/useSetores';
import { formatarDescricaoRegra } from '@/lib/formatters';

interface Props {
  isolamentoVigente: any;
  tipoIsolamento: TipoIsolamento;
  setorId: string;
  leitoId: string;
}

export const GerenciadorDeRegras = ({ isolamentoVigente, tipoIsolamento, setorId, leitoId }: Props) => {
  const { atualizarRegrasIsolamento, finalizarIsolamentoPaciente, loading } = useSetores();
  const [regrasCumpridas, setRegrasCumpridas] = useState<string[]>(isolamentoVigente.regrasCumpridas || []);
  const [podeFinalizar, setPodeFinalizar] = useState(false);

  useEffect(() => {
    const { logica, grupos } = tipoIsolamento.regrasPrecaucao;
    if (!grupos || grupos.length === 0) {
      setPodeFinalizar(true); // Pode finalizar se não houver regras
      return;
    }

    const gruposSatisfeitos = grupos.map(grupo => {
      const idsRegrasDoGrupo = grupo.regras.map(r => r.id);
      if (grupo.logica === 'E') {
        return idsRegrasDoGrupo.every(id => regrasCumpridas.includes(id));
      } else { // 'OU'
        return idsRegrasDoGrupo.some(id => regrasCumpridas.includes(id));
      }
    });

    if (logica === 'E') {
      setPodeFinalizar(gruposSatisfeitos.every(s => s));
    } else { // 'OU'
      setPodeFinalizar(gruposSatisfeitos.some(s => s));
    }
  }, [regrasCumpridas, tipoIsolamento.regrasPrecaucao]);

  const handleCheckChange = async (regraId: string, checked: boolean) => {
    const novasRegras = checked
      ? [...regrasCumpridas, regraId]
      : regrasCumpridas.filter(id => id !== regraId);
    setRegrasCumpridas(novasRegras);
    await atualizarRegrasIsolamento(setorId, leitoId, isolamentoVigente.isolamentoId, novasRegras);
  };

  const handleFinalizar = async () => {
    await finalizarIsolamentoPaciente(setorId, leitoId, isolamentoVigente.isolamentoId);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {tipoIsolamento.regrasPrecaucao.grupos.flatMap(g => g.regras).map((regra: RegraIsolamento) => (
          <div key={regra.id} className="flex items-center space-x-3">
            <Checkbox
              id={regra.id}
              checked={regrasCumpridas.includes(regra.id)}
              onCheckedChange={(checked) => handleCheckChange(regra.id, !!checked)}
              disabled={loading}
            />
            <Label htmlFor={regra.id} className="text-sm cursor-pointer">
              {formatarDescricaoRegra(regra)}
            </Label>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!podeFinalizar || loading}
          onClick={handleFinalizar}
          className={podeFinalizar ? "bg-green-600 hover:bg-green-700" : ""}
        >
          Finalizar Isolamento
        </Button>
      </div>
    </div>
  );
};