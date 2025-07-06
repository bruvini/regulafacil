
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResumoRegulacoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientesRegulados: any[];
}

export const ResumoRegulacoesModal = ({ open, onOpenChange, pacientesRegulados }: ResumoRegulacoesModalProps) => {
  const { toast } = useToast();

  // Agrupa pacientes por setor de origem
  const pacientesPorOrigemTexto = pacientesRegulados.reduce((acc: Record<string, any[]>, paciente) => {
    const origem = paciente.siglaSetorOrigem || 'Sem Origem';
    if (!acc[origem]) acc[origem] = [];
    acc[origem].push(paciente);
    return acc;
  }, {});

  // Agrupa pacientes por setor de destino
  const pacientesPorDestinoTexto = pacientesRegulados.reduce((acc: Record<string, any[]>, paciente) => {
    const destino = paciente.regulacao?.paraSetor || 'Sem Destino';
    if (!acc[destino]) acc[destino] = [];
    acc[destino].push(paciente);
    return acc;
  }, {});

  const criarTextoOrigem = (setor: string, pacientes: any[]) => {
    return `${setor}:\n${pacientes.map(p => `- ${p.nomePaciente} (${p.leitoCodigo})`).join('\n')}\n`;
  };

  const criarTextoDestino = (setor: string, pacientes: any[]) => {
    return `${setor}:\n${pacientes.map(p => `- ${p.nomePaciente} → ${p.regulacao?.paraLeito || 'Leito indefinido'}`).join('\n')}\n`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!', description: 'Texto copiado para a área de transferência.' });
  };

  const textoCompletoOrigens = Object.entries(pacientesPorOrigemTexto as Record<string, any[]>)
    .map(([setor, pacientes]) => criarTextoOrigem(setor, pacientes))
    .join('\n');

  const textoCompletoDestinos = Object.entries(pacientesPorDestinoTexto as Record<string, any[]>)
    .map(([setor, pacientes]) => criarTextoDestino(setor, pacientes))
    .join('\n');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Resumo de Regulações Pendentes</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto">
          {/* Bloco de Origens */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">ORIGENS</h3>
              <Button size="sm" variant="outline" onClick={() => handleCopy(textoCompletoOrigens)}>
                <Copy className="mr-1 h-3 w-3" /> Copiar Tudo
              </Button>
            </div>
            <div className="space-y-4">
              {Object.entries(pacientesPorOrigemTexto as Record<string, any[]>).length > 0 ? (
                Object.entries(pacientesPorOrigemTexto as Record<string, any[]>).map(([setor, pacientes]) => (
                  <div key={setor} className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-blue-900">{setor} ({pacientes.length})</h4>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleCopy(criarTextoOrigem(setor, pacientes))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {pacientes.map((paciente) => (
                      <p key={paciente.leitoId} className="text-sm text-blue-800">
                        • {paciente.nomePaciente} ({paciente.leitoCodigo})
                      </p>
                    ))}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Nenhuma regulação pendente</p>
              )}
            </div>
          </div>

          {/* Bloco de Destinos */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">DESTINOS</h3>
              <Button size="sm" variant="outline" onClick={() => handleCopy(textoCompletoDestinos)}>
                <Copy className="mr-1 h-3 w-3" /> Copiar Tudo
              </Button>
            </div>
            <div className="space-y-4">
              {Object.entries(pacientesPorDestinoTexto as Record<string, any[]>).length > 0 ? (
                Object.entries(pacientesPorDestinoTexto as Record<string, any[]>).map(([setor, pacientes]) => (
                  <div key={setor} className="bg-green-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-green-900">{setor} ({pacientes.length})</h4>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleCopy(criarTextoDestino(setor, pacientes))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {pacientes.map((paciente) => (
                      <p key={paciente.leitoId} className="text-sm text-green-800">
                        • {paciente.nomePaciente} → {paciente.regulacao?.paraLeito || 'Leito indefinido'}
                      </p>
                    ))}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Nenhuma regulação pendente</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
