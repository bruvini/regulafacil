
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Scissors, Plus, Edit, Trash2, BedDouble, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCirurgias } from '@/hooks/useCirurgias';
import SolicitacaoCirurgicaForm from '@/components/forms/SolicitacaoCirurgicaForm';
import { SolicitacaoCirurgicaFormData, SolicitacaoCirurgica } from '@/types/hospital';
import { isAfter, isToday, subDays } from 'date-fns';

const MarcacaoCirurgica = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [solicitacaoEdicao, setSolicitacaoEdicao] = useState<SolicitacaoCirurgica | null>(null);
  const [excluirId, setExcluirId] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    nomePaciente: '',
    especialidade: '',
    medicoSolicitante: ''
  });

  const { cirurgias, loading, criarSolicitacao, atualizarSolicitacao, excluirSolicitacao } = useCirurgias();

  // Filtrar cirurgias (remover antigas e aplicar filtros de busca)
  const cirurgiasFiltradas = cirurgias
    .filter(cirurgia => {
      // Remover cirurgias cuja data prevista passou há mais de 24 horas
      const dataLimite = subDays(new Date(), 1);
      return isAfter(cirurgia.dataPrevisaCirurgia, dataLimite);
    })
    .filter(cirurgia => {
      // Aplicar filtros de busca
      const termoPaciente = filtros.nomePaciente.toLowerCase();
      const termoEspecialidade = filtros.especialidade.toLowerCase();
      const termoMedico = filtros.medicoSolicitante.toLowerCase();
      
      return (
        cirurgia.nomeCompleto.toLowerCase().includes(termoPaciente) &&
        cirurgia.especialidade.toLowerCase().includes(termoEspecialidade) &&
        cirurgia.medicoSolicitante.toLowerCase().includes(termoMedico)
      );
    });

  const handleCriarSolicitacao = async (dados: SolicitacaoCirurgicaFormData) => {
    try {
      if (solicitacaoEdicao) {
        await atualizarSolicitacao(solicitacaoEdicao.id!, dados);
      } else {
        await criarSolicitacao(dados);
      }
      setModalAberto(false);
      setSolicitacaoEdicao(null);
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
    }
  };

  const handleEditarSolicitacao = (cirurgia: SolicitacaoCirurgica) => {
    setSolicitacaoEdicao(cirurgia);
    setModalAberto(true);
  };

  const handleExcluirSolicitacao = async () => {
    if (excluirId) {
      try {
        await excluirSolicitacao(excluirId);
        setExcluirId(null);
      } catch (error) {
        console.error('Erro ao excluir solicitação:', error);
      }
    }
  };

  const handleCancelar = () => {
    setModalAberto(false);
    setSolicitacaoEdicao(null);
  };

  const getStatusVisualizacao = (cirurgia: SolicitacaoCirurgica) => {
    const dataInternacao = cirurgia.dataPrevistaInternacao;
    const hoje = new Date();
    
    if (isToday(dataInternacao) || isAfter(hoje, dataInternacao)) {
      if (cirurgia.leitoReservado) {
        return {
          classe: 'bg-green-50 border-green-200',
          icone: <CheckCircle className="h-4 w-4 text-green-600" />,
          status: 'Leito Reservado'
        };
      } else {
        return {
          classe: 'bg-red-50 border-red-200',
          icone: <AlertTriangle className="h-4 w-4 text-red-600" />,
          status: 'Ação Necessária'
        };
      }
    }
    
    return {
      classe: 'bg-white border-border/30',
      icone: null,
      status: 'Pendente'
    };
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

          {/* Filtros */}
          <Card className="mb-6 shadow-card border border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-medical-primary">
                Filtros de Busca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Nome do Paciente"
                  value={filtros.nomePaciente}
                  onChange={(e) => setFiltros(prev => ({ ...prev, nomePaciente: e.target.value }))}
                />
                <Input
                  placeholder="Especialidade"
                  value={filtros.especialidade}
                  onChange={(e) => setFiltros(prev => ({ ...prev, especialidade: e.target.value }))}
                />
                <Input
                  placeholder="Nome do Médico"
                  value={filtros.medicoSolicitante}
                  onChange={(e) => setFiltros(prev => ({ ...prev, medicoSolicitante: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Solicitações */}
          <Card className="shadow-card border border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-medical-primary">
                Lista de Solicitações ({cirurgiasFiltradas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">
                  Carregando solicitações...
                </p>
              ) : cirurgiasFiltradas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma solicitação cirúrgica encontrada.
                </p>
              ) : (
                <div className="space-y-4">
                  {cirurgiasFiltradas.map((cirurgia) => {
                    const statusInfo = getStatusVisualizacao(cirurgia);
                    
                    return (
                      <Card key={cirurgia.id} className={`border ${statusInfo.classe}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                              <div>
                                <p className="font-semibold text-medical-primary">
                                  {cirurgia.nomeCompleto}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {cirurgia.sexo} • {cirurgia.dataNascimento}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {cirurgia.especialidade}
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
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  {statusInfo.icone}
                                  <Badge variant={statusInfo.status === 'Leito Reservado' ? 'default' : 'destructive'}>
                                    {statusInfo.status}
                                  </Badge>
                                </div>
                                {cirurgia.leitoReservado && (
                                  <div className="flex items-center space-x-2 text-sm">
                                    <BedDouble className="h-4 w-4 text-green-600" />
                                    <span className="text-green-700 font-medium">
                                      Leito: {cirurgia.leitoReservado}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex space-x-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditarSolicitacao(cirurgia)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setExcluirId(cirurgia.id!)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Nova/Edição de Solicitação */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-medical-primary">
              {solicitacaoEdicao ? 'Editar Solicitação Cirúrgica' : 'Formulário de Solicitação Cirúrgica'}
            </DialogTitle>
          </DialogHeader>
          <SolicitacaoCirurgicaForm
            onSubmit={handleCriarSolicitacao}
            onCancel={handleCancelar}
            loading={loading}
            initialData={solicitacaoEdicao}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!excluirId} onOpenChange={() => setExcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta solicitação cirúrgica? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluirSolicitacao}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MarcacaoCirurgica;
