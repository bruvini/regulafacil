
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatarDuracao } from '@/lib/utils';
import { Paciente } from '@/types/hospital';
import { Setor } from '@/types/hospital';

interface Props {
  pacientes: Paciente[];
  setores: Setor[];
}

export const PacientesAguardandoUTI = ({ pacientes, setores }: Props) => {
  const pacientesUTI = pacientes.filter(p => p.aguardaUTI);

  const getSetorNome = (setorId: string) => {
    const setor = setores.find(s => s.id === setorId);
    return setor ? setor.nomeSetor : 'Setor não encontrado';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-red-600" />
          Pacientes Aguardando UTI
          <Badge variant="secondary">{pacientesUTI.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pacientesUTI.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum paciente aguardando UTI
          </p>
        ) : (
          <div className="space-y-3">
            {pacientesUTI.map((paciente) => (
              <div key={paciente.id} className="border rounded-lg p-4 bg-red-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{paciente.nomeCompleto}</h4>
                    <p className="text-sm text-muted-foreground">
                      Setor: {getSetorNome(paciente.setorId)}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">Solicitado em:</p>
                    <p className="font-medium">
                      {paciente.dataPedidoUTI 
                        ? format(new Date(paciente.dataPedidoUTI), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : 'Data não informada'
                      }
                    </p>
                    {paciente.dataPedidoUTI && (
                      <p className="text-xs text-red-600">
                        Há {formatarDuracao(paciente.dataPedidoUTI)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
