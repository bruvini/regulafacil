
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FormData {
  nomeCompleto: string;
  dataNascimento: Date | null;
  sexo: 'Masculino' | 'Feminino' | '';
  dataInternacao: Date | null;
  horaInternacao: string;
  especialidade: string;
}

interface AdicionarPacienteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (formData: any) => Promise<void>;
  leitoInfo?: {
    codigoLeito: string;
    setorNome: string;
  } | null;
}

const especialidades = [
  'CIRURGIA CABECA E PESCOCO',
  'CIRURGIA GERAL',
  'CIRURGIA TORACICA',
  'CIRURGIA VASCULAR',
  'CLINICA GERAL',
  'INTENSIVISTA',
  'NEFROLOGIA',
  'NEUROCIRURGIA',
  'NEUROLOGIA',
  'ODONTOLOGIA C.TRAUM.B.M.F.',
  'ONCOLOGIA CIRURGICA',
  'ONCOLOGIA CLINICA/CANCEROLOGIA',
  'ORTOPEDIA/TRAUMATOLOGIA',
  'PROCTOLOGIA',
  'UROLOGIA'
];

const AdicionarPacienteModal = ({ open, onClose, onConfirm, leitoInfo }: AdicionarPacienteModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    nomeCompleto: '',
    dataNascimento: null,
    sexo: '',
    dataInternacao: null,
    horaInternacao: '',
    especialidade: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    if (!formData.nomeCompleto.trim() || 
        !formData.dataNascimento || 
        !formData.sexo || 
        !formData.dataInternacao || 
        !formData.horaInternacao || 
        !formData.especialidade) {
      return;
    }

    setLoading(true);
    try {
      // Combinar data e hora
      const [hours, minutes] = formData.horaInternacao.split(':').map(Number);
      const dataHoraInternacao = new Date(formData.dataInternacao);
      dataHoraInternacao.setHours(hours, minutes);

      const dadosCompletos = {
        nomeCompleto: formData.nomeCompleto.trim(),
        dataNascimento: format(formData.dataNascimento, 'dd/MM/yyyy'),
        sexoPaciente: formData.sexo,
        dataInternacao: format(dataHoraInternacao, 'dd/MM/yyyy HH:mm'),
        especialidadePaciente: formData.especialidade
      };

      await onConfirm(dadosCompletos);
      
      // Reset form
      setFormData({
        nomeCompleto: '',
        dataNascimento: null,
        sexo: '',
        dataInternacao: null,
        horaInternacao: '',
        especialidade: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nomeCompleto: '',
      dataNascimento: null,
      sexo: '',
      dataInternacao: null,
      horaInternacao: '',
      especialidade: ''
    });
    onClose();
  };

  const isFormValid = formData.nomeCompleto.trim() && 
                     formData.dataNascimento && 
                     formData.sexo && 
                     formData.dataInternacao && 
                     formData.horaInternacao && 
                     formData.especialidade;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Adicionar Paciente
            {leitoInfo && (
              <span className="text-sm font-normal text-muted-foreground block mt-1">
                Leito: {leitoInfo.codigoLeito} - {leitoInfo.setorNome}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={formData.nomeCompleto}
              onChange={(e) => setFormData(prev => ({ ...prev, nomeCompleto: e.target.value }))}
              placeholder="Digite o nome completo"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Data de Nascimento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dataNascimento && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dataNascimento ? format(formData.dataNascimento, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dataNascimento || undefined}
                  onSelect={(date) => setFormData(prev => ({ ...prev, dataNascimento: date || null }))}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Sexo *</Label>
            <Select value={formData.sexo} onValueChange={(value) => setFormData(prev => ({ ...prev, sexo: value as 'Masculino' | 'Feminino' }))} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data de Internação *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dataInternacao && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dataInternacao ? format(formData.dataInternacao, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dataInternacao || undefined}
                  onSelect={(date) => setFormData(prev => ({ ...prev, dataInternacao: date || null }))}
                  disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hora">Hora da Internação *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="hora"
                type="time"
                value={formData.horaInternacao}
                onChange={(e) => setFormData(prev => ({ ...prev, horaInternacao: e.target.value }))}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Especialidade *</Label>
            <Select value={formData.especialidade} onValueChange={(value) => setFormData(prev => ({ ...prev, especialidade: value }))} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a especialidade" />
              </SelectTrigger>
              <SelectContent>
                {especialidades.map(esp => (
                  <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={!isFormValid || loading}>
              {loading ? "Adicionando..." : "Adicionar Paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdicionarPacienteModal;
