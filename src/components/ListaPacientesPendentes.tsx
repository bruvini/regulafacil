
import { DadosPaciente } from '@/types/hospital';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PacientePendenteItem } from './PacientePendenteItem';
import { parse } from 'date-fns';

interface ListaPacientesPendentesProps {
  titulo: string;
  pacientes: (DadosPaciente & { setorOrigem: string; setorId?: string; leitoId?: string })[];
  onRegularClick: (paciente: any) => void;
  onAlta?: (setorId: string, leitoId: string) => void;
}

export const ListaPacientesPendentes = ({ titulo, pacientes, onRegularClick, onAlta }: ListaPacientesPendentesProps) => {
  // Ordena os pacientes pelo maior tempo de internação
  const pacientesOrdenados = [...pacientes].sort((a, b) => {
    const dataA = parse(a.dataInternacao, 'dd/MM/yyyy HH:mm', new Date());
    const dataB = parse(b.dataInternacao, 'dd/MM/yyyy HH:mm', new Date());
    return dataA.getTime() - dataB.getTime(); // Do mais antigo para o mais novo
  });

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
                <PacientePendenteItem 
                  key={paciente.nomePaciente} 
                  paciente={paciente} 
                  onRegularClick={() => onRegularClick(paciente)}
                  onAlta={titulo === 'Recuperação Cirúrgica' ? () => onAlta?.(paciente.setorId!, paciente.leitoId!) : undefined}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4">
            Nenhum paciente nesta fila.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
