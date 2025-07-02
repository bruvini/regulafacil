
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Scissors, Plus } from 'lucide-react';
import { useCirurgias } from '@/hooks/useCirurgias';
import SolicitacaoCirurgicaForm from '@/components/forms/SolicitacaoCirurgicaForm';
import { SolicitacaoCirurgicaFormData } from '@/types/hospital';

const MarcacaoCirurgica = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const { cirurgias, loading, criarSolicitacao, carregarCirurgias } = useCirurgias();

  useEffect(() => {
    carregarCirurgias();
  }, []);

  const handleCriarSolicitacao = async (dados: SolicitacaoCirurgicaFormData) => {
    try {
      await criarSolicitacao(dados);
      setModalAberto(false);
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
    }
  };

  const handleCancelar = () => {
    setModalAberto(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-lg bg-medical-success flex items-center justify-center">
                <Scissors className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-medical-primary mb-4">
              Solicitações Cirúrgicas
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Gerencie e registre novas solicitações de cirurgia
            </p>
            
            <Button 
              onClick={() => setModalAberto(true)}
              size="lg"
              className="bg-medical-primary hover:bg-medical-primary/90 text-white"
            >
              <Plus className="mr-2 h-5 w-5" />
              Incluir Nova Solicitação
            </Button>
          </div>

          <Card className="shadow-card border border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-medical-primary">
                Lista de Solicitações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">
                  Carregando solicitações...
                </p>
              ) : cirurgias.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma solicitação cirúrgica encontrada.
                </p>
              ) : (
                <div className="space-y-4">
                  {cirurgias.map((cirurgia) => (
                    <Card key={cirurgia.id} className="border border-border/30">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="font-semibold text-medical-primary">
                              {cirurgia.nomeCompleto}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {cirurgia.sexo} • {cirurgia.especialidade}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Dr(a). {cirurgia.medicoSolicitante}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Leito: {cirurgia.tipoLeitoNecessario}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm">
                              <span className="font-medium">Internação:</span> {' '}
                              {cirurgia.dataPrevistaInternacao.toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Cirurgia:</span> {' '}
                              {cirurgia.dataPrevisaCirurgia.toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-medical-primary">
              Formulário de Solicitação Cirúrgica
            </DialogTitle>
          </DialogHeader>
          <SolicitacaoCirurgicaForm
            onSubmit={handleCriarSolicitacao}
            onCancel={handleCancelar}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarcacaoCirurgica;
