import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIsolamentos } from '@/hooks/useIsolamentos';
import { GerenciadorDeRegras } from './GerenciadorDeRegras';
import { Shield } from 'lucide-react';

interface PacienteEmVigilanciaCardProps {
  paciente: any;
  setorId: string;
  leitoId: string;
}

export const PacienteEmVigilanciaCard = ({ paciente, setorId, leitoId }: PacienteEmVigilanciaCardProps) => {
  const { isolamentos: tiposDeIsolamento } = useIsolamentos();

  const calcularIdade = (dataNascimento: string): string => {
    if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return '?';
    const [dia, mes, ano] = dataNascimento.split('/').map(Number);
    const hoje = new Date();
    const nascimento = new Date(ano, mes - 1, dia);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade.toString();
  };

  return (
    <Card className="w-full bg-muted/30">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-medical-danger" />
          <div>
            <CardTitle className="text-base">{paciente.nomePaciente}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {paciente.leitoCodigo} • {paciente.especialidadePaciente}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {paciente.isolamentosVigentes?.map((isolamentoVigente: any) => {
          const tipoIsolamento = tiposDeIsolamento.find(t => t.id === isolamentoVigente.isolamentoId);
          if (!tipoIsolamento) return null;

          return (
            <Card key={isolamentoVigente.isolamentoId} className="bg-background">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tipoIsolamento.cor }} />
                    <div>
                       <p className="font-semibold">{tipoIsolamento.nomeMicroorganismo}</p>
                       <p className="text-xs text-muted-foreground">Início: {new Date(isolamentoVigente.dataInicio).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <Badge style={{ backgroundColor: tipoIsolamento.cor, color: 'white' }}>{tipoIsolamento.sigla}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <GerenciadorDeRegras
                  isolamentoVigente={isolamentoVigente}
                  tipoIsolamento={tipoIsolamento}
                  setorId={setorId}
                  leitoId={leitoId}
                />
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
};