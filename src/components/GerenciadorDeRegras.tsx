
import { useState, useEffect } from 'react';
import { RegrasPrecaucao, GrupoRegras } from '@/types/isolamento';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSetores } from '@/hooks/useSetores';

interface Props {
  regrasDoIsolamento: RegrasPrecaucao;
  regrasJaCumpridas: string[];
  onRegrasChange: (novasRegrasCumpridas: string[]) => void;
  setorId: string;
  leitoId: string;
  isolamentoId: string;
}

export const GerenciadorDeRegras = ({ 
  regrasDoIsolamento, 
  regrasJaCumpridas, 
  onRegrasChange,
  setorId,
  leitoId,
  isolamentoId
}: Props) => {
  const [gruposSatisfeitos, setGruposSatisfeitos] = useState<number[]>([]);
  const [podeFinalizar, setPodeFinalizar] = useState(false);
  const { finalizarIsolamentoPaciente } = useSetores();

  // Função para formatar a descrição da regra com base nos parâmetros
  const formatarDescricaoRegra = (regra: any): string => {
    switch (regra.tipo) {
      case 'EXAME_NEGATIVO':
        const exameParam = regra.parametros?.find((p: any) => p.tipo === 'nome_exame');
        return `Até resultado negativo de: ${exameParam?.valor || 'Exame'}`;
      
      case 'DIAS_COM_SINTOMA':
        const diasComParam = regra.parametros?.find((p: any) => p.tipo === 'quantidade_dias');
        const sintomaComParam = regra.parametros?.find((p: any) => p.tipo === 'sintoma');
        return `Após ${diasComParam?.valor || 'X'} dias com ${sintomaComParam?.valor || 'sintoma'}`;
      
      case 'DIAS_SEM_SINTOMA':
        const diasSemParam = regra.parametros?.find((p: any) => p.tipo === 'quantidade_dias');
        const sintomaSemParam = regra.parametros?.find((p: any) => p.tipo === 'sintoma');
        return `Após ${diasSemParam?.valor || 'X'} dias sem ${sintomaSemParam?.valor || 'sintoma'}`;
      
      case 'CONDICAO_ESPECIFICA':
        const condicaoParam = regra.parametros?.find((p: any) => p.tipo === 'condicao_especifica');
        const condicoes: Record<string, string> = {
          'alta_hospitalar': 'Alta hospitalar',
          'transferencia_uti': 'Transferência para UTI',
          'cirurgia_realizada': 'Cirurgia realizada',
          'exame_controle': 'Exame de controle',
          'avaliacao_medica': 'Avaliação médica'
        };
        return condicoes[condicaoParam?.valor as string] || 'Condição específica';
      
      case 'TRATAMENTO_COMPLETO':
        const antimicrobianoParam = regra.parametros?.find((p: any) => p.tipo === 'nome_antimicrobiano');
        return antimicrobianoParam?.valor 
          ? `Até fim do tratamento com ${antimicrobianoParam.valor}`
          : 'Até fim do tratamento';
      
      default:
        return regra.descricao || 'Regra não especificada';
    }
  };

  useEffect(() => {
    // Avalia quais grupos já estão satisfeitos com base nas regras cumpridas
    const satisfeitos: number[] = [];
    regrasDoIsolamento.grupos.forEach((grupo, index) => {
      const idsRegrasDoGrupo = grupo.regras.map(r => r.id);
      
      if (grupo.logica === 'OU') {
        const algumaRegraDoGrupoCumprida = idsRegrasDoGrupo.some(id => regrasJaCumpridas.includes(id));
        if (algumaRegraDoGrupoCumprida) {
          satisfeitos.push(index);
        }
      } else {
        const todasRegrasDoGrupoCumpridas = idsRegrasDoGrupo.every(id => regrasJaCumpridas.includes(id));
        if (todasRegrasDoGrupoCumpridas) {
          satisfeitos.push(index);
        }
      }
    });
    setGruposSatisfeitos(satisfeitos);

    const logicaPrincipal = regrasDoIsolamento.logica;
    if (logicaPrincipal === 'OU') {
      setPodeFinalizar(satisfeitos.length > 0);
    } else {
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

  const handleFinalizarIsolamento = () => {
    finalizarIsolamentoPaciente(setorId, leitoId, isolamentoId);
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
                    {formatarDescricaoRegra(regra)}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button 
          disabled={!podeFinalizar} 
          className={podeFinalizar ? "bg-green-600 hover:bg-green-700" : ""} 
          onClick={handleFinalizarIsolamento}
        >
          {podeFinalizar ? "✓ Finalizar Isolamento" : "Finalizar Isolamento"}
        </Button>
      </div>
    </div>
  );
};
