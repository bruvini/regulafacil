
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUp, Info } from 'lucide-react';
import { ValidacaoImportacao, ResultadoValidacao, SyncSummary } from './ValidacaoImportacao';

interface ImportacaoMVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessFileRequest: (file: File) => void;
  validationResult: ResultadoValidacao | null;
  syncSummary: SyncSummary | null;
  processing: boolean;
  isSyncing: boolean;
  onConfirmSync: () => void;
}

export const ImportacaoMVModal = ({ 
  open, 
  onOpenChange, 
  onProcessFileRequest, 
  validationResult, 
  syncSummary,
  processing, 
  isSyncing,
  onConfirmSync 
}: ImportacaoMVModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.name.endsWith('.xls') || file.type === 'application/vnd.ms-excel')) {
      setSelectedFile(file);
    } else {
      alert("Por favor, selecione um arquivo no formato XLS.");
      setSelectedFile(null);
      if (event.target) event.target.value = '';
    }
  };

  const handleProcessClick = () => {
    if (selectedFile) {
      onProcessFileRequest(selectedFile);
    }
  };
  
  const handleContinue = () => {
    // This triggers the sync summary generation
    if (selectedFile) {
      onProcessFileRequest(selectedFile);
    }
  };

  const isShowingResults = validationResult || syncSummary;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        setSelectedFile(null);
      }
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-medical-primary">
            {syncSummary 
              ? "Confirmação de Sincronização" 
              : validationResult 
                ? "Validação de Dados da Planilha" 
                : "Importar Pacientes do Soul MV"
            }
          </DialogTitle>
          {!isShowingResults && (
            <DialogDescription>
              Siga os passos para exportar os dados e importe o arquivo gerado.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-6 -mr-6">
          {isShowingResults ? (
              <ValidacaoImportacao 
                resultado={validationResult} 
                syncSummary={syncSummary}
                onContinue={handleContinue} 
                onConfirmSync={onConfirmSync}
                isSyncing={isSyncing}
              />
          ) : (
              <>
                  <div className="grid md:grid-cols-2 gap-6 py-4">
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                          <h3 className="font-semibold text-foreground flex items-center"><Info className="h-4 w-4 mr-2 text-blue-600" />Como Obter o Arquivo</h3>
                          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                              <li>Acesse o painel do Soul MV: <a href="http://1495prd.cloudmv.com.br/Painel/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium underline">Acessar Painel</a></li>
                              <li>Login: <code className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">NIR</code>, Senha: <code className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">nir@2025</code>.</li>
                              <li>Em "Indicadores", localize o painel <span className="font-semibold text-foreground">"NIR - Ocupação Setores"</span>.</li>
                              <li>Clique no ícone de banco de dados, depois em "Exportar".</li>
                              <li>Selecione o formato <span className="font-semibold text-foreground">"XLS"</span> e clique no disquete para salvar.</li>
                              <li>Volte para esta tela e selecione o arquivo salvo.</li>
                          </ol>
                      </div>

                      <div className="flex flex-col items-center justify-center space-y-4 p-4 border-2 border-dashed border-border rounded-lg">
                          <FileUp className="h-12 w-12 text-muted-foreground" />
                          <p className="text-sm text-center text-muted-foreground">Arraste e solte o arquivo XLS ou clique para selecionar.</p>
                          <label htmlFor="file-upload" className="cursor-pointer">
                              <Button asChild><span className="pointer-events-none">Selecionar Arquivo</span></Button>
                              <Input id="file-upload" type="file" className="hidden" accept=".xls,application/vnd.ms-excel" onChange={handleFileChange} />
                          </label>
                          {selectedFile && <p className="text-sm font-medium text-green-700">Arquivo: {selectedFile.name}</p>}
                      </div>
                  </div>
              </>
          )}
        </div>

        {!isShowingResults && (
          <DialogFooter className="pt-4 border-t mt-4">
            <Button onClick={handleProcessClick} disabled={!selectedFile || processing}>
              {processing ? "Processando..." : "Validar Dados do Arquivo"}
            </Button>
          </DialogFooter>
        )}

      </DialogContent>
    </Dialog>
  );
};
