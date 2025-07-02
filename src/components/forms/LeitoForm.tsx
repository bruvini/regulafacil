import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeitoFormData, Setor } from '@/types/hospital';

interface LeitoFormProps {
  onSubmit: (setorId: string, data: LeitoFormData) => void;
  setores: Setor[];
  selectedSetorId?: string;
  initialData?: LeitoFormData;
  isLoading?: boolean;
}

const LeitoForm = ({ onSubmit, setores, selectedSetorId, initialData, isLoading }: LeitoFormProps) => {
  const [formData, setFormData] = useState<LeitoFormData>(
    initialData || { codigoLeito: '', leitoPCP: false, leitoIsolamento: false }
  );
  const [setorId, setSetorId] = useState(selectedSetorId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setorId) return;
    onSubmit(setorId, formData);
  };

  const handleInputChange = (field: keyof LeitoFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        <Input
          id="codigoLeito"
          type="text"
          value={formData.codigoLeito}
          onChange={(e) => handleInputChange('codigoLeito', e.target.value)}
          placeholder="Ex: Leito 101-A"
          required
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="leitoPCP"
            checked={formData.leitoPCP}
            onCheckedChange={(checked) => handleInputChange('leitoPCP', checked as boolean)}
          />
          <Label htmlFor="leitoPCP" className="text-sm">
            Leito PCP (Precaução de Contato Padrão)
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
      
      <Button 
        type="submit" 
        className="w-full bg-medical-primary hover:bg-medical-secondary"
        disabled={isLoading || !setorId}
      >
        {isLoading ? 'Salvando...' : (initialData ? 'Atualizar Leito' : 'Adicionar Leito')}
      </Button>
    </form>
  );
};

export default LeitoForm;