
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImportacaoResumoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumo: Record<string, any[]> | null;
}

const ImportacaoResumoModal = ({ open, onOpenChange, resumo }: ImportacaoResumoModalProps) => {
  if (!resumo) return null;

  const totalPacientes = Object.values(resumo).reduce((total, pacientes) => total + pacientes.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-medical-primary">
            Resumo da Importação
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              Arquivo importado com sucesso!
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Pacientes por Setor:</h3>
            <ul className="space-y-2">
              {Object.entries(resumo).map(([setor, pacientes]) => (
                <li key={setor} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{setor}</span>
                  <span className="bg-medical-primary text-white px-3 py-1 rounded-full text-sm">
                    {pacientes.length} pacientes
                  </span>
                </li>
              ))}
            </ul>
            
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Total geral:</strong> {totalPacientes} pacientes importados
              </p>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button onClick={() => onOpenChange(false)} variant="medical">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportacaoResumoModal;
