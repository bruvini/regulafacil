
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';

interface FormData {
  nomeCompleto: string;
  dataNascimento: Date | undefined;
  sexoPaciente: 'Masculino' | 'Feminino' | '';
  dataInternacao: Date | undefined;
  especialidadePaciente: string;
}

interface AdicionarPacienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leitoInfo: { codigoLeito: string; setorNome: string } | null;
  onConfirm: (formData: FormData) => Promise<void>;
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

export const AdicionarPacienteModal: React.FC<AdicionarPacienteModalProps> = ({
  open,
  onOpenChange,
  leitoInfo,
  onConfirm
}) => {
  const [formData, setFormData] = useState<FormData>({
    nomeCompleto: '',
    dataNascimento: undefined,
    sexoPaciente: '',
    dataInternacao: new Date(),
    especialidadePaciente: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    if (!formData.nomeCompleto || !formData.dataNascimento || !formData.sexoPaciente || 
        !formData.dataInternacao || !formData.especialidadePaciente) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onConfirm(formData);
      // Reset form
      setFormData({
        nomeCompleto: '',
        dataNascimento: undefined,
        sexoPaciente: '',
        dataInternacao: new Date(),
        especialidadePaciente: ''
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.nomeCompleto && formData.dataNascimento && 
                     formData.sexoPaciente && formData.dataInternacao && 
                     formData.especialidadePaciente;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Paciente Manualmente</DialogTitle>
          {leitoInfo && (
            <p className="text-sm text-muted-foreground">
              Leito: {leitoInfo.codigoLeito} - {leitoInfo.setorNome}
            </p>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nomeCompleto">Nome Completo *</Label>
            <Input
              id="nomeCompleto"
              value={formData.nomeCompleto}
              onChange={(e) => setFormData(prev => ({ ...prev, nomeCompleto: e.target.value }))}
              placeholder="Digite o nome completo"
              required
            />
          </div>

          <div>
            <Label>Data de Nascimento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dataNascimento && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dataNascimento ? (
                    format(formData.dataNascimento, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    "Selecione a data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dataNascimento}
                  onSelect={(date) => setFormData(prev => ({ ...prev, dataNascimento: date }))}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Sexo *</Label>
            <Select 
              value={formData.sexoPaciente} 
              onValueChange={(value: 'Masculino' | 'Feminino') => 
                setFormData(prev => ({ ...prev, sexoPaciente: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data e Hora da Internação *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dataInternacao && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dataInternacao ? (
                    format(formData.dataInternacao, "dd/MM/yyyy HH:mm", { locale: ptBR })
                  ) : (
                    "Selecione data e hora"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dataInternacao}
                  onSelect={(date) => {
                    if (date) {
                      // Manter a hora atual se já existe, senão usar hora atual
                      const currentDate = formData.dataInternacao || new Date();
                      date.setHours(currentDate.getHours(), currentDate.getMinutes());
                      setFormData(prev => ({ ...prev, dataInternacao: date }));
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Especialidade *</Label>
            <Select 
              value={formData.especialidadePaciente} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, especialidadePaciente: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a especialidade" />
              </SelectTrigger>
              <SelectContent>
                {especialidades.map((esp) => (
                  <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Adicionando..." : "Adicionar Paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
