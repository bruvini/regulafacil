
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  const [isBulkAdd, setIsBulkAdd] = useState(false);
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
      setIsBulkAdd(false);
      // Focar no primeiro campo
      setTimeout(() => {
        codigoLeitoRef.current?.focus();
      }, 100);
    }
  };

  const handleInputChange = (field: keyof LeitoFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCodigoLeitoChange = (value: string) => {
    handleInputChange('codigoLeito', value);
    setIsBulkAdd(value.includes(','));
  };

  const handleReset = () => {
    setFormData({ codigoLeito: '', leitoPCP: false, leitoIsolamento: false });
    setIsBulkAdd(false);
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
        <Label htmlFor="codigoLeito">Código do Leito</Label>
        <Textarea
          ref={codigoLeitoRef}
          id="codigoLeito"
          value={formData.codigoLeito}
          onChange={(e) => handleCodigoLeitoChange(e.target.value)}
          placeholder="Ex: Leito 101-A, 102-B, 103-C"
          required
          className="min-h-[80px]"
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="leitoPCP"
            checked={formData.leitoPCP}
            onCheckedChange={(checked) => handleInputChange('leitoPCP', checked as boolean)}
            disabled={isBulkAdd}
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
            disabled={isBulkAdd}
          />
          <Label htmlFor="leitoIsolamento" className="text-sm">
            Leito de Isolamento
          </Label>
        </div>

        {isBulkAdd && (
          <p className="text-xs text-muted-foreground">
            Opções de PCP e Isolamento são desabilitadas ao adicionar leitos em massa.
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Button 
          type="submit" 
          className="w-full bg-medical-primary hover:bg-medical-secondary"
          disabled={isLoading || !setorId}
        >
          {isLoading ? 'Salvando...' : (initialData ? 'Atualizar Leito' : 'Adicionar Leito')}
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
