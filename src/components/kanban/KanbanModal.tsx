import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

import { Plus, Calendar } from 'lucide-react';
import { useKanban } from '@/hooks/useKanban';
import { usePacientes } from '@/hooks/usePacientes';
import { useLeitos } from '@/hooks/useLeitos';
import { useSetores } from '@/hooks/useSetores';
import { AdicionarPacienteModal } from './AdicionarPacienteModal';
import { format, differenceInDays } from 'date-fns';
import { KanbanEntry } from '@/types/kanban';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PendenciasCell = ({ entry, onAdd }: { entry: KanbanEntry; onAdd: (id: string, texto: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState('');
  return (
    <div className="space-y-1">
      {entry.pendencias.map(p => (
        <div key={p.id} className="text-xs">
          {p.texto} - {format(new Date(p.criadaEm), 'dd/MM')} ({p.criadaPor})
        </div>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="ghost">
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-2">
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Nova pendência"
          />
          <Button
            size="sm"
            onClick={() => {
              onAdd(entry.pacienteId, texto);
              setTexto('');
              setOpen(false);
            }}
            disabled={!texto}
          >
            Adicionar
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const TratativasCell = ({ entry, onAdd }: { entry: KanbanEntry; onAdd: (id: string, texto: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState('');
  return (
    <div className="space-y-1">
      {entry.tratativas.map(t => (
        <div key={t.id} className="text-xs">
          {t.texto} - {format(new Date(t.criadaEm), 'dd/MM')} ({t.criadaPor})
        </div>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="ghost">
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-2">
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Nova tratativa"
          />
          <Button
            size="sm"
            onClick={() => {
              onAdd(entry.pacienteId, texto);
              setTexto('');
              setOpen(false);
            }}
            disabled={!texto}
          >
            Adicionar
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const PrevisaoAltaCell = ({ entry, onUpdate }: { entry: KanbanEntry; onUpdate: (id: string, data: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(entry.previsaoAlta || '');
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <Calendar className="h-4 w-4 mr-1" />
          {entry.previsaoAlta ? format(new Date(entry.previsaoAlta), 'dd/MM') : 'Definir'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 space-y-2">
        <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        <Button
          size="sm"
          onClick={() => {
            onUpdate(entry.pacienteId, data);
            setOpen(false);
          }}
          disabled={!data}
        >
          Salvar
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export const KanbanModal = ({ open, onOpenChange }: Props) => {
  const [adicionarOpen, setAdicionarOpen] = useState(false);
  const [filtroNome, setFiltroNome] = useState('');
  const { kanban, adicionarPendencia, adicionarTratativa, atualizarPrevisaoAlta, adicionarPacienteAoKanban } = useKanban();
  const { pacientes } = usePacientes();
  const { leitos } = useLeitos();
  const { setores } = useSetores();

  const dados = useMemo(() => {
    return kanban
      .map(entry => {
        const paciente = pacientes.find(p => p.id === entry.pacienteId);
        const leito = paciente ? leitos.find(l => l.id === paciente.leitoId) : undefined;
        const setor = paciente ? setores.find(s => s.id === paciente.setorId) : undefined;
        const tempoInternacao = paciente ? differenceInDays(new Date(), new Date(paciente.dataInternacao)) : null;
        return { entry, paciente, leito, setor, tempoInternacao };
      })
      .filter(d => d.paciente && d.paciente.nomeCompleto.toUpperCase().includes(filtroNome.toUpperCase()));
  }, [kanban, pacientes, leitos, setores, filtroNome]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-full">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Kanban NIR</DialogTitle>
          <Button onClick={() => setAdicionarOpen(true)}>Adicionar Paciente ao Monitoramento</Button>
        </DialogHeader>

        <div className="py-4">
          <Input
            placeholder="Filtrar por nome"
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
            className="max-w-sm mb-4"
          />
          <div className="overflow-auto max-h-[70vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Leito</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Tempo Internação</TableHead>
                  <TableHead>Previsão de Alta</TableHead>
                  <TableHead>Pendências para Alta</TableHead>
                  <TableHead>Tratativas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.map(({ entry, paciente, leito, setor, tempoInternacao }) => (
                  <TableRow key={entry.id}>
                    <TableCell>{paciente?.nomeCompleto || 'Paciente não encontrado'}</TableCell>
                    <TableCell>{leito?.codigoLeito || ''}</TableCell>
                    <TableCell>{setor?.siglaSetor || ''}</TableCell>
                    <TableCell>{tempoInternacao !== null ? `${tempoInternacao}d` : '-'}</TableCell>
                    <TableCell>
                      <PrevisaoAltaCell entry={entry} onUpdate={atualizarPrevisaoAlta} />
                    </TableCell>
                    <TableCell>
                      <PendenciasCell entry={entry} onAdd={adicionarPendencia} />
                    </TableCell>
                    <TableCell>
                      <TratativasCell entry={entry} onAdd={adicionarTratativa} />
                    </TableCell>
                  </TableRow>
                ))}
                {dados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                      Nenhum paciente encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
      <AdicionarPacienteModal
        open={adicionarOpen}
        onOpenChange={setAdicionarOpen}
        pacientes={pacientes}
        existentes={kanban.map(k => k.pacienteId)}
        onSelect={adicionarPacienteAoKanban}
      />
    </Dialog>
  );
};
