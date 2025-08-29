
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Copy, ArrowLeft, FileText } from 'lucide-react';

const formSchema = z.object({
  observadosDCL: z.number().min(0, 'Deve ser um número positivo'),
  observadosDCX: z.number().min(0, 'Deve ser um número positivo'),
  observadosNeurologicos: z.number().min(0, 'Deve ser um número positivo'),
  observadosSalaLaranja: z.number().min(0, 'Deve ser um número positivo'),
  observadosSalaEmergencia: z.number().min(0, 'Deve ser um número positivo'),
  salasAtivasCC: z.number().min(0, 'Deve ser um número positivo'),
  salasBloqueadasCC: z.number().min(0, 'Deve ser um número positivo'),
  salasTravadasCC: z.number().min(0, 'Deve ser um número positivo'),
});

type FormData = z.infer<typeof formSchema>;

interface BoletimDiarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGerarBoletim: (dados: FormData) => string;
}

export const BoletimDiarioModal = ({
  isOpen,
  onClose,
  onGerarBoletim
}: BoletimDiarioModalProps) => {
  const [etapa, setEtapa] = useState<'formulario' | 'visualizacao'>('formulario');
  const [textoGerado, setTextoGerado] = useState<string>('');
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      observadosDCL: 0,
      observadosDCX: 0,
      observadosNeurologicos: 0,
      observadosSalaLaranja: 0,
      observadosSalaEmergencia: 0,
      salasAtivasCC: 0,
      salasBloqueadasCC: 0,
      salasTravadasCC: 0,
    },
  });

  const onSubmit = (data: FormData) => {
    const texto = onGerarBoletim(data);
    setTextoGerado(texto);
    setEtapa('visualizacao');
  };

  const copiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(textoGerado);
      toast({
        title: "Texto copiado!",
        description: "O boletim foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const voltarParaFormulario = () => {
    setEtapa('formulario');
    setTextoGerado('');
  };

  const fecharModal = () => {
    setEtapa('formulario');
    setTextoGerado('');
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={fecharModal}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {etapa === 'formulario' ? 'Gerador de Boletim Diário' : 'Boletim Gerado'}
          </DialogTitle>
        </DialogHeader>

        {etapa === 'formulario' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="observadosDCL"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observados DCL</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observadosDCX"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observados DCX</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observadosNeurologicos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observados Neurológicos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observadosSalaLaranja"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observados Sala Laranja</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observadosSalaEmergencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observados Sala Emergência</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salasAtivasCC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salas Ativas CC</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salasBloqueadasCC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salas Bloqueadas CC</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salasTravadasCC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salas Travadas CC</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={fecharModal}>
                  Cancelar
                </Button>
                <Button type="submit" variant="medical">
                  Gerar Boletim
                </Button>
              </div>
            </form>
          </Form>
        )}

        {etapa === 'visualizacao' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Boletim Diário - Pronto para Compartilhar</label>
              <Textarea
                value={textoGerado}
                readOnly
                className="min-h-[400px] font-mono text-sm"
              />
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={voltarParaFormulario}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fecharModal}
                >
                  Fechar
                </Button>
                <Button
                  type="button"
                  variant="medical"
                  onClick={copiarTexto}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar Texto
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
