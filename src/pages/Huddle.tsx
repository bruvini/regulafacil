
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHuddle } from '@/hooks/useHuddle';
import { useHuddleList } from '@/hooks/useHuddleList';
import { CardPendencia } from '@/components/CardPendencia';
import { PendenciaHuddleModal } from '@/components/modals/PendenciaHuddleModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Printer, Plus, History, Users, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pendencia } from '@/types/huddle';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Huddle = () => {
  const { huddleList } = useHuddleList();
  const [dataSelecionada] = useState(new Date());
  const [turno] = useState(() => {
    const hora = new Date().getHours();
    return hora < 14 ? 'Manhã' : 'Tarde';
  });
  
  const [huddleId, setHuddleId] = useState(`${format(dataSelecionada, 'yyyy-MM-dd')}-${turno}`);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPendencia, setSelectedPendencia] = useState<Pendencia | null>(null);

  const { pendencias, loading, adicionarPendencia, atualizarStatusPendencia } = useHuddle(huddleId);

  useEffect(() => {
    if (huddleList.length > 0 && !huddleId) {
      setHuddleId(huddleList[0].id);
    }
  }, [huddleList, huddleId]);

  const colunas = useMemo(() => ({
    PENDENTE: pendencias.filter(p => p.status === 'PENDENTE'),
    EM_ANDAMENTO: pendencias.filter(p => p.status === 'EM_ANDAMENTO'),
    RESOLVIDO: pendencias.filter(p => p.status === 'RESOLVIDO'),
  }), [pendencias]);

  const handleGeneratePdf = () => {
    const doc = new jsPDF();
    const selectedHuddle = huddleList.find(h => h.id === huddleId);
    const turnoLabel = selectedHuddle?.turno === 'Manhã' ? 'Manhã' : 'Tarde';
    const dataFormatada = selectedHuddle ? format(selectedHuddle.data, 'dd/MM/yyyy') : format(dataSelecionada, 'dd/MM/yyyy');
    
    doc.setFontSize(16);
    doc.text(`Relatório de Pendências - Huddle ${turnoLabel}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Data: ${dataFormatada}`, 14, 30);

    const getCategoryLabel = (categoria: string) => {
      switch (categoria) {
        case 'ALTA_PROLONGADA': return 'Alta Prolongada';
        case 'VAGA_UTI': return 'Vaga UTI';
        case 'SISREG': return 'SISREG';
        case 'INTERNACAO_PROLONGADA': return 'Internação Prolongada';
        default: return 'Outros';
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'PENDENTE': return 'Para Discutir';
        case 'EM_ANDAMENTO': return 'Em Andamento';
        case 'RESOLVIDO': return 'Resolvido';
        default: return status;
      }
    };

    const tableData = pendencias.map(p => [
      getCategoryLabel(p.categoria),
      p.titulo,
      p.responsavel.nome,
      getStatusLabel(p.status),
    ]);

    (doc as any).autoTable({
      head: [['Categoria', 'Título da Pendência', 'Responsável', 'Status']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`huddle_${format(dataSelecionada, 'yyyy-MM-dd')}_${turnoLabel}.pdf`);
  };

  const handleStatusChange = (pendenciaId: string, novoStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'RESOLVIDO') => {
    atualizarStatusPendencia(huddleId, pendenciaId, novoStatus);
  };

  const handleOpenDetails = (pendencia: Pendencia) => {
    setSelectedPendencia(pendencia);
  };

  const turnoLabel = turno === 'Manhã' ? 'Manhã' : 'Tarde';
  const dataFormatada = format(dataSelecionada, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando huddle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-lg bg-medical-primary flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-medical-primary">
                  Quadro de Comando Huddle
                </h1>
                <p className="text-muted-foreground">
                  O ponto de encontro da regulação para um fluxo de cuidados ágil e seguro.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={huddleId} onValueChange={setHuddleId}>
              <SelectTrigger className="w-[280px]">
                <History className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Ver histórico..." />
              </SelectTrigger>
              <SelectContent>
                {huddleList.map(huddle => (
                  <SelectItem key={huddle.id} value={huddle.id}>
                    {`${format(huddle.data, 'dd/MM/yyyy')} - ${huddle.turno === 'Manhã' ? 'Manhã' : 'Tarde'}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleGeneratePdf}>
              <Printer className="mr-2 h-4 w-4" />
              Gerar PDF
            </Button>
            <Button variant="medical" onClick={() => setModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Pendência
            </Button>
          </div>
        </div>

        {/* Card de Indicadores */}
        <Card className="mb-8 bg-gradient-to-r from-medical-primary/5 to-medical-secondary/5 border-medical-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-medical-primary" />
              Indicadores do Turno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-medical-primary">{pendencias.length}</div>
                <div className="text-sm text-muted-foreground">Total de Pendências</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{colunas.PENDENTE.length}</div>
                <div className="text-sm text-muted-foreground">Para Discutir</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{colunas.EM_ANDAMENTO.length}</div>
                <div className="text-sm text-muted-foreground">Em Andamento</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{colunas.RESOLVIDO.length}</div>
                <div className="text-sm text-muted-foreground">Resolvidas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quadro Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coluna PENDENTE */}
          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                Para Discutir
                <Badge variant="secondary" className="ml-auto">
                  {colunas.PENDENTE.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {colunas.PENDENTE.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma pendência para discutir
                </p>
              ) : (
                colunas.PENDENTE.map((pendencia) => (
                  <CardPendencia
                    key={pendencia.id}
                    pendencia={pendencia}
                    onStatusChange={handleStatusChange}
                    onOpenDetails={handleOpenDetails}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Coluna EM ANDAMENTO */}
          <Card className="border-yellow-200">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-5 w-5" />
                Em Andamento
                <Badge variant="secondary" className="ml-auto">
                  {colunas.EM_ANDAMENTO.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {colunas.EM_ANDAMENTO.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma pendência em andamento
                </p>
              ) : (
                colunas.EM_ANDAMENTO.map((pendencia) => (
                  <CardPendencia
                    key={pendencia.id}
                    pendencia={pendencia}
                    onStatusChange={handleStatusChange}
                    onOpenDetails={handleOpenDetails}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Coluna RESOLVIDO */}
          <Card className="border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <TrendingUp className="h-5 w-5" />
                Resolvido no Turno
                <Badge variant="secondary" className="ml-auto">
                  {colunas.RESOLVIDO.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {colunas.RESOLVIDO.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma pendência resolvida
                </p>
              ) : (
                colunas.RESOLVIDO.map((pendencia) => (
                  <CardPendencia
                    key={pendencia.id}
                    pendencia={pendencia}
                    onStatusChange={handleStatusChange}
                    onOpenDetails={handleOpenDetails}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PendenciaHuddleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={(pendencia) => adicionarPendencia(huddleId, pendencia)}
      />
    </div>
  );
};

export default Huddle;
