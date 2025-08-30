// src/components/modals/RelatorioIsolamentosModal.tsx

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSetores } from '@/hooks/useSetores';
import { useLeitos } from '@/hooks/useLeitos';   // NOVO
import { usePacientes } from '@/hooks/usePacientes'; // NOVO

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RelatorioIsolamentosModal = ({ open, onOpenChange }: Props) => {
  // CORREÇÃO: Busca os dados das três fontes separadas
  const { setores } = useSetores();
  const { leitos } = useLeitos();
  const { pacientes } = usePacientes();

  // CORREÇÃO: Lógica de dados totalmente reescrita
  const pacientesEmIsolamento = useMemo(() => {
    const mapaLeitos = new Map(leitos.map(l => [l.id, l]));
    const mapaSetores = new Map(setores.map(s => [s.id, s]));

    // 1. Filtra primeiro os pacientes que têm isolamento
    const pacientesFiltrados = pacientes.filter(
      p => p.isolamentosVigentes && p.isolamentosVigentes.length > 0
    );

    // 2. Agrupa os pacientes filtrados por nome do setor
    const agrupados: Record<string, any[]> = {};

    pacientesFiltrados.forEach(paciente => {
      const leito = mapaLeitos.get(paciente.leitoId);
      if (!leito) return;
      
      const setor = mapaSetores.get(leito.setorId);
      if (!setor) return;

      const dadosPacienteParaRelatorio = {
        leito: leito.codigoLeito,
        nome: paciente.nomeCompleto, // CORREÇÃO: Usa nomeCompleto
        sexo: paciente.sexoPaciente.charAt(0),
        isolamentos: paciente.isolamentosVigentes!.map(i => ({
          sigla: i.sigla,
          dataInicio: i.dataInicio
        }))
      };

      if (!agrupados[setor.nomeSetor]) {
        agrupados[setor.nomeSetor] = [];
      }
      agrupados[setor.nomeSetor].push(dadosPacienteParaRelatorio);
    });

    return agrupados;
  }, [pacientes, leitos, setores]);

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
                {Object.keys(pacientesEmIsolamento).length > 0 ? (
                    Object.entries(pacientesEmIsolamento)
                      .sort(([setorA], [setorB]) => setorA.localeCompare(setorB)) // Ordena por nome do setor
                      .map(([setorNome, pacientesDoSetor]) => (
                      <Card key={setorNome}>
                        <CardHeader className="py-2 px-4">
                          <CardTitle className="text-base">{setorNome}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-2">
                            {pacientesDoSetor
                              .sort((a,b) => a.leito.localeCompare(b.leito, undefined, { numeric: true })) // Ordena por leito
                              .map(p => (
                              <div key={p.leito} className="text-sm border-b pb-2 last:border-b-0">
                                <p><strong>{p.leito}:</strong> {p.nome} ({p.sexo})</p>
                                <ul className="list-disc list-inside pl-4 mt-1">
                                  {p.isolamentos.map((iso: any) => (
                                    <li key={iso.sigla}>
                                      <span className="font-semibold text-red-600">{iso.sigla}:</span> Incluído em {new Date(iso.dataInicio).toLocaleDateString('pt-BR')}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
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