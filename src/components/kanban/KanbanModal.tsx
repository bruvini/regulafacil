import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Calendar,
  User,
  BedDouble,
  MapPin,
  Stethoscope,
  Clock,
  CalendarDays,
  ClipboardList,
  FileText,
  CheckSquare,
  Dot
} from 'lucide-react';
import { useKanban } from '@/hooks/useKanban';
import { usePacientes } from '@/hooks/usePacientes';
import { useLeitos } from '@/hooks/useLeitos';
import { useSetores } from '@/hooks/useSetores';
import { AdicionarPacienteModal } from './AdicionarPacienteModal';
import { format, differenceInDays } from 'date-fns';
import { KanbanEntry } from '@/types/kanban';
import { parseDateFromString } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PendenciasCell = ({ entry, onAdd }: { entry: KanbanEntry; onAdd: (id: string, texto: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState('');
  return (
    <div className="space-y-1">
      {entry.pendencias.map((p) => (
        <div key={p.id} className="flex items-start text-xs gap-1">
          <Dot className="h-3 w-3 mt-0.5" />
          <span>
            {p.texto} - {format(new Date(p.criadaEm), 'dd/MM')} ({p.criadaPor})
          </span>
        </div>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="ghost">
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-64 space-y-2">
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
      {entry.tratativas.map((t) => (
        <div key={t.id} className="flex items-start text-xs gap-1">
          <Dot className="h-3 w-3 mt-0.5" />
          <span>
            {t.texto} - {format(new Date(t.criadaEm), 'dd/MM')} ({t.criadaPor})
          </span>
        </div>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="ghost">
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-64 space-y-2">
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
      <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-48 space-y-2">
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
  const [mostrarFinalizados, setMostrarFinalizados] = useState(false);
  const {
    kanban,
    adicionarPendencia,
    adicionarTratativa,
    atualizarPrevisaoAlta,
    adicionarPacienteAoKanban,
    finalizarMonitoramento,
  } = useKanban();
  const { pacientes } = usePacientes();
  const { leitos } = useLeitos();
  const { setores } = useSetores();

  const dados = useMemo(() => {
    return kanban
      .filter((entry) => (mostrarFinalizados ? true : !entry.finalizado))
      .map((entry) => {
        const paciente = pacientes.find((p) => p.id === entry.pacienteId);
        const leito = paciente ? leitos.find((l) => l.id === paciente.leitoId) : undefined;
        const setor = paciente ? setores.find((s) => s.id === paciente.setorId) : undefined;
        const dataInternacaoDate = paciente ? parseDateFromString(paciente.dataInternacao) : null;
        const tempoInternacao = dataInternacaoDate ? differenceInDays(new Date(), dataInternacaoDate) : null;
        return { entry, paciente, leito, setor, tempoInternacao };
      })
      .filter(
        (d) =>
          d.paciente &&
          d.paciente.nomeCompleto.toUpperCase().includes(filtroNome.toUpperCase())
      );
  }, [kanban, pacientes, leitos, setores, filtroNome, mostrarFinalizados]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-full">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Kanban NIR</DialogTitle>
          <Button onClick={() => setAdicionarOpen(true)}>Adicionar Paciente ao Monitoramento</Button>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <Input
              placeholder="Filtrar por nome"
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mostrarFinalizados"
                checked={mostrarFinalizados}
                onCheckedChange={(v) => setMostrarFinalizados(!!v)}
              />
              <label htmlFor="mostrarFinalizados" className="text-sm text-muted-foreground">
                Mostrar finalizados
              </label>
            </div>
          </div>
          <div className="overflow-auto max-h-[70vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <User className="inline h-4 w-4 mr-1" /> Nome
                  </TableHead>
                  <TableHead>
                    <BedDouble className="inline h-4 w-4 mr-1" /> Leito
                  </TableHead>
                  <TableHead>
                    <MapPin className="inline h-4 w-4 mr-1" /> Setor
                  </TableHead>
                  <TableHead>
                    <Stethoscope className="inline h-4 w-4 mr-1" /> Especialidade
                  </TableHead>
                  <TableHead>
                    <Clock className="inline h-4 w-4 mr-1" /> Tempo Internação
                  </TableHead>
                  <TableHead>
                    <CalendarDays className="inline h-4 w-4 mr-1" /> Previsão de Alta
                  </TableHead>
                  <TableHead>
                    <ClipboardList className="inline h-4 w-4 mr-1" /> Pendências para Alta
                  </TableHead>
                  <TableHead>
                    <FileText className="inline h-4 w-4 mr-1" /> Tratativas
                  </TableHead>
                  <TableHead>
                    <CheckSquare className="inline h-4 w-4 mr-1" /> Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.map(({ entry, paciente, leito, setor, tempoInternacao }) => {
                  const tempoClasse =
                    tempoInternacao === null
                      ? ''
                      : tempoInternacao > 60
                      ? 'text-red-600 font-bold'
                      : tempoInternacao > 30
                      ? 'text-yellow-600 font-medium'
                      : '';
                  return (
                    <TableRow key={entry.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-bold text-base">
                            {paciente?.nomeCompleto || 'Paciente não encontrado'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Adicionado por {entry.monitoradoPor} em{' '}
                            {format(new Date(entry.monitoradoDesde), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{leito?.codigoLeito || ''}</TableCell>
                      <TableCell>{setor?.siglaSetor || ''}</TableCell>
                      <TableCell>{paciente?.especialidadePaciente || ''}</TableCell>
                      <TableCell className={tempoClasse}>
                        {tempoInternacao !== null ? `${tempoInternacao}d` : '-'}
                      </TableCell>
                      <TableCell>
                        <PrevisaoAltaCell entry={entry} onUpdate={atualizarPrevisaoAlta} />
                      </TableCell>
                      <TableCell>
                        <PendenciasCell entry={entry} onAdd={adicionarPendencia} />
                      </TableCell>
                      <TableCell>
                        <TratativasCell entry={entry} onAdd={adicionarTratativa} />
                      </TableCell>
                      <TableCell>
                        {entry.finalizado ? (
                          <span className="text-xs text-muted-foreground">Finalizado</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => finalizarMonitoramento(entry.pacienteId)}
                          >
                            <CheckSquare className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {dados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
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
