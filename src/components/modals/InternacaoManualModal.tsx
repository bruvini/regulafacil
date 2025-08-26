
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import InputMask from 'react-input-mask';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LeitoEnriquecido } from '@/types/hospital';

const formSchema = z.object({
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  sexoPaciente: z.enum(['Masculino', 'Feminino'], {
    required_error: 'Sexo é obrigatório',
  }),
  dataInternacao: z.string().min(1, 'Data e hora da internação são obrigatórias'),
  especialidadePaciente: z.string().min(1, 'Especialidade é obrigatória'),
});

type FormData = z.infer<typeof formSchema>;

interface InternacaoManualModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: FormData) => void;
  leito: LeitoEnriquecido | null;
}

const especialidades = [
  "CIRURGIA CABECA E PESCOCO", 
  "CIRURGIA GERAL", 
  "CIRURGIA TORACICA",
  "CIRURGIA VASCULAR", 
  "CLINICA GERAL", 
  "HEMATOLOGIA", 
  "INTENSIVISTA",
  "NEFROLOGIA", 
  "NEUROCIRURGIA", 
  "NEUROLOGIA", 
  "ODONTOLOGIA C.TRAUM.B.M.F.",
  "ONCOLOGIA CIRURGICA", 
  "ONCOLOGIA CLINICA/CANCEROLOGIA",
  "ORTOPEDIA/TRAUMATOLOGIA", 
  "PROCTOLOGIA", 
  "UROLOGIA"
];

export function InternacaoManualModal({ open, onOpenChange, onConfirm, leito }: InternacaoManualModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: '',
      dataNascimento: '',
      sexoPaciente: 'Masculino',
      dataInternacao: '',
      especialidadePaciente: '',
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

  const sanitizeNome = (valor: string) =>
    valor
      .normalize('NFD')
      .replace(/[^\p{Letter}\s]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Internar Paciente Manualmente</DialogTitle>
          <DialogDescription>
            Leito: {leito?.codigoLeito} - Preencha os dados do paciente para internação
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
                    <Input
                      placeholder="Digite o nome completo"
                      {...field}
                      onChange={e => field.onChange(sanitizeNome(e.target.value))}
                    />
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
                    <InputMask
                      mask="99/99/9999"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {(inputProps: React.InputHTMLAttributes<HTMLInputElement>) => (
                        <Input {...inputProps} placeholder="DD/MM/AAAA" />
                      )}
                    </InputMask>
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
                        <RadioGroupItem value="Masculino" id="masculino" />
                        <Label htmlFor="masculino">Masculino</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Feminino" id="feminino" />
                        <Label htmlFor="feminino">Feminino</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="especialidadePaciente"
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
              <Button type="submit">Internar Paciente</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
