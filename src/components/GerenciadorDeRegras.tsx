
import { useState, useEffect } from 'react';
import { RegrasPrecaucao, GrupoRegras } from '@/types/isolamento';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  regrasDoIsolamento: RegrasPrecaucao;
  regrasJaCumpridas: string[];
  onRegrasChange: (novasRegrasCumpridas: string[]) => void;
}

export const GerenciadorDeRegras = ({ regrasDoIsolamento, regrasJaCumpridas, onRegrasChange }: Props) => {
  const [gruposSatisfeitos, setGruposSatisfeitos] = useState<number[]>([]);
  const [podeFinalizar, setPodeFinalizar] = useState(false);

  useEffect(() => {
    // Avalia quais grupos já estão satisfeitos com base nas regras cumpridas
    const satisfeitos: number[] = [];
    regrasDoIsolamento.grupos.forEach((grupo, index) => {
      const idsRegrasDoGrupo = grupo.regras.map(r => r.id);
      
      if (grupo.logica === 'OU') {
        // Para lógica OU, basta uma regra estar cumprida
        const algumaRegraDoGrupoCumprida = idsRegrasDoGrupo.some(id => regrasJaCumpridas.includes(id));
        if (algumaRegraDoGrupoCumprida) {
          satisfeitos.push(index);
        }
      } else {
        // Para lógica E, todas as regras devem estar cumpridas
        const todasRegrasDoGrupoCumpridas = idsRegrasDoGrupo.every(id => regrasJaCumpridas.includes(id));
        if (todasRegrasDoGrupoCumpridas) {
          satisfeitos.push(index);
        }
      }
    });
    setGruposSatisfeitos(satisfeitos);

    // Verifica se o isolamento pode ser finalizado
    const logicaPrincipal = regrasDoIsolamento.logica;
    if (logicaPrincipal === 'OU') {
      setPodeFinalizar(satisfeitos.length > 0);
    } else { // Lógica 'E'
      setPodeFinalizar(satisfeitos.length === regrasDoIsolamento.grupos.length);
    }
  }, [regrasJaCumpridas, regrasDoIsolamento]);

  const handleCheckChange = (regraId: string, checked: boolean) => {
    let novasRegras = [...regrasJaCumpridas];
    if (checked) {
      novasRegras.push(regraId);
    } else {
      novasRegras = novasRegras.filter(id => id !== regraId);
    }
    onRegrasChange(novasRegras);
  };

  const algumGrupoSatisfeito = gruposSatisfeitos.length > 0;

  return (
    <div className="space-y-4">
      <div className="text-center text-xs uppercase font-semibold text-muted-foreground">
        Condição para finalizar: {regrasDoIsolamento.grupos.map((_, i) => `Grupo ${i+1}`).join(` ${regrasDoIsolamento.logica} `)}
      </div>

      {regrasDoIsolamento.grupos.map((grupo, indexGrupo) => {
        const grupoSatisfeito = gruposSatisfeitos.includes(indexGrupo);
        const deveDesabilitar = regrasDoIsolamento.logica === 'OU' && algumGrupoSatisfeito && !grupoSatisfeito;
        
        return (
          <Card 
            key={indexGrupo} 
            className={cn(
              "transition-all border",
              grupoSatisfeito && "border-green-500 bg-green-50",
              deveDesabilitar && "opacity-50"
            )}
          >
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                Grupo {indexGrupo + 1} (Lógica: {grupo.logica})
                {grupoSatisfeito && <span className="text-green-600 text-xs">✓ Satisfeito</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              {grupo.regras.map(regra => (
                <div key={regra.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={regra.id}
                    checked={regrasJaCumpridas.includes(regra.id)}
                    onCheckedChange={(checked) => handleCheckChange(regra.id, !!checked)}
                    disabled={deveDesabilitar}
                  />
                  <Label 
                    htmlFor={regra.id} 
                    className={cn("text-sm cursor-pointer", deveDesabilitar && "cursor-not-allowed")}
                  >
                    {regra.descricao}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button disabled={!podeFinalizar} className={podeFinalizar ? "bg-green-600 hover:bg-green-700" : ""}>
          {podeFinalizar ? "✓ Finalizar Isolamento" : "Finalizar Isolamento"}
        </Button>
      </div>
    </div>
  );
};
