
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { SolicitacaoCirurgicaFormData, SolicitacaoCirurgica } from '@/types/hospital';

const formSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome completo deve ter pelo menos 3 caracteres'),
  dataNascimento: z.string().min(8, 'Data de nascimento é obrigatória'),
  sexo: z.enum(['Masculino', 'Feminino'], {
    required_error: 'Sexo é obrigatório',
  }),
  especialidade: z.string().min(2, 'Especialidade é obrigatória'),
  medicoSolicitante: z.string().min(3, 'Nome do médico solicitante é obrigatório'),
  tipoPreparo: z.string().optional(),
  dataPrevistaInternacao: z.date({
    required_error: 'Data prevista para internação é obrigatória',
  }),
  dataPrevisaCirurgia: z.date({
    required_error: 'Data prevista para cirurgia é obrigatória',
  }),
  tipoLeitoNecessario: z.enum(['Enfermaria', 'UTI'], {
    required_error: 'Tipo de leito necessário é obrigatório',
  }),
});

interface SolicitacaoCirurgicaFormProps {
  onSubmit: (data: SolicitacaoCirurgicaFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: SolicitacaoCirurgica | null;
}

const SolicitacaoCirurgicaForm = ({ onSubmit, onCancel, loading = false, initialData }: SolicitacaoCirurgicaFormProps) => {
  const form = useForm<SolicitacaoCirurgicaFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: initialData?.nomeCompleto || '',
      dataNascimento: initialData?.dataNascimento || '',
      sexo: initialData?.sexo,
      especialidade: initialData?.especialidade || '',
      medicoSolicitante: initialData?.medicoSolicitante || '',
      tipoPreparo: initialData?.tipoPreparo || '',
      dataPrevistaInternacao: initialData?.dataPrevistaInternacao,
      dataPrevisaCirurgia: initialData?.dataPrevisaCirurgia,
      tipoLeitoNecessario: initialData?.tipoLeitoNecessario,
    },
  });

  const handleSubmit = (data: SolicitacaoCirurgicaFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nomeCompleto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo do Paciente *</FormLabel>
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
                    maxLength={10}
                    onChange={(e) => {
                      // Aplicar máscara de data
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                      if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5, 9);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="sexo"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Sexo *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-row space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Masculino" id="masculino" />
                    <FormLabel htmlFor="masculino">Masculino</FormLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Feminino" id="feminino" />
                    <FormLabel htmlFor="feminino">Feminino</FormLabel>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="especialidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especialidade *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Cirurgia Geral" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="medicoSolicitante"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Médico Solicitante *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do médico" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tipoPreparo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Preparo</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva o preparo necessário (opcional)"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dataPrevistaInternacao"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Prevista para Internação *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dataPrevisaCirurgia"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Prevista para Cirurgia *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tipoLeitoNecessario"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo de Leito Necessário *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-row space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Enfermaria" id="enfermaria" />
                    <FormLabel htmlFor="enfermaria">Enfermaria</FormLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="UTI" id="uti" />
                    <FormLabel htmlFor="uti">UTI</FormLabel>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : initialData ? 'Atualizar Solicitação' : 'Salvar Solicitação'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SolicitacaoCirurgicaForm;
