import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  dataPlantao: z.date({ required_error: 'Data é obrigatória' }),
  turno: z.enum(['MATUTINO', 'VESPERTINO', 'DIURNO', 'NOTURNO']),
  nomeEnfermeiro: z.string().min(1, 'Nome do enfermeiro é obrigatório'),
  nomeMedico: z.string().min(1, 'Nome do médico é obrigatório'),
});

export type ExportacaoForm = z.infer<typeof formSchema>;

interface ExportacaoPdfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: ExportacaoForm) => void;
}

export const ExportacaoPdfModal = ({ open, onOpenChange, onConfirm }: ExportacaoPdfModalProps) => {
  const form = useForm<ExportacaoForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataPlantao: new Date(),
      turno: 'MATUTINO',
      nomeEnfermeiro: '',
      nomeMedico: '',
    },
  });

  const handleSubmit = (data: ExportacaoForm) => {
    onConfirm(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Passagem de Plantão</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dataPlantao"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Plantão</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd/MM/yyyy')
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
              name="turno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turno</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MATUTINO">MATUTINO</SelectItem>
                      <SelectItem value="VESPERTINO">VESPERTINO</SelectItem>
                      <SelectItem value="DIURNO">DIURNO</SelectItem>
                      <SelectItem value="NOTURNO">NOTURNO</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nomeEnfermeiro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Enfermeiro</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nomeMedico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Médico</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Exportar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ExportacaoPdfModal;
