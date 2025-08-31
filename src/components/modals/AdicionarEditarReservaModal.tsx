import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ReservaOncologia } from '@/types/reservaOncologia';
import { formatarInputData } from '@/lib/utils';

const schema = z.object({
  nomeCompleto: z.string().min(1, 'Nome é obrigatório'),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  sexo: z.enum(['Masculino', 'Feminino']),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  dataPrevistaInternacao: z.string().min(1, 'Data prevista é obrigatória'),
  especialidade: z.enum(['HEMATOLOGIA', 'ONCOLOGIA']),
});

export type ReservaFormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ReservaFormData) => void;
  reserva?: ReservaOncologia | null;
}

export const AdicionarEditarReservaModal = ({ open, onOpenChange, onSubmit, reserva }: Props) => {
  const form = useForm<ReservaFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomeCompleto: '',
      dataNascimento: '',
      sexo: 'Masculino',
      telefone: '',
      dataPrevistaInternacao: '',
      especialidade: 'ONCOLOGIA',
    },
  });

  useEffect(() => {
    if (reserva) {
      form.reset({
        nomeCompleto: reserva.nomeCompleto,
        dataNascimento: reserva.dataNascimento,
        sexo: reserva.sexo,
        telefone: reserva.telefone,
        dataPrevistaInternacao: reserva.dataPrevistaInternacao,
        especialidade: reserva.especialidade,
      });
    } else {
      form.reset({
        nomeCompleto: '',
        dataNascimento: '',
        sexo: 'Masculino',
        telefone: '',
        dataPrevistaInternacao: '',
        especialidade: 'ONCOLOGIA',
      });
    }
  }, [reserva, form]);

  const handleSubmit = (data: ReservaFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{reserva ? 'Editar' : 'Adicionar'} Reserva</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nomeCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataNascimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={10} onChange={(e) => field.onChange(formatarInputData(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sexo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Masculino" id="masc" />
                        <Label htmlFor="masc">Masculino</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Feminino" id="fem" />
                        <Label htmlFor="fem">Feminino</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataPrevistaInternacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Prevista Internação</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={10} onChange={(e) => field.onChange(formatarInputData(e.target.value))} />
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
                  <FormLabel>Especialidade</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HEMATOLOGIA">HEMATOLOGIA</SelectItem>
                        <SelectItem value="ONCOLOGIA">ONCOLOGIA</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
