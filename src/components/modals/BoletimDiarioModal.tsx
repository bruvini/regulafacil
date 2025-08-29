import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DadosManuaisBoletim } from '@/hooks/useBoletimDiario';

const formSchema = z.object({
  observadosDCL: z.coerce.number().min(0),
  observadosDCX: z.coerce.number().min(0),
  observadosNeurologicos: z.coerce.number().min(0),
  observadosSalaLaranja: z.coerce.number().min(0),
  observadosSalaEmergencia: z.coerce.number().min(0),
  salasAtivasCC: z.coerce.number().min(0),
  salasBloqueadasCC: z.coerce.number().min(0),
  salasTravadasCC: z.coerce.number().min(0),
});

interface BoletimDiarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gerarTextoBoletim: (dados: DadosManuaisBoletim) => string;
}

type FormData = z.infer<typeof formSchema>;

export const BoletimDiarioModal = ({ open, onOpenChange, gerarTextoBoletim }: BoletimDiarioModalProps) => {
  const [texto, setTexto] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
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
    mode: 'onChange',
  });

  const handleSubmit = (data: FormData) => {
    const t = gerarTextoBoletim(data);
    setTexto(t);
    setStep(2);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(texto);
    toast({ title: 'Copiado!', description: 'Boletim copiado para a área de transferência.' });
  };

  const handleOpenChange = (val: boolean) => {
    onOpenChange(val);
    if (!val) {
      setTimeout(() => {
        setStep(1);
        setTexto('');
        form.reset();
      }, 0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>Gerar Boletim Diário</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="observadosDCL">Observados DCL</Label>
                  <Input id="observadosDCL" type="number" {...form.register('observadosDCL', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="observadosDCX">Observados DCX</Label>
                  <Input id="observadosDCX" type="number" {...form.register('observadosDCX', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="observadosNeurologicos">Observados Neurológicos</Label>
                  <Input id="observadosNeurologicos" type="number" {...form.register('observadosNeurologicos', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="observadosSalaLaranja">Observados Sala Laranja</Label>
                  <Input id="observadosSalaLaranja" type="number" {...form.register('observadosSalaLaranja', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="observadosSalaEmergencia">Observados Sala Emergência</Label>
                  <Input id="observadosSalaEmergencia" type="number" {...form.register('observadosSalaEmergencia', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="salasAtivasCC">Salas Ativas CC</Label>
                  <Input id="salasAtivasCC" type="number" {...form.register('salasAtivasCC', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="salasBloqueadasCC">Salas Bloqueadas CC</Label>
                  <Input id="salasBloqueadasCC" type="number" {...form.register('salasBloqueadasCC', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="salasTravadasCC">Salas Travadas CC</Label>
                  <Input id="salasTravadasCC" type="number" {...form.register('salasTravadasCC', { valueAsNumber: true })} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={!form.formState.isValid}>Gerar Boletim</Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Boletim Diário</DialogTitle>
            </DialogHeader>
            <Textarea value={texto} readOnly className="h-72" />
            <div className="flex justify-end mt-4">
              <Button onClick={handleCopy}>Copiar Texto</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

