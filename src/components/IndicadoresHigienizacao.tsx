
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Sparkles, Building, CheckCircle, Star } from 'lucide-react';

interface IndicadoresHigienizacaoProps {
  indicadores: {
    quantidadeAguardando: number;
    quantidadePrioritaria: number;
    tempoMedioEspera: string;
    top3Setores: { nome: string; quantidade: number }[];
    totalConcluidas: number;
  };
}

const IndicadoresHigienizacao = ({ indicadores }: IndicadoresHigienizacaoProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Quantidade Aguardando */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aguardando Limpeza</CardTitle>
          <Sparkles className="h-4 w-4 text-medical-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-medical-primary">
            {indicadores.quantidadeAguardando}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {indicadores.quantidadeAguardando === 1 ? 'leito' : 'leitos'}
            </p>
            {indicadores.quantidadePrioritaria > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                  {indicadores.quantidadePrioritaria} prioritário{indicadores.quantidadePrioritaria !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tempo Médio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {indicadores.tempoMedioEspera}
          </div>
          <p className="text-xs text-muted-foreground">de espera</p>
        </CardContent>
      </Card>

      {/* Total Concluídas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Concluídas</CardTitle>
          <CheckCircle className="h-4 w-4 text-medical-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-medical-success">
            {indicadores.totalConcluidas}
          </div>
          <p className="text-xs text-muted-foreground">higienizações</p>
        </CardContent>
      </Card>

      {/* Top 3 Setores */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top 3 Setores</CardTitle>
          <Building className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          {indicadores.top3Setores.length > 0 ? (
            <div className="space-y-1">
              {indicadores.top3Setores.map((setor, index) => (
                <div key={setor.nome} className="flex items-center justify-between">
                  <span className="text-xs truncate max-w-[120px]" title={setor.nome}>
                    {index + 1}. {setor.nome}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {setor.quantidade}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum setor</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IndicadoresHigienizacao;
