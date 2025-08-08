
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LeitoEnriquecido } from '@/types/hospital';

const especialidades = [
  "CIRURGIA CABECA E PESCOCO", "CIRURGIA GERAL", "CIRURGIA TORACICA",
  "CIRURGIA VASCULAR", "CLINICA GERAL", "HEMATOLOGIA", "INTENSIVISTA",
  "NEFROLOGIA", "NEUROCIRURGIA", "NEUROLOGIA", "ODONTOLOGIA C.TRAUM.B.M.F.",
  "ONCOLOGIA CIRURGICA", "ONCOLOGIA CLINICA/CANCEROLOGIA",
  "ORTOPEDIA/TRAUMATOLOGIA", "PROCTOLOGIA", "UROLOGIA"
];

const formSchema = z.object({
  dataInternacao: z.string().min(1, 'Data e hora da internação são obrigatórias'),
  especialidade: z.string().min(1, 'Especialidade é obrigatória'),
});

type FormData = z.infer<typeof formSchema>;

interface ConfirmarInternacaoExternaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { dataInternacao: Date; especialidade: string }) => void;
  leito: LeitoEnriquecido | null;
}

export function ConfirmarInternacaoExternaModal({ 
  open, 
  onOpenChange, 
  onConfirm, 
  leito 
}: ConfirmarInternacaoExternaModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataInternacao: '',
      especialidade: '',
    },
  });

  const handleSubmit = (data: FormData) => {
    onConfirm({
      dataInternacao: new Date(data.dataInternacao),
      especialidade: data.especialidade,
    });
    form.reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar Internação Externa</DialogTitle>
          <DialogDescription>
            Leito: {leito?.codigoLeito} - Paciente: {leito?.dadosPaciente?.nomeCompleto}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dataInternacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e Hora da Internação *</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="especialidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidade *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a especialidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {especialidades.map((especialidade) => (
                        <SelectItem key={especialidade} value={especialidade}>
                          {especialidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit">Confirmar Internação</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
