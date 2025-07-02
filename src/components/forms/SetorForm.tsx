import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SetorFormData } from '@/types/hospital';

interface SetorFormProps {
  onSubmit: (data: SetorFormData) => void;
  initialData?: SetorFormData;
  isLoading?: boolean;
}

const SetorForm = ({ onSubmit, initialData, isLoading }: SetorFormProps) => {
  const [formData, setFormData] = useState<SetorFormData>(
    initialData || { nomeSetor: '', siglaSetor: '' }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof SetorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nomeSetor">Nome do Setor</Label>
        <Input
          id="nomeSetor"
          type="text"
          value={formData.nomeSetor}
          onChange={(e) => handleInputChange('nomeSetor', e.target.value)}
          placeholder="Ex: Clínica Médica"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="siglaSetor">Sigla do Setor</Label>
        <Input
          id="siglaSetor"
          type="text"
          value={formData.siglaSetor}
          onChange={(e) => handleInputChange('siglaSetor', e.target.value.toUpperCase())}
          placeholder="Ex: CM"
          maxLength={10}
          required
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-medical-primary hover:bg-medical-secondary"
        disabled={isLoading}
      >
        {isLoading ? 'Salvando...' : (initialData ? 'Atualizar Setor' : 'Criar Setor')}
      </Button>
    </form>
  );
};

export default SetorForm;