
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSetores } from '@/hooks/useSetores';
import { useAuth } from '@/hooks/useAuth';
import { NovaPendencia } from '@/types/huddle';

interface PendenciaHuddleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (pendencia: NovaPendencia) => void;
}

export const PendenciaHuddleModal = ({ open, onOpenChange, onSubmit }: PendenciaHuddleModalProps) => {
  const { setores } = useSetores();
  const { userData } = useAuth();
  const [pacientesDoSetor, setPacientesDoSetor] = useState<any[]>([]);
  
  const { control, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      setor: '',
      pacienteId: '',
      titulo: '',
      categoria: '',
      descricao: ''
    }
  });

  const setorSelecionadoId = watch('setor');
  const categoria = watch('categoria');

  useEffect(() => {
    if (setorSelecionadoId) {
      const setor = setores.find(s => s.id === setorSelecionadoId);
      const pacientes = setor?.leitos
        .filter(l => l.dadosPaciente)
        .map(l => l.dadosPaciente) || [];
      setPacientesDoSetor(pacientes);
    }
  }, [setorSelecionadoId, setores]);

  const onFormSubmit = (data: any) => {
    if (!userData) return;

    const novaPendencia: NovaPendencia = {
      titulo: data.titulo,
      categoria: data.categoria,
      descricao: data.descricao,
      pacienteId: data.pacienteId || undefined,
      responsavel: {
        uid: userData.uid,
        nome: userData.nomeCompleto
      }
    };

    onSubmit(novaPendencia);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Pendência</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="setor">Setor</Label>
            <Controller
              name="setor"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {setores.map(setor => (
                      <SelectItem key={setor.id} value={setor.id!}>
                        {setor.nomeSetor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {pacientesDoSetor.length > 0 && (
            <div>
              <Label htmlFor="pacienteId">Paciente (opcional)</Label>
              <Controller
                name="pacienteId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={(value) => {
                    const paciente = pacientesDoSetor.find(p => p.nomePaciente === value);
                    if (paciente) {
                      setValue('titulo', `${paciente.nomePaciente} (${paciente.leitoCodigo}) - `);
                    }
                    field.onChange(value);
                  }} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientesDoSetor.map(paciente => (
                        <SelectItem key={paciente.nomePaciente} value={paciente.nomePaciente}>
                          {paciente.nomePaciente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div>
            <Label htmlFor="titulo">Título da Pendência</Label>
            <Controller
              name="titulo"
              control={control}
              rules={{ required: 'Título é obrigatório' }}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Descreva a pendência ou complete o título..."
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="categoria">Categoria</Label>
            <Controller
              name="categoria"
              control={control}
              rules={{ required: 'Categoria é obrigatória' }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALTA_PROLONGADA">Alta Prolongada</SelectItem>
                    <SelectItem value="VAGA_UTI">Vaga UTI</SelectItem>
                    <SelectItem value="SISREG">SISREG</SelectItem>
                    <SelectItem value="INTERNACAO_PROLONGADA">Internação Prolongada</SelectItem>
                    <SelectItem value="OUTROS">Outros</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Controller
              name="descricao"
              control={control}
              rules={{ required: 'Descrição é obrigatória' }}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Descreva a pendência em detalhes..."
                  rows={3}
                />
              )}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="medical">
              Adicionar Pendência
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
