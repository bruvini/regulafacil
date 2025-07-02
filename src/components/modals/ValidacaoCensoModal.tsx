
import { Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ResultadoValidacao {
  pacientesValidados: number;
  discrepancias: Record<string, string[]>;
}

interface ValidacaoCensoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultado: ResultadoValidacao | null;
}

const ValidacaoCensoModal = ({ open, onOpenChange, resultado }: ValidacaoCensoModalProps) => {
  const { toast } = useToast();

  const copiarLeitos = (leitos: string[]) => {
    const texto = leitos.join(', ');
    navigator.clipboard.writeText(texto).then(() => {
      toast({
        title: 'Copiado!',
        description: 'Lista de leitos copiada para a área de transferência.',
      });
    }).catch(() => {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar a lista.',
        variant: 'destructive',
      });
    });
  };

  if (!resultado) return null;

  const temDiscrepancias = Object.keys(resultado.discrepancias).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-medical-primary">
            Resultado da Validação do Censo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Seção de Sucesso */}
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">
                Foram encontrados e validados {resultado.pacientesValidados} pacientes no sistema.
              </p>
            </div>
          </div>

          {/* Seção de Pendências */}
          {temDiscrepancias && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800">Pendências de Cadastro</h3>
              </div>
              
              <div className="space-y-4">
                {Object.entries(resultado.discrepancias).map(([setor, leitos]) => (
                  <div key={setor} className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-lg text-medical-primary">{setor}</h4>
                    <p className="text-sm text-muted-foreground">
                      {leitos.length} leito{leitos.length > 1 ? 's' : ''} não encontrado{leitos.length > 1 ? 's' : ''}:
                    </p>
                    
                    <div className="flex space-x-2">
                      <Textarea
                        value={leitos.join(', ')}
                        readOnly
                        className="min-h-[60px] bg-gray-50"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copiarLeitos(leitos)}
                        className="shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 <strong>Dica:</strong> Use o botão "Copiar" para facilitar o cadastro em massa dos leitos faltantes.
                </p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ValidacaoCensoModal;
