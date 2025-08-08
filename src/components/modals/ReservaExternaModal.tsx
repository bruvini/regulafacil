
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LeitoEnriquecido } from '@/types/hospital';

const formSchema = z.object({
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  sexoPaciente: z.enum(['Masculino', 'Feminino'], {
    required_error: 'Sexo é obrigatório',
  }),
  origem: z.string().min(1, 'Origem do paciente é obrigatória'),
});

type FormData = z.infer<typeof formSchema>;

interface ReservaExternaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: FormData) => void;
  leito: LeitoEnriquecido | null;
}

export function ReservaExternaModal({ open, onOpenChange, onConfirm, leito }: ReservaExternaModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: '',
      dataNascimento: '',
      sexoPaciente: 'Masculino',
      origem: '',
    },
  });

  const handleSubmit = (data: FormData) => {
    onConfirm(data);
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
          <DialogTitle>Reservar Leito para Paciente Externo</DialogTitle>
          <DialogDescription>
            Leito: {leito?.codigoLeito} - Preencha os dados do paciente para reserva
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nomeCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome completo" {...field} />
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
                  <FormLabel>Data de Nascimento *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="DD/MM/AAAA"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sexoPaciente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Masculino" id="masculino-reserva" />
                        <Label htmlFor="masculino-reserva">Masculino</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Feminino" id="feminino-reserva" />
                        <Label htmlFor="feminino-reserva">Feminino</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="origem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origem do Paciente *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ex: Hospital X - Setor Y, Clínica Z, etc."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit">Reservar Leito</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
