
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Search, MapPin, Stethoscope } from 'lucide-react';
import { usePacientes } from '@/hooks/usePacientes';
import { useLeitos } from '@/hooks/useLeitos';
import { useSetores } from '@/hooks/useSetores';
import { useKanban } from '@/hooks/useKanban';
import { Paciente } from '@/types/hospital';

interface AdicionarPacienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdicionarPacienteModal = ({ open, onOpenChange }: AdicionarPacienteModalProps) => {
  const [busca, setBusca] = useState('');
  const { pacientes } = usePacientes();
  const { leitos } = useLeitos();
  const { setores } = useSetores();
  const { kanbanEntries, adicionarPacienteAoKanban } = useKanban();

  // Filtra pacientes que não estão no Kanban e que coincidem com a busca
  const pacientesDisponiveis = useMemo(() => {
    const pacientesNoKanban = new Set(kanbanEntries.map(entry => entry.pacienteId));
    
    return pacientes.filter(paciente => {
      // Exclude patients already in Kanban
      if (pacientesNoKanban.has(paciente.id)) return false;
      
      // Filter by search term
      if (busca.trim() === '') return true;
      
      return paciente.nomeCompleto.toLowerCase().includes(busca.toLowerCase());
    });
  }, [pacientes, kanbanEntries, busca]);

  const handleAdicionarPaciente = async (paciente: Paciente) => {
    await adicionarPacienteAoKanban(paciente);
    onOpenChange(false);
    setBusca('');
  };

  const getPacienteInfo = (paciente: Paciente) => {
    const leito = leitos.find(l => l.id === paciente.leitoId);
    const setor = setores.find(s => s.id === paciente.setorId);
    
    return {
      leito: leito?.codigoLeito || 'N/A',
      setor: setor?.siglaSetor || 'N/A'
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Adicionar Paciente ao Monitoramento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite o nome do paciente para buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[400px] border rounded-md">
            <div className="p-4 space-y-2">
              {pacientesDisponiveis.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    {busca.trim() === '' 
                      ? 'Todos os pacientes já estão sendo monitorados'
                      : 'Nenhum paciente encontrado com esse nome'
                    }
                  </p>
                </div>
              ) : (
                pacientesDisponiveis.map((paciente) => {
                  const info = getPacienteInfo(paciente);
                  
                  return (
                    <div 
                      key={paciente.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{paciente.nomeCompleto}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {info.leito} - {info.setor}
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Stethoscope className="h-3 w-3" />
                            {paciente.especialidadePaciente}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleAdicionarPaciente(paciente)}
                        className="ml-4"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdicionarPacienteModal;
