
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientesRegulados: any[];
}

export const ResumoRegulacoesModal = ({ open, onOpenChange, pacientesRegulados }: Props) => {
  const { toast } = useToast();

  // Agrupa pacientes por setor de origem
  const pacientesPorOrigem = pacientesRegulados.reduce((acc, paciente) => {
    const origem = paciente.siglaSetorOrigem;
    if (!acc[origem]) acc[origem] = [];
    acc[origem].push(paciente);
    return acc;
  }, {} as Record<string, any[]>);

  // Agrupa pacientes por setor de destino
  const pacientesPorDestino = pacientesRegulados.reduce((acc, paciente) => {
    const destino = paciente.regulacao?.paraSetorSigla || 'N/A';
    if (!acc[destino]) acc[destino] = [];
    acc[destino].push(paciente);
    return acc;
  }, {} as Record<string, any[]>);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!', description: 'Texto copiado para a área de transferência.' });
  };

  const gerarTextoOrigem = (setor: string, pacientes: any[]) => {
    const header = `📍 ${setor} (${pacientes.length} paciente${pacientes.length > 1 ? 's' : ''})\n`;
    const lista = pacientes.map(p => 
      `• ${p.nomePaciente} → ${p.regulacao?.paraSetorSigla} - ${p.regulacao?.paraLeito}`
    ).join('\n');
    return header + lista;
  };

  const gerarTextoDestino = (setor: string, pacientes: any[]) => {
    const header = `🏥 ${setor} (${pacientes.length} paciente${pacientes.length > 1 ? 's' : ''})\n`;
    const lista = pacientes.map(p => 
      `• ${p.nomePaciente} (de ${p.siglaSetorOrigem} - ${p.leitoCodigo}) → ${p.regulacao?.paraLeito}`
    ).join('\n');
    return header + lista;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Resumo de Regulações Pendentes ({pacientesRegulados.length} pacientes)</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto">
          {/* Bloco de Origens */}
          <div>
            <h3 className="font-bold mb-4 text-lg">📍 ORIGENS</h3>
            <div className="space-y-3">
              {Object.entries(pacientesPorOrigem).map(([setor, pacientes]) => (
                <Card key={setor} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-blue-700">{setor}</h4>
                      <div className="flex gap-1">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {pacientes.length}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleCopy(gerarTextoOrigem(setor, pacientes))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      {pacientes.map(p => (
                        <div key={p.leitoId} className="text-muted-foreground">
                          • {p.nomePaciente} → {p.regulacao?.paraSetorSigla} - {p.regulacao?.paraLeito}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Bloco de Destinos */}
          <div>
            <h3 className="font-bold mb-4 text-lg">🏥 DESTINOS</h3>
            <div className="space-y-3">
              {Object.entries(pacientesPorDestino).map(([setor, pacientes]) => (
                <Card key={setor} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-green-700">{setor}</h4>
                      <div className="flex gap-1">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {pacientes.length}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleCopy(gerarTextoDestino(setor, pacientes))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      {pacientes.map(p => (
                        <div key={p.leitoId} className="text-muted-foreground">
                          • {p.nomePaciente} (de {p.siglaSetorOrigem} - {p.leitoCodigo}) → {p.regulacao?.paraLeito}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
