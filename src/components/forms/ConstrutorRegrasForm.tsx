
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { RegrasPrecaucao, GrupoRegras, RegraIsolamento, ParametroRegra } from '@/types/isolamento';

interface ConstrutorRegrasFormProps {
  regras: RegrasPrecaucao;
  onChange: (regras: RegrasPrecaucao) => void;
}

const tiposRegra = [
  { value: 'ATE_ALTA', label: 'Até alta hospitalar' },
  { value: 'ATE_FECHAMENTO_FERIDA', label: 'Até fechamento da ferida' },
  { value: 'ATE_FINALIZAR_TRATAMENTO', label: 'Até finalizar tratamento' },
  { value: 'ATE_RESULTADO_EXAME_NEGATIVO', label: 'Após resultado de exame negativo' },
  { value: 'APOS_X_DIAS_SINTOMA', label: 'Após X dias do início de sintoma' },
  { value: 'APOS_X_DIAS_SEM_SINTOMA', label: 'Após X dias sem sintoma' },
  { value: 'LIBERACAO_MEDICA', label: 'Mediante liberação médica' }
] as const;

const ConstrutorRegrasForm = ({ regras, onChange }: ConstrutorRegrasFormProps) => {
  const adicionarGrupo = () => {
    const novoGrupo: GrupoRegras = {
      logica: 'E',
      regras: []
    };
    
    onChange({
      ...regras,
      grupos: [...regras.grupos, novoGrupo]
    });
  };

  const removerGrupo = (indiceGrupo: number) => {
    const novosGrupos = regras.grupos.filter((_, index) => index !== indiceGrupo);
    onChange({
      ...regras,
      grupos: novosGrupos
    });
  };

  const adicionarRegra = (indiceGrupo: number) => {
    const novaRegra: RegraIsolamento = {
      tipo: 'ATE_ALTA',
      parametro: null
    };

    const novosGrupos = [...regras.grupos];
    novosGrupos[indiceGrupo].regras.push(novaRegra);
    
    onChange({
      ...regras,
      grupos: novosGrupos
    });
  };

  const removerRegra = (indiceGrupo: number, indiceRegra: number) => {
    const novosGrupos = [...regras.grupos];
    novosGrupos[indiceGrupo].regras = novosGrupos[indiceGrupo].regras.filter((_, index) => index !== indiceRegra);
    
    onChange({
      ...regras,
      grupos: novosGrupos
    });
  };

  const atualizarTipoRegra = (indiceGrupo: number, indiceRegra: number, novoTipo: string) => {
    const novosGrupos = [...regras.grupos];
    novosGrupos[indiceGrupo].regras[indiceRegra].tipo = novoTipo as RegraIsolamento['tipo'];
    
    // Reset parametro quando muda o tipo
    novosGrupos[indiceGrupo].regras[indiceRegra].parametro = null;
    
    onChange({
      ...regras,
      grupos: novosGrupos
    });
  };

  const atualizarParametro = (indiceGrupo: number, indiceRegra: number, campo: keyof ParametroRegra, valor: string | number) => {
    const novosGrupos = [...regras.grupos];
    const regra = novosGrupos[indiceGrupo].regras[indiceRegra];
    
    if (!regra.parametro) {
      regra.parametro = {};
    }
    
    // Type-safe parameter update
    if (campo === 'dias' && typeof valor === 'number') {
      regra.parametro.dias = valor;
    } else if (campo === 'sintoma' && typeof valor === 'string') {
      regra.parametro.sintoma = valor;
    } else if (campo === 'exame' && typeof valor === 'string') {
      regra.parametro.exame = valor;
    }
    
    onChange({
      ...regras,
      grupos: novosGrupos
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Lógica Principal do Isolamento
        </label>
        <Select 
          value={regras.logica} 
          onValueChange={(value) => onChange({ ...regras, logica: value as 'E' | 'OU' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="E">O paciente sairá do isolamento se cumprir TODAS as condições (E)</SelectItem>
            <SelectItem value="OU">O paciente sairá do isolamento se cumprir QUALQUER UMA das condições (OU)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {regras.grupos.map((grupo, indiceGrupo) => (
          <Card key={indiceGrupo} className="border-2 border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Grupo de Condições {indiceGrupo + 1}</h4>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removerGrupo(indiceGrupo)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {grupo.regras.map((regra, indiceRegra) => (
                  <div key={indiceRegra} className="flex gap-2 items-center">
                    <Select
                      value={regra.tipo}
                      onValueChange={(value) => atualizarTipoRegra(indiceGrupo, indiceRegra, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposRegra.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {(regra.tipo === 'APOS_X_DIAS_SINTOMA' || regra.tipo === 'APOS_X_DIAS_SEM_SINTOMA') && (
                      <>
                        <Input
                          type="number"
                          placeholder="Dias"
                          className="w-20"
                          value={regra.parametro?.dias || ''}
                          onChange={(e) => atualizarParametro(indiceGrupo, indiceRegra, 'dias', parseInt(e.target.value) || 0)}
                        />
                        <Input
                          placeholder="Sintoma"
                          className="flex-1"
                          value={regra.parametro?.sintoma || ''}
                          onChange={(e) => atualizarParametro(indiceGrupo, indiceRegra, 'sintoma', e.target.value)}
                        />
                      </>
                    )}

                    {regra.tipo === 'ATE_RESULTADO_EXAME_NEGATIVO' && (
                      <Input
                        placeholder="Nome do exame"
                        className="flex-1"
                        value={regra.parametro?.exame || ''}
                        onChange={(e) => atualizarParametro(indiceGrupo, indiceRegra, 'exame', e.target.value)}
                      />
                    )}

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removerRegra(indiceGrupo, indiceRegra)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => adicionarRegra(indiceGrupo)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Regra (E)
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={adicionarGrupo}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Grupo de Regras
        </Button>
      </div>
    </div>
  );
};

export default ConstrutorRegrasForm;
