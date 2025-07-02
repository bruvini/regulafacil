
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormDescription } from '@/components/ui/form';
import { LeitoFormData, Setor } from '@/types/hospital';

interface LeitoFormProps {
  onSubmit: (setorId: string, data: LeitoFormData) => void;
  setores: Setor[];
  selectedSetorId?: string;
  initialData?: LeitoFormData;
  isLoading?: boolean;
  onReset?: () => void;
}

const LeitoForm = ({ onSubmit, setores, selectedSetorId, initialData, isLoading, onReset }: LeitoFormProps) => {
  const [formData, setFormData] = useState<LeitoFormData>({ codigoLeito: '', leitoPCP: false, leitoIsolamento: false });
  const [setorId, setSetorId] = useState(selectedSetorId || '');
  const codigoLeitoRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ codigoLeito: '', leitoPCP: false, leitoIsolamento: false });
    }
  }, [initialData]);

  useEffect(() => {
    setSetorId(selectedSetorId || '');
  }, [selectedSetorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setorId) return;
    
    await onSubmit(setorId, formData);
    
    if (!initialData) {
      // Limpar formulário após cadastro
      setFormData({ codigoLeito: '', leitoPCP: false, leitoIsolamento: false });
      // Focar no primeiro campo
      setTimeout(() => {
        codigoLeitoRef.current?.focus();
      }, 100);
    }
  };

  const handleInputChange = (field: keyof LeitoFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFormData({ codigoLeito: '', leitoPCP: false, leitoIsolamento: false });
    onReset?.();
    setTimeout(() => {
      codigoLeitoRef.current?.focus();
    }, 100);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Setor</Label>
        <Select value={setorId} onValueChange={setSetorId} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o setor" />
          </SelectTrigger>
          <SelectContent>
            {setores.map((setor) => (
              <SelectItem key={setor.id} value={setor.id!}>
                {setor.nomeSetor} ({setor.siglaSetor})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="codigoLeito">Código dos Leitos</Label>
        <Textarea
          ref={codigoLeitoRef}
          id="codigoLeito"
          value={formData.codigoLeito}
          onChange={(e) => handleInputChange('codigoLeito', e.target.value)}
          placeholder="Ex: Leito 101-A, Leito 101-B, Leito 102-A"
          required
          className="min-h-[80px]"
        />
        <FormDescription>
          Para múltiplos leitos, separe os códigos por vírgula. Ex: 201-A, 201-B, 202-A
        </FormDescription>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="leitoPCP"
            checked={formData.leitoPCP}
            onCheckedChange={(checked) => handleInputChange('leitoPCP', checked as boolean)}
          />
          <Label htmlFor="leitoPCP" className="text-sm">
            Leito PCP (Plano de Capacidade Plena)
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="leitoIsolamento"
            checked={formData.leitoIsolamento}
            onCheckedChange={(checked) => handleInputChange('leitoIsolamento', checked as boolean)}
          />
          <Label htmlFor="leitoIsolamento" className="text-sm">
            Leito de Isolamento
          </Label>
        </div>
      </div>
      
      <div className="space-y-2">
        <Button 
          type="submit" 
          className="w-full bg-medical-primary hover:bg-medical-secondary"
          disabled={isLoading || !setorId}
        >
          {isLoading ? 'Salvando...' : (initialData ? 'Atualizar Leito' : 'Adicionar Leitos')}
        </Button>
        
        {initialData && (
          <Button 
            type="button"
            variant="outline"
            onClick={handleReset}
            className="w-full"
          >
            Cancelar Edição
          </Button>
        )}
      </div>
    </form>
  );
};

export default LeitoForm;
