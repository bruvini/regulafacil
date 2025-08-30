import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import type { useReservaOncologia } from '@/hooks/useReservaOncologia';
import { ReservaOncologia } from '@/types/reservaOncologia';
import { LeitoEnriquecido } from '@/types/hospital';
import { AdicionarEditarReservaModal, ReservaFormData } from './AdicionarEditarReservaModal';
import { ContatoReservaModal } from './ContatoReservaModal';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leitos: LeitoEnriquecido[];
  handleConfirmarReserva: (data: {
    nomeCompleto: string;
    dataNascimento: string;
    sexoPaciente: 'Masculino' | 'Feminino';
    origem: string;
  }, leito: LeitoEnriquecido) => Promise<void>;
  registrarTentativa: ReturnType<typeof useReservaOncologia>['registrarTentativaContato'];
  marcarComoInternado: ReturnType<typeof useReservaOncologia>['marcarComoInternado'];
  adicionarReserva: ReturnType<typeof useReservaOncologia>['adicionarReserva'];
  atualizarReserva: ReturnType<typeof useReservaOncologia>['atualizarReserva'];
  excluirReserva: ReturnType<typeof useReservaOncologia>['excluirReserva'];
  reservas: ReservaOncologia[];
}

export const ReservaOncologiaModal = ({
  open,
  onOpenChange,
  leitos,
  handleConfirmarReserva,
  registrarTentativa,
  marcarComoInternado,
  adicionarReserva,
  atualizarReserva,
  excluirReserva,
  reservas,
}: Props) => {
  const [reservaSelecionada, setReservaSelecionada] = useState<ReservaOncologia | null>(null);
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [contatoOpen, setContatoOpen] = useState(false);

  const openAdicionar = () => {
    setReservaSelecionada(null);
    setAddEditOpen(true);
  };
  const openEditar = (r: ReservaOncologia) => {
    setReservaSelecionada(r);
    setAddEditOpen(true);
  };
  const openContato = (r: ReservaOncologia) => {
    setReservaSelecionada(r);
    setContatoOpen(true);
  };

  const handleSave = async (data: ReservaFormData) => {
    if (reservaSelecionada) {
      await atualizarReserva(reservaSelecionada.id, data);
    } else {
      await adicionarReserva(data);
    }
  };

  const handleExcluir = async (id: string) => {
    await excluirReserva(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="flex justify-between">
          <DialogTitle>Reservas Oncologia</DialogTitle>
          <Button onClick={openAdicionar}>Adicionar Reserva</Button>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Data Prevista</TableHead>
                <TableHead>Tentativas</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservas.map((r) => {
                const atrasado = new Date(r.dataPrevistaInternacao) < new Date();
                return (
                  <TableRow key={r.id} className={atrasado ? 'text-red-500' : ''}>
                    <TableCell>{r.nomeCompleto}</TableCell>
                    <TableCell>{new Date(r.dataPrevistaInternacao).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {r.tentativasContato?.map((t, i) => (
                        <div key={i} className="text-xs">
                          {new Date(t.data).toLocaleDateString()} - {t.sucesso ? 'Sucesso' : t.motivoFalha}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => openContato(r)}>Contato</Button>
                        <Button size="sm" variant="outline" onClick={() => openEditar(r)}>Editar</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleExcluir(r.id)}>Excluir</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
      <AdicionarEditarReservaModal
        open={addEditOpen}
        onOpenChange={setAddEditOpen}
        onSubmit={handleSave}
        reserva={reservaSelecionada}
      />
      <ContatoReservaModal
        open={contatoOpen}
        onOpenChange={setContatoOpen}
        paciente={reservaSelecionada}
        leitos={leitos}
        registrarTentativa={registrarTentativa}
        onConfirmarReserva={async (pac, leito) => {
          await handleConfirmarReserva({
            nomeCompleto: pac.nomeCompleto,
            dataNascimento: pac.dataNascimento,
            sexoPaciente: pac.sexo,
            origem: 'Reserva leito oncologia',
          }, leito);
        }}
        onMarcarInternado={marcarComoInternado}
      />
    </Dialog>
  );
};
