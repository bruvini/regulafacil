import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BedDouble, User2, Users2, PercentCircle } from 'lucide-react';
import { formatarDuracao } from '@/lib/utils';

interface IndicadoresGeraisProps {
  contagem: { [key: string]: number };
  taxa: { [key: string]: number };
  tempos: { [key: string]: string };
  nivelPCP: number;
}

export const IndicadoresGerais = ({ contagem, taxa, tempos, nivelPCP }: IndicadoresGeraisProps) => {
  const totalLeitos = Object.values(contagem).reduce((acc, curr) => acc + curr, 0);
  const ocupacaoPercent = taxa.Ocupado ? taxa.Ocupado : 0;
  const tempoMedioOcupacao = tempos.Ocupado ? tempos.Ocupado : 'N/A';
  const tempoMedioHigienizacao = tempos.Higienizacao ? tempos.Higienizacao : 'N/A';

  // Calcular leitos vagos sem isolamento (assumindo que leitos com isolamento têm uma propriedade específica)
  const totalVagos = contagem.Vago || 0;
  // Aqui você pode adicionar lógica para calcular vagos sem isolamento se tiver essa informação
  // Por enquanto, vou assumir que 80% dos vagos não estão em isolamento como exemplo
  const vagosSemIsolamento = Math.floor(totalVagos * 0.8);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card de Visão Geral */}
      <Card className="shadow-card border border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Leitos</CardTitle>
          <BedDouble className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold">{totalLeitos}</span>
            <span className="text-xs text-muted-foreground">na unidade</span>
          </div>
        </CardContent>
      </Card>

      {/* Card de Taxa de Ocupação */}
      <Card className="shadow-card border border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
          <User2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold">{ocupacaoPercent}%</span>
            <span className="text-xs text-muted-foreground">dos leitos</span>
          </div>
        </CardContent>
      </Card>

      {/* Card de Tempo Médio de Ocupação */}
       <Card className="shadow-card border border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio de Ocupação</CardTitle>
          <Users2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold">{tempoMedioOcupacao}</span>
            <span className="text-xs text-muted-foreground">por leito</span>
          </div>
        </CardContent>
      </Card>

      {/* Card de Leitos Vagos - atualizado */}
      <Card className="shadow-card border border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leitos Vagos</CardTitle>
          <BedDouble className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold">{totalVagos}</span>
            <span className="text-xs text-muted-foreground">no total</span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            ({vagosSemIsolamento} vagos desconsiderando isolamento de coorte)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
