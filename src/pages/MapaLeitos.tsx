import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { Paciente } from '@/types/paciente';
import { Leito } from '@/types/leito';
import { Setor } from '@/types/setor';
import { useLeitos } from '@/hooks/useLeitos';
import { useSetores } from '@/hooks/useSetores';
import { usePacientes } from '@/hooks/usePacientes';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useAuditoria } from '@/hooks/useAuditoria';
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

const schema = yup.object({
  leitoId: yup.string().required('Leito é obrigatório'),
  setorId: yup.string().required('Setor é obrigatório'),
  dataInternacao: yup.date().required('Data de internação é obrigatória'),
  especialidadePaciente: yup.string().required('Especialidade é obrigatória'),
  nomeCompleto: yup.string().required('Nome completo é obrigatório'),
  dataNascimento: yup.date().required('Data de nascimento é obrigatória'),
  sexoPaciente: yup.string().required('Sexo é obrigatório'),
  origem: yup.string().required('Origem é obrigatória'),
}).required();

const MapaLeitos = () => {
  const { leitos } = useLeitos();
  const { setores } = useSetores();
  const { pacientes, refreshPacientes } = usePacientes();
  const { registrarLog } = useAuditoria();
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    if (pacienteSelecionado) {
      setIsEditMode(true);
      setValue('leitoId', pacienteSelecionado.leitoId);
      setValue('setorId', pacienteSelecionado.setorId);
      setValue('dataInternacao', new Date(pacienteSelecionado.dataInternacao));
      setValue('especialidadePaciente', pacienteSelecionado.especialidadePaciente);
      setValue('nomeCompleto', pacienteSelecionado.nomeCompleto);
      setValue('dataNascimento', new Date(pacienteSelecionado.dataNascimento));
      setValue('sexoPaciente', pacienteSelecionado.sexoPaciente);
      setValue('origem', pacienteSelecionado.origem.deSetor);
    } else {
      setIsEditMode(false);
      reset();
    }
  }, [pacienteSelecionado, setValue, reset]);

  const criarPaciente = async (dadosPaciente: any) => {
    try {
      const novoPaciente: Omit<Paciente, 'id'> = {
        leitoId: dadosPaciente.leitoId,
        setorId: dadosPaciente.setorId,
        dataInternacao: dadosPaciente.dataInternacao,
        especialidadePaciente: dadosPaciente.especialidadePaciente,
        nomeCompleto: dadosPaciente.nomeCompleto,
        dataNascimento: dadosPaciente.dataNascimento,
        sexoPaciente: dadosPaciente.sexoPaciente,
        origem: {
          deSetor: dadosPaciente.origem || '',
          deLeito: ''
        },
      };

      await addDoc(collection(db, 'pacientesRegulaFacil'), novoPaciente);
      toast({
        title: "Sucesso!",
        description: "Paciente criado com sucesso."
      });
      registrarLog(`Criou o paciente ${novoPaciente.nomeCompleto}.`, 'Mapa de Leitos');
      refreshPacientes();
      reset();
    } catch (error) {
      console.error("Erro ao criar paciente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o paciente.",
        variant: "destructive"
      });
    }
  };

  const atualizarPaciente = async (dadosPaciente: any) => {
    if (!pacienteSelecionado?.id) return;

    try {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteSelecionado.id);
      await updateDoc(pacienteRef, {
        leitoId: dadosPaciente.leitoId,
        setorId: dadosPaciente.setorId,
        dataInternacao: dadosPaciente.dataInternacao,
        especialidadePaciente: dadosPaciente.especialidadePaciente,
        nomeCompleto: dadosPaciente.nomeCompleto,
        dataNascimento: dadosPaciente.dataNascimento,
        sexoPaciente: dadosPaciente.sexoPaciente,
        origem: {
          deSetor: dadosPaciente.origem || '',
          deLeito: ''
        },
      });
      toast({
        title: "Sucesso!",
        description: "Paciente atualizado com sucesso."
      });
      registrarLog(`Atualizou o paciente ${dadosPaciente.nomeCompleto}.`, 'Mapa de Leitos');
      refreshPacientes();
      setPacienteSelecionado(null);
      reset();
    } catch (error) {
      console.error("Erro ao atualizar paciente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o paciente.",
        variant: "destructive"
      });
    }
  };

  const removerPaciente = async () => {
    if (!pacienteSelecionado?.id) return;

    try {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteSelecionado.id);
      await deleteDoc(pacienteRef);
      toast({
        title: "Sucesso!",
        description: "Paciente removido com sucesso."
      });
      registrarLog(`Removeu o paciente ${pacienteSelecionado.nomeCompleto}.`, 'Mapa de Leitos');
      refreshPacientes();
      setPacienteSelecionado(null);
      reset();
    } catch (error) {
      console.error("Erro ao remover paciente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o paciente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciar Mapa de Leitos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Formulário */}
        <div className="bg-white shadow-md rounded-md p-4">
          <h2 className="text-lg font-semibold mb-2">{isEditMode ? 'Editar Paciente' : 'Adicionar Paciente'}</h2>
          <form onSubmit={handleSubmit(isEditMode ? atualizarPaciente : criarPaciente)} className="space-y-4">
            <div>
              <Label htmlFor="leitoId">Leito</Label>
              <Select onValueChange={(value) => setValue('leitoId', value)} defaultValue={pacienteSelecionado?.leitoId || ''}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o leito" />
                </SelectTrigger>
                <SelectContent>
                  {leitos.map(leito => (
                    <SelectItem key={leito.id} value={leito.id}>{leito.codigo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.leitoId && <p className="text-red-500 text-sm">{errors.leitoId.message}</p>}
            </div>

            <div>
              <Label htmlFor="setorId">Setor</Label>
              <Select onValueChange={(value) => setValue('setorId', value)} defaultValue={pacienteSelecionado?.setorId || ''}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map(setor => (
                    <SelectItem key={setor.id} value={setor.id}>{setor.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.setorId && <p className="text-red-500 text-sm">{errors.setorId.message}</p>}
            </div>

            <div>
              <Label htmlFor="dataInternacao">Data de Internação</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !setValue("dataInternacao") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {setValue("dataInternacao") ? (
                      format(new Date(pacienteSelecionado?.dataInternacao || Date.now()), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center" side="bottom">
                  <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={pacienteSelecionado ? new Date(pacienteSelecionado.dataInternacao) : null}
                    onSelect={(date) => {
                      setValue("dataInternacao", date)
                    }}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dataInternacao && <p className="text-red-500 text-sm">{errors.dataInternacao.message}</p>}
            </div>

            <div>
              <Label htmlFor="especialidadePaciente">Especialidade</Label>
              <Input type="text" id="especialidadePaciente" {...register('especialidadePaciente')} />
              {errors.especialidadePaciente && <p className="text-red-500 text-sm">{errors.especialidadePaciente.message}</p>}
            </div>

            <div>
              <Label htmlFor="nomeCompleto">Nome Completo</Label>
              <Input type="text" id="nomeCompleto" {...register('nomeCompleto')} />
              {errors.nomeCompleto && <p className="text-red-500 text-sm">{errors.nomeCompleto.message}</p>}
            </div>

            <div>
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !setValue("dataNascimento") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {setValue("dataNascimento") ? (
                      format(new Date(pacienteSelecionado?.dataNascimento || Date.now()), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center" side="bottom">
                  <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={pacienteSelecionado ? new Date(pacienteSelecionado.dataNascimento) : null}
                    onSelect={(date) => {
                      setValue("dataNascimento", date)
                    }}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dataNascimento && <p className="text-red-500 text-sm">{errors.dataNascimento.message}</p>}
            </div>

            <div>
              <Label htmlFor="sexoPaciente">Sexo</Label>
              <Select onValueChange={(value) => setValue('sexoPaciente', value)} defaultValue={pacienteSelecionado?.sexoPaciente || ''}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              {errors.sexoPaciente && <p className="text-red-500 text-sm">{errors.sexoPaciente.message}</p>}
            </div>

            <div>
              <Label htmlFor="origem">Origem</Label>
              <Input type="text" id="origem" {...register('origem')} />
              {errors.origem && <p className="text-red-500 text-sm">{errors.origem.message}</p>}
            </div>

            <div className="flex justify-end gap-2">
              {isEditMode && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Remover</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá remover o paciente permanentemente. Tem certeza que deseja prosseguir?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={removerPaciente}>Remover</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button type="submit">{isEditMode ? 'Atualizar' : 'Salvar'}</Button>
            </div>
          </form>
        </div>

        {/* Lista de Pacientes */}
        <div className="bg-white shadow-md rounded-md p-4">
          <h2 className="text-lg font-semibold mb-2">Lista de Pacientes</h2>
          <Table>
            <TableCaption>Lista de pacientes cadastrados no sistema.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Leito</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientes.map(paciente => (
                <TableRow key={paciente.id}>
                  <TableCell>{paciente.nomeCompleto}</TableCell>
                  <TableCell>{leitos.find(leito => leito.id === paciente.leitoId)?.codigo || 'N/A'}</TableCell>
                  <TableCell>{setores.find(setor => setor.id === paciente.setorId)?.nome || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="secondary" size="sm" onClick={() => setPacienteSelecionado(paciente)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default MapaLeitos;
