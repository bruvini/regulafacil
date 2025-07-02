
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useIsolamentos } from '@/hooks/useIsolamentos';
import { TipoIsolamento, TipoIsolamentoFormData } from '@/types/isolamento';
import ConstrutorRegrasForm from '@/components/forms/ConstrutorRegrasForm';

interface GerenciamentoIsolamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GerenciamentoIsolamentoModal = ({ open, onOpenChange }: GerenciamentoIsolamentoModalProps) => {
  const { isolamentos, loading, criarIsolamento, atualizarIsolamento, excluirIsolamento } = useIsolamentos();
  
  const [editingIsolamento, setEditingIsolamento] = useState<TipoIsolamento | null>(null);
  const [formData, setFormData] = useState<TipoIsolamentoFormData>({
    nomeMicroorganismo: '',
    sigla: '',
    perfilSensibilidade: '',
    cor: '#FF5733',
    regrasPrecaucao: {
      logica: 'E',
      grupos: []
    }
  });

  const resetForm = () => {
    setFormData({
      nomeMicroorganismo: '',
      sigla: '',
      perfilSensibilidade: '',
      cor: '#FF5733',
      regrasPrecaucao: {
        logica: 'E',
        grupos: []
      }
    });
    setEditingIsolamento(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.nomeMicroorganismo.trim() === '' || formData.sigla.trim() === '') {
      return;
    }

    if (editingIsolamento) {
      await atualizarIsolamento(editingIsolamento.id!, formData);
    } else {
      await criarIsolamento(formData);
    }
    
    resetForm();
  };

  const handleEdit = (isolamento: TipoIsolamento) => {
    setFormData({
      nomeMicroorganismo: isolamento.nomeMicroorganismo,
      sigla: isolamento.sigla,
      perfilSensibilidade: isolamento.perfilSensibilidade,
      cor: isolamento.cor,
      regrasPrecaucao: isolamento.regrasPrecaucao
    });
    setEditingIsolamento(isolamento);
  };

  const formatarRegrasParaVisualizacao = (regrasPrecaucao: RegrasPrecaucao) => {
    if (!regrasPrecaucao.grupos || regrasPrecaucao.grupos.length === 0) {
      return 'Nenhuma regra definida';
    }

    const gruposFormatados = regrasPrecaucao.grupos.map((grupo, index) => {
      const regrasFormatadas = grupo.regras.map((regra) => {
        let descricaoRegra = '';
        
        switch (regra.tipo) {
          case 'EXAME_NEGATIVO':
            const exames = regra.parametros
              .filter(p => p.tipo === 'nome_exame')
              .map(p => p.valor)
              .join(', ');
            descricaoRegra = `Até resultado negativo de: ${exames}`;
            break;
            
          case 'DIAS_COM_SINTOMA':
            const diasCom = regra.parametros.find(p => p.tipo === 'quantidade_dias')?.valor || 'X';
            const sintomaCom = regra.parametros.find(p => p.tipo === 'nome_sintoma')?.valor || 'sintoma';
            descricaoRegra = `Após ${diasCom} dias com ${sintomaCom}`;
            break;
            
          case 'DIAS_SEM_SINTOMA':
            const diasSem = regra.parametros.find(p => p.tipo === 'quantidade_dias')?.valor || 'X';
            const sintomaSem = regra.parametros.find(p => p.tipo === 'nome_sintoma')?.valor || 'sintoma';
            descricaoRegra = `Após ${diasSem} dias sem ${sintomaSem}`;
            break;
            
          case 'CONDICAO_ESPECIFICA':
            const condicao = regra.parametros.find(p => p.tipo === 'condicao_especifica')?.valor;
            const condicaoTexto = {
              'alta_hospitalar': 'Alta hospitalar',
              'fechamento_ferida': 'Fechamento da ferida',
              'liberacao_medica': 'Liberação médica'
            }[condicao as string] || 'Condição específica';
            descricaoRegra = `Até ${condicaoTexto}`;
            break;
            
          case 'TRATAMENTO_COMPLETO':
            const antimicrobiano = regra.parametros.find(p => p.tipo === 'nome_antimicrobiano')?.valor;
            descricaoRegra = antimicrobiano 
              ? `Até fim do tratamento com ${antimicrobiano}`
              : 'Até fim do tratamento';
            break;
            
          case 'REINTERNACAO_ALERT':
            const periodo = regra.parametros.find(p => p.tipo === 'periodo_alerta')?.valor || 30;
            const cultura = regra.parametros.find(p => p.tipo === 'cultura_referencia')?.valor || 'cultura';
            descricaoRegra = `Alerta por ${periodo} dias (ref: ${cultura})`;
            break;
            
          default:
            descricaoRegra = 'Regra não definida';
        }
        
        return descricaoRegra;
      });

      return `Condição ${index + 1}: (${regrasFormatadas.join(' E ')})`;
    });

    return gruposFormatados.join(` ${regrasPrecaucao.logica} `);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-medical-primary">
            Gerenciar Tipos de Isolamento
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda - Formulário */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">
              {editingIsolamento ? 'Editar Tipo de Isolamento' : 'Novo Tipo de Isolamento'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome do Microorganismo *
                </label>
                <Input
                  value={formData.nomeMicroorganismo}
                  onChange={(e) => setFormData({ ...formData, nomeMicroorganismo: e.target.value })}
                  placeholder="Ex: Acinetobacter baumannii"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Sigla *
                </label>
                <Input
                  value={formData.sigla}
                  onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                  placeholder="Ex: ACINETO"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Perfil de Sensibilidade
                </label>
                <Textarea
                  value={formData.perfilSensibilidade}
                  onChange={(e) => setFormData({ ...formData, perfilSensibilidade: e.target.value })}
                  placeholder="Ex: Multirresistente (MDR)"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cor de Identificação
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="w-12 h-10 rounded border border-input"
                  />
                  <Input
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    placeholder="#FF5733"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Regras de Precaução
                </label>
                <ConstrutorRegrasForm
                  regras={formData.regrasPrecaucao}
                  onChange={(regras) => setFormData({ ...formData, regrasPrecaucao: regras })}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {editingIsolamento ? 'Atualizar' : 'Criar'} Isolamento
                </Button>
                {editingIsolamento && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar Edição
                  </Button>
                )}
              </div>
            </form>
          </div>
          
          {/* Coluna Direita - Lista */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Isolamentos Cadastrados</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {isolamentos.map((isolamento) => (
                <Card key={isolamento.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{isolamento.nomeMicroorganismo}</h4>
                          <Badge style={{ backgroundColor: isolamento.cor, color: 'white' }} className="mt-1">
                            {isolamento.sigla}
                          </Badge>
                          {isolamento.perfilSensibilidade && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {isolamento.perfilSensibilidade}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(isolamento)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Deseja realmente excluir o tipo de isolamento "{isolamento.nomeMicroorganismo}"?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => isolamento.id && excluirIsolamento(isolamento.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <strong>Regras:</strong> {formatarRegrasParaVisualizacao(isolamento.regrasPrecaucao)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {isolamentos.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum tipo de isolamento cadastrado
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GerenciamentoIsolamentoModal;
