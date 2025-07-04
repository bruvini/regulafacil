
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUp, Info } from 'lucide-react';

interface ImportacaoMVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Por enquanto, a função onFileSelect não fará nada, mas já vamos deixá-la preparada
  onFileSelect: (file: File) => void; 
}

export const ImportacaoMVModal = ({ open, onOpenChange, onFileSelect }: ImportacaoMVModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // Validação básica do tipo de arquivo
      if (file.name.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        alert("Por favor, selecione um arquivo no formato XLS.");
        setSelectedFile(null);
        event.target.value = ''; // Limpa o input
      }
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
      onOpenChange(false); // Fecha o modal após a seleção
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-medical-primary">Importar Pacientes do Soul MV</DialogTitle>
          <DialogDescription>
            Siga os passos abaixo para exportar os dados e depois importe o arquivo gerado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
            {/* Coluna de Instruções */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                <h3 className="font-semibold text-foreground flex items-center"><Info className="h-4 w-4 mr-2 text-blue-600" />Como Obter o Arquivo</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Acesse o painel do Soul MV clicando no link abaixo:
                        <br />
                        <a href="http://1495prd.cloudmv.com.br/Painel/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium underline">
                            Acessar Painel Soul MV
                        </a>
                    </li>
                    <li>Faça login com o usuário <code className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">NIR</code> e a senha <code className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">nir@2025</code>.</li>
                    <li>Na aba "Indicadores", localize o painel <span className="font-semibold text-foreground">"NIR - Ocupação Setores"</span>.</li>
                    <li>Clique no ícone de banco de dados e depois em "Exportar".</li>
                    <li>Selecione o formato <span className="font-semibold text-foreground">"XLS"</span> e clique no ícone de disquete para salvar.</li>
                    <li>Volte para esta tela e selecione o arquivo salvo no campo ao lado.</li>
                </ol>
            </div>

            {/* Coluna de Upload */}
            <div className="flex flex-col items-center justify-center space-y-4 p-4 border-2 border-dashed border-border rounded-lg">
                <FileUp className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-center text-muted-foreground">Arraste e solte o arquivo XLS aqui ou clique no botão para selecionar.</p>
                <label htmlFor="file-upload" className="cursor-pointer">
                    <Button asChild>
                        <span className="pointer-events-none">Selecionar Arquivo</span>
                    </Button>
                    <Input id="file-upload" type="file" className="hidden" accept=".xls,application/vnd.ms-excel" onChange={handleFileChange} />
                </label>
                {selectedFile && (
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 break-all text-center px-2">
                        Arquivo selecionado: {selectedFile.name}
                    </p>
                )}
            </div>
        </div>
        
        <div className="flex justify-end pt-2">
            <Button onClick={handleConfirm} disabled={!selectedFile}>
                Processar Arquivo
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
