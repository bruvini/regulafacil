
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NovaPendencia } from '@/types/huddle';

interface NovaPendenciaModalProps {
  onAdicionarPendencia: (pendencia: NovaPendencia) => void;
}

export const NovaPendenciaModal = ({ onAdicionarPendencia }: NovaPendenciaModalProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: '',
    descricao: '',
    pacienteId: ''
  });
  const { userData } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData || !formData.titulo || !formData.categoria || !formData.descricao) {
      return;
    }

    const novaPendencia: NovaPendencia = {
      titulo: formData.titulo,
      categoria: formData.categoria as any,
      descricao: formData.descricao,
      pacienteId: formData.pacienteId || undefined,
      responsavel: {
        uid: userData.uid,
        nome: userData.nomeCompleto
      }
    };

    onAdicionarPendencia(novaPendencia);
    setFormData({ titulo: '', categoria: '', descricao: '', pacienteId: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="medical">
          <Plus className="mr-2 h-4 w-4" />
          Nova Pendência
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Pendência</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título da Pendência</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ex: Paciente ZELONITA - Alta travada"
              required
            />
          </div>

          <div>
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={formData.categoria} onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}>
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
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva a pendência em detalhes..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="pacienteId">ID do Paciente (opcional)</Label>
            <Input
              id="pacienteId"
              value={formData.pacienteId}
              onChange={(e) => setFormData(prev => ({ ...prev, pacienteId: e.target.value }))}
              placeholder="ID do paciente relacionado"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
