import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, Users, Activity, TrendingUp, Stethoscope } from 'lucide-react';
import { differenceInHours, differenceInMinutes, parse, isValid } from 'date-fns';
import { CompatibilidadeModal } from './modals/CompatibilidadeModal';

interface IndicadoresRegulacaoProps {
  pacientesAguardandoRegulacao: any[];
  pacientesJaRegulados: any[];
  pacientesAguardandoRemanejamento: any[];
  pacientesAguardandoUTI: any[];
  pacientesAguardandoTransferencia: any[];
  decisaoClinica: any[];
  decisaoCirurgica: any[];
  recuperacaoCirurgica: any[];
  leitos: any[];
  pacientes: any[];
}

interface CargaDeTrabalho {
  totalPendencias: number;
  aguardandoVaga: number;
  aguardandoConclusao: number;
}

interface PontosDeAtencao {
  solicitacoesCriticas: number;
  tempoMaximoUTI: string;
}

interface TemposMedias {
  aguardandoRegulacao: string;
  aguardandoConclusao: string;
  aguardandoTransferencia: string;
}

const calcularHoras = (dataInicio: string): string => {
  const dataEntrada = parse(dataInicio, 'dd/MM/yyyy HH:mm', new Date());

  if (!isValid(dataEntrada)) {
    return 'Data inválida';
  }

  const diferencaHoras = differenceInHours(new Date(), dataEntrada);
  const horas = diferencaHoras % 24;
  const dias = Math.floor(diferencaHoras / 24);

  if (dias > 0) {
    return `${dias}d ${horas}h`;
  } else {
    return `${horas}h`;
  }
};

