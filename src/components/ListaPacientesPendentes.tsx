
import { DadosPaciente } from '@/types/hospital';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PacientePendenteItem } from './PacientePendenteItem';
import { parse } from 'date-fns';

interface ListaPacientesPendentesProps {
  titulo: string;
  pacientes: (DadosPaciente & { setorOrigem: string; setorId?: string; leitoId?: string })[];
  onAlta?: (setorId: string, leitoId: string) => void;
}

export const ListaPacientesPendentes = ({ titulo, pacientes, onAlta }: ListaPacientesPendentesProps) => {
  // Ordena os pacientes pelo maior tempo de internação
  const pacientesOrdenados = [...pacientes].sort((a, b) => {
    const dataA = parse(a.dataInternacao, 'dd/MM/yyyy HH:mm', new Date());
    const dataB = parse(b.dataInternacao, 'dd/MM/yyyy HH:mm', new Date());
    return dataA.getTime() - dataB.getTime(); // Do mais antigo para o mais novo
  });

  const handleAlta = () => {
    if (pacientes.length > 0 && pacientes[0].setorId && pacientes[0].leitoId) {
      onAlta?.(pacientes[0].setorId, pacientes[0].leitoId);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-base font-semibold">{titulo}</CardTitle>
        <Badge variant="secondary">{pacientes.length}</Badge>
      </CardHeader>
      <CardContent className="p-0 flex-grow flex flex-col">
        {pacientes.length > 0 ? (
          <ScrollArea className="h-72 p-2">
            <div className="space-y-2">
              {pacientesOrdenados.map(paciente => (
                <PacientePendenteItem key={paciente.nomePaciente} paciente={paciente} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4">
            Nenhum paciente nesta fila.
          </div>
        )}
        {titulo === 'Recuperação Cirúrgica' && pacientes.length > 0 && (
          <div className="p-2 border-t mt-auto">
            <Button size="sm" className="w-full" onClick={handleAlta}>
              Alta após Recuperação
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
