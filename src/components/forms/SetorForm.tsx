
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SetorFormData } from '@/types/hospital';

interface SetorFormProps {
  onSubmit: (data: SetorFormData) => void;
  initialData?: SetorFormData;
  isLoading?: boolean;
  onReset?: () => void;
}

const SetorForm = ({ onSubmit, initialData, isLoading, onReset }: SetorFormProps) => {
  const [formData, setFormData] = useState<SetorFormData>({ nomeSetor: '', siglaSetor: '' });
  const nomeSetorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ nomeSetor: '', siglaSetor: '' });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    
    if (!initialData) {
      // Limpar formulário após cadastro
      setFormData({ nomeSetor: '', siglaSetor: '' });
      // Focar no primeiro campo
      setTimeout(() => {
        nomeSetorRef.current?.focus();
      }, 100);
    }
  };

  const handleInputChange = (field: keyof SetorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFormData({ nomeSetor: '', siglaSetor: '' });
    onReset?.();
    setTimeout(() => {
      nomeSetorRef.current?.focus();
    }, 100);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nomeSetor">Nome do Setor</Label>
        <Input
          ref={nomeSetorRef}
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
      
      <div className="space-y-2">
        <Button 
          type="submit" 
          className="w-full bg-medical-primary hover:bg-medical-secondary"
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : (initialData ? 'Atualizar Setor' : 'Criar Setor')}
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

export default SetorForm;
