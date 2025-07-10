
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, User, Bed, Check } from 'lucide-react';
import { SugestaoRemanejamento } from '@/hooks/useIsolamentoSugestoes';

interface Props {
  sugestao: SugestaoRemanejamento;
  onAceitar: (sugestao: SugestaoRemanejamento) => void;
  loading: boolean;
}

export const SugestaoIsolamentoItem = ({ sugestao, onAceitar, loading }: Props) => {
  const { paciente, leitoDestino, motivo } = sugestao;

  return (
    <Card className="bg-amber-50 border-amber-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-amber-900">{motivo}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-md bg-white">
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-bold text-sm">{paciente.nomePaciente}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{paciente.sexoPaciente.charAt(0)}</Badge>
                <p className="text-xs text-muted-foreground">Origem: {paciente.setorNome} - {paciente.leitoCodigo}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center">
            <ArrowRight className="h-5 w-5 text-amber-600 animate-pulse" />
          </div>

          <div className="flex items-center gap-3 p-2 rounded-md bg-white">
            <Bed className="h-5 w-5 text-medical-success" />
            <div className="flex-1">
              <p className="font-bold text-sm">{leitoDestino.setorNome}</p>
              <p className="text-xs text-muted-foreground">Destino: Leito {leitoDestino.codigoLeito}</p>
            </div>
          </div>
        </div>

        <Button onClick={() => onAceitar(sugestao)} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
          <Check className="mr-2 h-4 w-4" />
          Aceitar Sugestão
        </Button>
      </CardContent>
    </Card>
  );
};
