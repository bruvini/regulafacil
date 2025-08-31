import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { importarPacientesMV } from '@/services/importacaoPacientes';

interface ImportacaoMVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportacaoMVModal = ({ open, onOpenChange }: ImportacaoMVModalProps) => {
  const { toast } = useToast();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [estaImportando, setEstaImportando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagemCarregamento, setMensagemCarregamento] = useState('');

  const mensagensDivertidas = [
    'Ajustando os lençóis dos leitos...',
    'Calculando a taxa de ocupação ideal...',
    'Procurando vagas na UTI (tomara que ache!)...',
    'Higienizando leitos em tempo recorde...',
    'Evitando superlotação no pronto-socorro...',
    'Alocando pacientes com maestria...',
    'Organizando a fila da regulação...',
    'Conferindo os prontuários...',
    'Planejando altas para otimizar o fluxo...',
    'Garantindo que nenhum paciente fique sem leito!',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setArquivo(file);
  };

  const handleProgresso = (percentual: number) => {
    setProgresso(percentual);
    if (percentual % 20 === 0 && percentual > 0) {
      const indiceAleatorio = Math.floor(Math.random() * mensagensDivertidas.length);
      setMensagemCarregamento(mensagensDivertidas[indiceAleatorio]);
    }
  };

  const handleImportar = async () => {
    if (!arquivo) return;
    setEstaImportando(true);
    setProgresso(0);
    setMensagemCarregamento('Iniciando a importação...');
    try {
      await importarPacientesMV(arquivo, handleProgresso);
      toast({ title: 'Sucesso!', description: 'Pacientes importados e atualizados.' });
    } catch (error) {
      toast({ title: 'Erro!', description: 'Falha na importação.', variant: 'destructive' });
    } finally {
      setEstaImportando(false);
      setProgresso(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-medical-primary">
            Importar Pacientes do Soul MV
          </DialogTitle>
        </DialogHeader>

        {estaImportando ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <h3 className="text-lg font-medium text-gray-700">Importando Pacientes</h3>
            <p className="text-sm text-gray-500 italic">{mensagemCarregamento}</p>
            <Progress value={progresso} className="w-full" />
            <span className="text-sm font-semibold">{progresso}%</span>
          </div>
        ) : (
          <div className="flex flex-col space-y-4 p-4">
            <Input type="file" accept=".xls,.xlsx,application/vnd.ms-excel" onChange={handleFileChange} />
            <DialogFooter>
              <Button onClick={handleImportar} disabled={!arquivo}>
                Importar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

