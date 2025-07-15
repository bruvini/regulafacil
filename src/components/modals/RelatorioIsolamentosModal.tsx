
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSetores } from '@/hooks/useSetores';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RelatorioIsolamentosModal = ({ open, onOpenChange }: Props) => {
  const { setores } = useSetores();

  const pacientesEmIsolamento = useMemo(() => {
    const agrupados: Record<string, any[]> = {};
    setores.forEach(setor => {
      const pacientesDoSetor = setor.leitos
        .filter(l => l.statusLeito === 'Ocupado' && l.dadosPaciente?.isolamentosVigentes?.length)
        .map(l => ({
          leito: l.codigoLeito,
          nome: l.dadosPaciente!.nomePaciente,
          sexo: l.dadosPaciente!.sexoPaciente.charAt(0),
          isolamentos: l.dadosPaciente!.isolamentosVigentes!.map(i => i.sigla).join(', ')
        }));

      if (pacientesDoSetor.length > 0) {
        agrupados[setor.nomeSetor] = pacientesDoSetor;
      }
    });
    return agrupados;
  }, [setores]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Relatório de Pacientes em Isolamento</DialogTitle>
          <DialogDescription>Lista de todos os pacientes atualmente em protocolo de isolamento, agrupados por setor.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0">
            <ScrollArea className="h-full pr-4 -mr-4">
              <div className="space-y-4">
                {Object.entries(pacientesEmIsolamento).length > 0 ? (
                    Object.entries(pacientesEmIsolamento).map(([setorNome, pacientes]) => (
                      <Card key={setorNome}>
                        <CardHeader className="py-2 px-4">
                          <CardTitle className="text-base">{setorNome}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {pacientes.map(p => (
                              <li key={p.leito}>
                                <strong>{p.leito}:</strong> {p.nome} ({p.sexo}) - <span className="font-semibold text-red-600">{p.isolamentos}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))
                ) : (
                    <p className="text-center text-muted-foreground py-10">Nenhum paciente em isolamento.</p>
                )}
              </div>
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
