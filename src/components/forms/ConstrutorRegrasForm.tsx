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
  { value: 'EXAME_NEGATIVO', label: 'Baseado em Exames' },
  { value: 'DIAS_COM_SINTOMA', label: 'Baseado em Sintomas (com sintoma)' },
  { value: 'DIAS_SEM_SINTOMA', label: 'Baseado em Sintomas (sem sintoma)' },
  { value: 'CONDICAO_ESPECIFICA', label: 'Até Condição Específica' },
  { value: 'TRATAMENTO_COMPLETO', label: 'Baseado em Tempo de Tratamento' },
  { value: 'REINTERNACAO_ALERT', label: 'Baseado em Reinternação' }
] as const;

const condicoesEspecificas = [
  { value: 'alta_hospitalar', label: 'Alta hospitalar' },
  { value: 'fechamento_ferida', label: 'Fechamento da ferida operatória' },
  { value: 'liberacao_medica', label: 'Liberação médica' }
];

const ConstrutorRegrasForm = ({ regras, onChange }: ConstrutorRegrasFormProps) => {
  const gerarId = () => crypto.randomUUID();

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
      id: gerarId(),
      tipo: 'CONDICAO_ESPECIFICA',
      descricao: 'Até Condição Específica',
      parametros: []
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
    const regra = novosGrupos[indiceGrupo].regras[indiceRegra];
    
    regra.tipo = novoTipo as RegraIsolamento['tipo'];
    regra.descricao = tiposRegra.find(t => t.value === novoTipo)?.label || '';
    regra.parametros = []; // Reset parâmetros ao mudar o tipo
    
    // Adicionar parâmetros padrão baseado no tipo
    switch (novoTipo) {
      case 'EXAME_NEGATIVO':
        regra.parametros = [{
          id: gerarId(),
          tipo: 'nome_exame',
          valor: ''
        }];
        break;
      case 'DIAS_COM_SINTOMA':
      case 'DIAS_SEM_SINTOMA':
        regra.parametros = [
          {
            id: gerarId(),
            tipo: 'quantidade_dias',
            valor: 0
          },
          {
            id: gerarId(),
            tipo: 'nome_sintoma',
            valor: ''
          }
        ];
        break;
      case 'CONDICAO_ESPECIFICA':
        regra.parametros = [{
          id: gerarId(),
          tipo: 'condicao_especifica',
          valor: 'alta_hospitalar'
        }];
        break;
      case 'TRATAMENTO_COMPLETO':
        regra.parametros = [{
          id: gerarId(),
          tipo: 'nome_antimicrobiano',
          valor: ''
        }];
        break;
      case 'REINTERNACAO_ALERT':
        regra.parametros = [
          {
            id: gerarId(),
            tipo: 'periodo_alerta',
            valor: 30
          },
          {
            id: gerarId(),
            tipo: 'cultura_referencia',
            valor: ''
          }
        ];
        break;
    }
    
    onChange({
      ...regras,
      grupos: novosGrupos
    });
  };

  const atualizarParametro = (indiceGrupo: number, indiceRegra: number, indiceParametro: number, valor: string | number) => {
    const novosGrupos = [...regras.grupos];
    novosGrupos[indiceGrupo].regras[indiceRegra].parametros[indiceParametro].valor = valor;
    
    onChange({
      ...regras,
      grupos: novosGrupos
    });
  };

  const adicionarParametroExame = (indiceGrupo: number, indiceRegra: number) => {
    const novosGrupos = [...regras.grupos];
    novosGrupos[indiceGrupo].regras[indiceRegra].parametros.push({
      id: gerarId(),
      tipo: 'nome_exame',
      valor: ''
    });
    
    onChange({
      ...regras,
      grupos: novosGrupos
    });
  };

  const removerParametro = (indiceGrupo: number, indiceRegra: number, indiceParametro: number) => {
    const novosGrupos = [...regras.grupos];
    novosGrupos[indiceGrupo].regras[indiceRegra].parametros = 
      novosGrupos[indiceGrupo].regras[indiceRegra].parametros.filter((_, index) => index !== indiceParametro);
    
    onChange({
      ...regras,
      grupos: novosGrupos
    });
  };

  const renderizarParametros = (regra: RegraIsolamento, indiceGrupo: number, indiceRegra: number) => {
    switch (regra.tipo) {
      case 'EXAME_NEGATIVO':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">Exames necessários:</label>
            {regra.parametros.filter(p => p.tipo === 'nome_exame').map((parametro, indiceParametro) => (
              <div key={parametro.id} className="flex gap-2 items-center">
                <Input
                  placeholder="Nome do exame (ex: Cultura de vigilância)"
                  value={parametro.valor as string}
                  onChange={(e) => atualizarParametro(indiceGrupo, indiceRegra, indiceParametro, e.target.value)}
                  className="flex-1"
                />
                {regra.parametros.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removerParametro(indiceGrupo, indiceRegra, indiceParametro)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => adicionarParametroExame(indiceGrupo, indiceRegra)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Exame
            </Button>
          </div>
        );

      case 'DIAS_COM_SINTOMA':
      case 'DIAS_SEM_SINTOMA':
        const diasParam = regra.parametros.find(p => p.tipo === 'quantidade_dias');
        const sintomaParam = regra.parametros.find(p => p.tipo === 'nome_sintoma');
        return (
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Dias"
              className="w-20"
              value={diasParam?.valor || ''}
              onChange={(e) => {
                const indiceParam = regra.parametros.findIndex(p => p.tipo === 'quantidade_dias');
                if (indiceParam >= 0) {
                  atualizarParametro(indiceGrupo, indiceRegra, indiceParam, parseInt(e.target.value) || 0);
                }
              }}
            />
            <span className="text-sm text-muted-foreground">
              {regra.tipo === 'DIAS_COM_SINTOMA' ? 'com' : 'sem'}
            </span>
            <Input
              placeholder="Nome do sintoma"
              className="flex-1"
              value={sintomaParam?.valor as string || ''}
              onChange={(e) => {
                const indiceParam = regra.parametros.findIndex(p => p.tipo === 'nome_sintoma');
                if (indiceParam >= 0) {
                  atualizarParametro(indiceGrupo, indiceRegra, indiceParam, e.target.value);
                }
              }}
            />
          </div>
        );

      case 'CONDICAO_ESPECIFICA':
        const condicaoParam = regra.parametros.find(p => p.tipo === 'condicao_especifica');
        return (
          <Select
            value={condicaoParam?.valor as string}
            onValueChange={(value) => {
              const indiceParam = regra.parametros.findIndex(p => p.tipo === 'condicao_especifica');
              if (indiceParam >= 0) {
                atualizarParametro(indiceGrupo, indiceRegra, indiceParam, value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma condição" />
            </SelectTrigger>
            <SelectContent>
              {condicoesEspecificas.map((condicao) => (
                <SelectItem key={condicao.value} value={condicao.value}>
                  {condicao.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'TRATAMENTO_COMPLETO':
        const antimicrobianoParam = regra.parametros.find(p => p.tipo === 'nome_antimicrobiano');
        return (
          <Input
            placeholder="Nome do antimicrobiano (opcional)"
            value={antimicrobianoParam?.valor as string || ''}
            onChange={(e) => {
              const indiceParam = regra.parametros.findIndex(p => p.tipo === 'nome_antimicrobiano');
              if (indiceParam >= 0) {
                atualizarParametro(indiceGrupo, indiceRegra, indiceParam, e.target.value);
              }
            }}
          />
        );

      case 'REINTERNACAO_ALERT':
        const periodoParam = regra.parametros.find(p => p.tipo === 'periodo_alerta');
        const culturaParam = regra.parametros.find(p => p.tipo === 'cultura_referencia');
        return (
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Período"
                className="w-24"
                value={periodoParam?.valor || ''}
                onChange={(e) => {
                  const indiceParam = regra.parametros.findIndex(p => p.tipo === 'periodo_alerta');
                  if (indiceParam >= 0) {
                    atualizarParametro(indiceGrupo, indiceRegra, indiceParam, parseInt(e.target.value) || 30);
                  }
                }}
              />
              <span className="text-sm text-muted-foreground">dias de alerta</span>
            </div>
            <Input
              placeholder="Nome da cultura/exame de referência"
              value={culturaParam?.valor as string || ''}
              onChange={(e) => {
                const indiceParam = regra.parametros.findIndex(p => p.tipo === 'cultura_referencia');
                if (indiceParam >= 0) {
                  atualizarParametro(indiceGrupo, indiceRegra, indiceParam, e.target.value);
                }
              }}
            />
          </div>
        );

      default:
        return null;
    }
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

              <div className="space-y-4">
                {grupo.regras.map((regra, indiceRegra) => (
                  <Card key={regra.id} className="bg-muted/50">
                    <CardContent className="p-3">
                      <div className="space-y-3">
                        <div className="flex gap-2 items-center">
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
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removerRegra(indiceGrupo, indiceRegra)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {renderizarParametros(regra, indiceGrupo, indiceRegra)}
                      </div>
                    </CardContent>
                  </Card>
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
