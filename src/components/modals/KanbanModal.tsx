
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  UserPlus, 
  Clock,
  MapPin,
  Stethoscope,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useKanban } from '@/hooks/useKanban';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AdicionarPacienteModal from './AdicionarPacienteModal';
import { cn } from '@/lib/utils';

interface KanbanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const KanbanModal = ({ open, onOpenChange }: KanbanModalProps) => {
  const {
    kanbanEntries,
    loading,
    adicionarPendencia,
    removerPendencia,
    adicionarTratativa,
    atualizarPrevisaoAlta,
    finalizarMonitoramento
  } = useKanban();

  const [filtroNome, setFiltroNome] = useState('');
  const [showAdicionarModal, setShowAdicionarModal] = useState(false);
  const [novaPendencia, setNovaPendencia] = useState('');
  const [novaTratativa, setNovaTratativa] = useState('');
  const [dataPrevisao, setDataPrevisao] = useState<Date>();

  // Filtrar entradas do Kanban
  const entriesFiltradas = useMemo(() => {
    return kanbanEntries.filter(entry => {
      if (!entry.dadosPaciente) return false;
      
      const nomeMatch = filtroNome === '' || 
        entry.dadosPaciente.nomeCompleto.toLowerCase().includes(filtroNome.toLowerCase());
      
      return nomeMatch;
    });
  }, [kanbanEntries, filtroNome]);

  const handleAdicionarPendencia = async (pacienteId: string, texto: string) => {
    await adicionarPendencia(pacienteId, texto);
    setNovaPendencia('');
  };

  const handleAdicionarTratativa = async (pacienteId: string, texto: string) => {
    await adicionarTratativa(pacienteId, texto);
    setNovaTratativa('');
  };

  const handleAtualizarPrevisao = async (pacienteId: string, data: Date) => {
    const dataFormatada = format(data, 'yyyy-MM-dd');
    await atualizarPrevisaoAlta(pacienteId, dataFormatada);
    setDataPrevisao(undefined);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-full h-full m-0 rounded-none">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-full h-full m-0 rounded-none">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-medical-primary flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-medical-primary flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                Centro de Monitoramento Estratégico - Kanban NIR
              </DialogTitle>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Filtrar por nome do paciente..."
                  value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                  className="w-80"
                />
                <Button 
                  onClick={() => setShowAdicionarModal(true)}
                  variant="medical"
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Adicionar Paciente
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Paciente</TableHead>
                    <TableHead className="w-[80px]">Leito</TableHead>
                    <TableHead className="w-[100px]">Setor</TableHead>
                    <TableHead className="w-[120px]">Tempo Internação</TableHead>
                    <TableHead className="w-[120px]">Especialidade</TableHead>
                    <TableHead className="w-[250px]">Pendências para Alta</TableHead>
                    <TableHead className="w-[250px]">Tratativas</TableHead>
                    <TableHead className="w-[120px]">Previsão Alta</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entriesFiltradas.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.dadosPaciente?.nomeCompleto || 'Paciente não encontrado'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {entry.dadosPaciente?.leitoAtual || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {entry.dadosPaciente?.setorAtual || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {entry.dadosPaciente?.tempoInternacao || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Stethoscope className="h-3 w-3" />
                          {entry.dadosPaciente?.especialidadePaciente || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {entry.pendencias.slice(0, 2).map((pendencia) => (
                            <div key={pendencia.id} className="flex items-center justify-between text-xs bg-yellow-50 p-1 rounded">
                              <span className="flex-1 truncate">{pendencia.texto}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removerPendencia(entry.pacienteId, pendencia.id)}
                                className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {entry.pendencias.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{entry.pendencias.length - 2} mais
                            </Badge>
                          )}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button size="sm" variant="outline" className="w-full h-6">
                                <Plus className="h-3 w-3 mr-1" />
                                Adicionar
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-2">
                                <h4 className="font-medium">Nova Pendência</h4>
                                <Textarea
                                  placeholder="Descreva a pendência..."
                                  value={novaPendencia}
                                  onChange={(e) => setNovaPendencia(e.target.value)}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleAdicionarPendencia(entry.pacienteId, novaPendencia)}
                                  disabled={!novaPendencia.trim()}
                                  className="w-full"
                                >
                                  Adicionar Pendência
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {entry.tratativas.slice(0, 2).map((tratativa) => (
                            <div key={tratativa.id} className="text-xs bg-blue-50 p-1 rounded">
                              <span className="flex-1 truncate">{tratativa.texto}</span>
                            </div>
                          ))}
                          {entry.tratativas.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{entry.tratativas.length - 2} mais
                            </Badge>
                          )}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button size="sm" variant="outline" className="w-full h-6">
                                <Plus className="h-3 w-3 mr-1" />
                                Adicionar
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-2">
                                <h4 className="font-medium">Nova Tratativa</h4>
                                <Textarea
                                  placeholder="Descreva a tratativa..."
                                  value={novaTratativa}
                                  onChange={(e) => setNovaTratativa(e.target.value)}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleAdicionarTratativa(entry.pacienteId, novaTratativa)}
                                  disabled={!novaTratativa.trim()}
                                  className="w-full"
                                >
                                  Adicionar Tratativa
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !entry.previsaoAlta && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {entry.previsaoAlta ? 
                                format(new Date(entry.previsaoAlta), "dd/MM/yyyy", { locale: ptBR }) : 
                                "Definir"
                              }
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dataPrevisao}
                              onSelect={(date) => {
                                if (date) {
                                  handleAtualizarPrevisao(entry.pacienteId, date);
                                }
                              }}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => finalizarMonitoramento(entry.pacienteId)}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Finalizar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {entriesFiltradas.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum paciente em monitoramento</h3>
                <p className="text-muted-foreground">
                  Adicione pacientes ao monitoramento para começar a acompanhar seus casos.
                </p>
                <Button 
                  onClick={() => setShowAdicionarModal(true)}
                  variant="medical"
                  className="mt-4"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Paciente
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AdicionarPacienteModal
        open={showAdicionarModal}
        onOpenChange={setShowAdicionarModal}
      />
    </>
  );
};

export default KanbanModal;