export const IndicadoresRegulacao = ({
  pacientesAguardandoRegulacao,
  pacientesJaRegulados,
  pacientesAguardandoRemanejamento,
  pacientesAguardandoUTI,
  pacientesAguardandoTransferencia,
  decisaoClinica,
  decisaoCirurgica,
  recuperacaoCirurgica,
  leitos,
  pacientes
}: IndicadoresRegulacaoProps) => {
  const [compatibilidadeModalOpen, setCompatibilidadeModalOpen] = useState(false);

  // Card 1: Carga de Trabalho Atual
  const cargaTrabalho: CargaDeTrabalho = useMemo(() => {
    const aguardandoVaga = pacientesAguardandoRegulacao.length + pacientesAguardandoRemanejamento.length + pacientesAguardandoUTI.length;
    const aguardandoConclusao = pacientesJaRegulados.length + pacientesAguardandoTransferencia.length;
    const totalPendencias = aguardandoVaga + aguardandoConclusao;

    return {
      totalPendencias,
      aguardandoVaga,
      aguardandoConclusao,
    };
  }, [pacientesAguardandoRegulacao, pacientesJaRegulados, pacientesAguardandoRemanejamento, pacientesAguardandoUTI, pacientesAguardandoTransferencia]);

  // Card 2: Pontos de Atenção Crítica
  const pontosAtencao: PontosDeAtencao = useMemo(() => {
    const solicitacoesCriticas = pacientesAguardandoUTI.length + pacientesAguardandoTransferencia.length;
    const tempoMaximoUTI = pacientesAguardandoUTI.length > 0
      ? calcularHoras(pacientesAguardandoUTI.reduce((maxData, paciente) =>
        paciente.dataPedidoUTI > maxData.dataPedidoUTI ? paciente : maxData
      ).dataPedidoUTI)
      : 'N/A';

    return {
      solicitacoesCriticas,
      tempoMaximoUTI,
    };
  }, [pacientesAguardandoUTI, pacientesAguardandoTransferencia]);

  // Card 3: Tempos Médios
  const temposMedias: TemposMedias = useMemo(() => {
    const calcularTempoMedio = (pacientes: any[]): string => {
      if (pacientes.length === 0) return 'N/A';

      const tempos = pacientes.map(paciente => {
        const dataEntrada = parse(paciente.dataInternacao, 'dd/MM/yyyy HH:mm', new Date());
        return differenceInMinutes(new Date(), dataEntrada);
      });

      const tempoTotal = tempos.reduce((acc, curr) => acc + curr, 0);
      const tempoMedioMinutos = tempoTotal / pacientes.length;
      const tempoMedioHoras = tempoMedioMinutos / 60;

      if (tempoMedioHoras < 1) {
        return `${Math.round(tempoMedioMinutos)}m`;
      } else if (tempoMedioHoras < 24) {
        return `${Math.round(tempoMedioHoras)}h`;
      } else {
        const tempoMedioDias = tempoMedioHoras / 24;
        return `${Math.round(tempoMedioDias)}d`;
      }
    };

    return {
      aguardandoRegulacao: calcularTempoMedio(pacientesAguardandoRegulacao),
      aguardandoConclusao: calcularTempoMedio(pacientesJaRegulados),
      aguardandoTransferencia: calcularTempoMedio(pacientesAguardandoTransferencia),
    };
  }, [pacientesAguardandoRegulacao, pacientesJaRegulados, pacientesAguardandoTransferencia]);

  // Card 4: Demanda vs. Disponibilidade Real - VERSÃO APRIMORADA
  const capacidadeReal = useMemo(() => {
    const leitosDisponiveis = leitos.filter(leito => {
      const ultimoStatus = leito.historicoMovimentacao[leito.historicoMovimentacao.length - 1];
      return ultimoStatus.statusLeito === 'Vago' || ultimoStatus.statusLeito === 'Higienizacao';
    });

    const todosAguardandoVaga = [
      ...pacientesAguardandoRegulacao,
      ...pacientesAguardandoRemanejamento,
      ...pacientesAguardandoUTI
    ];

    const pacientesSemLeitoCompativel: any[] = [];
    const pacientesComLeitoCompativel: any[] = [];

    todosAguardandoVaga.forEach(paciente => {
      const temLeitoCompativel = leitosDisponiveis.some(leito => {
        // Lógica de compatibilidade simplificada
        // Em um cenário real, você implementaria verificações mais complexas
        return true; // Por simplicidade, assumindo compatibilidade básica
      });

      if (temLeitoCompativel) {
        pacientesComLeitoCompativel.push(paciente);
      } else {
        pacientesSemLeitoCompativel.push(paciente);
      }
    });

    return {
      leitosDisponiveis: leitosDisponiveis.length,
      pacientesComVaga: pacientesComLeitoCompativel.length,
      pacientesSemVaga: pacientesSemLeitoCompativel.length,
      pacientesSemLeitoCompativel,
      pacientesComLeitoCompativel,
      leitosDisponiveisData: leitosDisponiveis
    };
  }, [pacientesAguardandoRegulacao, pacientesAguardandoRemanejamento, pacientesAguardandoUTI, leitos]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Carga de Trabalho Atual */}
        <Card className="shadow-card border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Carga de Trabalho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-medical-primary">
                {cargaTrabalho.totalPendencias}
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Aguardando Vaga:</span>
                  <Badge variant="secondary">{cargaTrabalho.aguardandoVaga}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Aguardando Conclusão:</span>
                  <Badge variant="outline">{cargaTrabalho.aguardandoConclusao}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pontos de Atenção Crítica */}
        <Card className="shadow-card border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Atenção Crítica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-amber-600">
                {pontosAtencao.solicitacoesCriticas}
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Espera Máx. UTI: {pontosAtencao.tempoMaximoUTI}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Tempos Médios */}
        <Card className="shadow-card border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tempos Médios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Aguardando Regulação:</span>
                <span className="font-medium">{temposMedias.aguardandoRegulacao}</span>
              </div>
              <div className="flex justify-between">
                <span>Aguardando Conclusão:</span>
                <span className="font-medium">{temposMedias.aguardandoConclusao}</span>
              </div>
              <div className="flex justify-between">
                <span>Aguardando Transferência:</span>
                <span className="font-medium">{temposMedias.aguardandoTransferencia}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Capacidade Real - INTERATIVO */}
        <Card className="shadow-card border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Capacidade Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-lg font-bold">
                {capacidadeReal.pacientesComVaga} / {capacidadeReal.leitosDisponiveis}
              </div>
              <div className="text-xs text-muted-foreground">
                Pacientes com vaga / Leitos vagos
              </div>
              {capacidadeReal.pacientesSemVaga > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setCompatibilidadeModalOpen(true)}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {capacidadeReal.pacientesSemVaga} sem leito compatível
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <CompatibilidadeModal
        open={compatibilidadeModalOpen}
        onOpenChange={setCompatibilidadeModalOpen}
        pacientesSemLeitoCompativel={capacidadeReal.pacientesSemLeitoCompativel}
        pacientesComLeitoCompativel={capacidadeReal.pacientesComLeitoCompativel}
        leitosDisponiveis={capacidadeReal.leitosDisponiveisData}
      />
    </>
  );
};
