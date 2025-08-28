import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { Paciente } from '@/types/hospital';
import { Plus, Search, Trash, CalendarIcon } from 'lucide-react';
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RegulacaoLeitoItem } from '@/components/RegulacaoLeitoItem';
import { PacientesReguladosBloco } from '@/components/PacientesReguladosBloco';
import { RemanejamentosPendentesBloco } from '@/components/RemanejamentosPendentesBloco';

const formSchema = z.object({
  nome: z.string().min(2, {
    message: "Nome must be at least 2 characters.",
  }),
  dataNascimento: z.date(),
  sexo: z.enum(['Masculino', 'Feminino']),
  diagnostico: z.string().min(10, {
    message: "Diagnóstico must be at least 10 characters.",
  }),
  crmMedico: z.string().min(5, {
    message: "CRM do médico must be at least 5 characters.",
  }),
  nomeMedico: z.string().min(2, {
    message: "Nome do médico must be at least 2 characters.",
  }),
})

export default function RegulacaoLeitos() {
  const queryClient = useQueryClient();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actingOnPatientId, setActingOnPatientId] = useState<string | null>(null);
  const [pacientesRegulados, setPacientesRegulados] = useState<Paciente[]>([]);
  const [pacientesAguardandoRemanejamento, setPacientesAguardandoRemanejamento] = useState<Paciente[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      dataNascimento: new Date(),
      sexo: 'Masculino',
      diagnostico: "",
      crmMedico: "",
      nomeMedico: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  useEffect(() => {
    fetchPacientes();
  }, [search]);

  const fetchPacientes = async () => {
    try {
      // Simulação de dados para o exemplo
      const mockPacientes: Paciente[] = [
        {
          id: '1',
          leitoId: 'L001',
          setorId: 'S001',
          nomeCompleto: 'João da Silva Santos',
          sexoPaciente: 'Masculino',
          dataNascimento: '1980-05-15',
          especialidadePaciente: 'Cardiologia',
          dataInternacao: '2024-01-15T10:30:00Z',
          isolamentosVigentes: []
        },
        {
          id: '2',
          leitoId: 'L002',
          setorId: 'S001',
          nomeCompleto: 'Maria Oliveira Costa',
          sexoPaciente: 'Feminino',
          dataNascimento: '1975-08-22',
          especialidadePaciente: 'Neurologia',
          dataInternacao: '2024-01-14T14:20:00Z',
          isolamentosVigentes: [
            { sigla: 'PC', dataInicioVigilancia: '2024-01-14T14:20:00Z' }
          ]
        }
      ];
      setPacientes(mockPacientes);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      toast.error('Erro ao buscar pacientes');
    }
  };

  const { toast: toastHook } = useToast()

  const criarPacienteMutation = useMutation({
    mutationFn: async (novoPaciente: Omit<Paciente, 'id'>) => {
      // Simulação de criação de paciente
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...novoPaciente, id: Date.now().toString() };
    },
    onSuccess: () => {
      toastHook({
        title: "Sucesso!",
        description: "Paciente criado com sucesso.",
      })
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      fetchPacientes();
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toastHook({
        variant: "destructive",
        title: "Erro!",
        description: error?.message || "Erro ao criar paciente.",
      })
    },
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleRegularPaciente = async (paciente: Paciente) => {
    setActingOnPatientId(paciente.id);
    try {
      // Simulação de chamada à API para regular o paciente
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPacientesRegulados(prev => [...prev, paciente]);
      setPacientes(prev => prev.filter(p => p.id !== paciente.id));
      toast.success(`Paciente ${paciente.nomeCompleto} regulado com sucesso!`);
    } catch (error) {
      console.error('Erro ao regular paciente:', error);
      toast.error('Erro ao regular paciente');
    } finally {
      setActingOnPatientId(null);
    }
  };

  const handleRemanejarPaciente = async (paciente: Paciente) => {
    setActingOnPatientId(paciente.id);
    try {
      // Simulação de chamada à API para solicitar o remanejamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPacientesAguardandoRemanejamento(prev => [...prev, paciente]);
      setPacientesRegulados(prev => prev.filter(p => p.id !== paciente.id));
      toast.success(`Remanejamento do paciente ${paciente.nomeCompleto} solicitado.`);
    } catch (error) {
      console.error('Erro ao solicitar remanejamento:', error);
      toast.error('Erro ao solicitar remanejamento');
    } finally {
      setActingOnPatientId(null);
    }
  };

  const handleConcluirRegulacao = (paciente: Paciente) => {
    setActingOnPatientId(paciente.id);
    setTimeout(() => {
      setPacientesRegulados(prev => prev.filter(p => p.id !== paciente.id));
      toast.success(`Regulação do paciente ${paciente.nomeCompleto} concluída.`);
      setActingOnPatientId(null);
    }, 1000);
  };

  const handleAlterarRegulacao = (paciente: Paciente) => {
    setActingOnPatientId(paciente.id);
    setTimeout(() => {
      toast(`Regulação do paciente ${paciente.nomeCompleto} alterada.`);
      setActingOnPatientId(null);
    }, 1000);
  };

  const handleCancelarRegulacao = (paciente: Paciente) => {
    setActingOnPatientId(paciente.id);
    setTimeout(() => {
      setPacientesRegulados(prev => prev.filter(p => p.id !== paciente.id));
      setPacientes(prev => [...prev, paciente]);
      toast(`Regulação do paciente ${paciente.nomeCompleto} cancelada.`);
      setActingOnPatientId(null);
    }, 1000);
  };

  const handleRemanejamento = (paciente: Paciente) => {
    setActingOnPatientId(paciente.id);
    setTimeout(() => {
      setPacientesAguardandoRemanejamento(prev => prev.filter(p => p.id !== paciente.id));
      toast.success(`Remanejamento do paciente ${paciente.nomeCompleto} confirmado.`);
      setActingOnPatientId(null);
    }, 1000);
  };

  const handleCancelarRemanejamento = async (paciente: Paciente) => {
    setActingOnPatientId(paciente.id);
    try {
      // Simulação de chamada à API para cancelar o remanejamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPacientesAguardandoRemanejamento(prev => prev.filter(p => p.id !== paciente.id));
      setPacientesRegulados(prev => [...prev, paciente]);
      toast(`Remanejamento do paciente ${paciente.nomeCompleto} cancelado.`);
    } catch (error) {
      console.error('Erro ao cancelar remanejamento:', error);
      toast.error('Erro ao cancelar remanejamento');
    } finally {
      setActingOnPatientId(null);
    }
  };

  const handleObservacoesRemanejamento = (paciente: Paciente) => {
    setActingOnPatientId(paciente.id);
    setTimeout(() => {
      toast(`Observações sobre o remanejamento do paciente ${paciente.nomeCompleto}.`);
      setActingOnPatientId(null);
    }, 1000);
  };

  const handleVerResumoRegulacao = () => {
    toast('Exibindo resumo da regulação de leitos.');
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4 text-medical-primary">Regulação de Leitos</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="relative flex items-center">
          <Input
            type="search"
            placeholder="Buscar paciente..."
            className="pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleSearch}
          />
          <Search className="absolute left-3 text-gray-400" />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Paciente</DialogTitle>
              <DialogDescription>
                Crie um novo paciente para a regulação de leitos.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do paciente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataNascimento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Nascimento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
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
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o sexo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Feminino">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="diagnostico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnóstico</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Insira o diagnóstico do paciente"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="crmMedico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CRM do Médico</FormLabel>
                      <FormControl>
                        <Input placeholder="CRM do médico responsável" {...field} />
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
                        <Input placeholder="Nome do médico responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Criar Paciente</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-medical-primary flex items-center gap-2">
              Pacientes Aguardando Regulação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pacientes.map((paciente) => (
                <RegulacaoLeitoItem
                  key={paciente.id}
                  paciente={paciente}
                  onRegular={() => handleRegularPaciente(paciente)}
                  isActing={actingOnPatientId === paciente.id}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <PacientesReguladosBloco
          pacientesRegulados={pacientesRegulados}
          onConcluir={handleConcluirRegulacao}
          onAlterar={handleAlterarRegulacao}
          onCancelar={handleCancelarRegulacao}
          onVerResumo={handleVerResumoRegulacao}
          actingOnPatientId={actingOnPatientId}
        />

        <RemanejamentosPendentesBloco
          remanejamentosPendentes={pacientesAguardandoRemanejamento}
          onConfirmarRemanejamento={handleRemanejamento}
          onCancelarRemanejamento={handleCancelarRemanejamento}
          onObservacoesRemanejamento={handleObservacoesRemanejamento}
        />
      </div>
    </div>
  );
}
