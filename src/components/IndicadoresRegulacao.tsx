// src/components/IndicadoresRegulacao.tsx

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, Users, Activity, TrendingUp, Stethoscope } from 'lucide-react';
import { differenceInMinutes, parse, isValid } from 'date-fns';
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

// --- FUNÇÕES DE CÁLCULO DE TEMPO (MAIS ROBUSTAS) ---

// Helper para tentar formatar datas que podem vir em formatos diferentes
const safeParseDate = (dateString: string | undefined | null): Date | null => {
    if (!dateString) return null;
    let date = new Date(dateString); // Tenta formato ISO
    if (isValid(date)) return date;
    date = parse(dateString, 'dd/MM/yyyy HH:mm', new Date()); // Tenta formato BR
    if (isValid(date)) return date;
    return null;
};

const formatarDuracao = (dataInicio: string | undefined | null): string => {
    const dataEntrada = safeParseDate(dataInicio);
    if (!dataEntrada) return 'N/A'; // Retorna 'N/A' se a data for inválida

    const diferencaMinutos = differenceInMinutes(new Date(), dataEntrada);
    if (diferencaMinutos < 0) return 'Recente';

    const dias = Math.floor(diferencaMinutos / 1440);
    const horas = Math.floor((diferencaMinutos % 1440) / 60);
    const minutos = diferencaMinutos % 60;

    if (dias > 0) return `${dias}d ${horas}h`;
    if (horas > 0) return `${horas}h ${minutos}m`;
    return `${minutos}m`;
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
  const cargaTrabalho = useMemo(() => {
    const aguardandoVaga = pacientesAguardandoRegulacao.length + pacientesAguardandoRemanejamento.length;
    const aguardandoConclusao = pacientesJaRegulados.length;
    const totalPendencias = aguardandoVaga + aguardandoConclusao;

    return { totalPendencias, aguardandoVaga, aguardandoConclusao };
  }, [pacientesAguardandoRegulacao, pacientesJaRegulados, pacientesAguardandoRemanejamento]);

  // Card 2: Pontos de Atenção Crítica
  const pontosAtencao = useMemo(() => {
    const solicitacoesCriticas = pacientesAguardandoUTI.length + pacientesAguardandoTransferencia.length;
    
    const datasPedidos = pacientesAguardandoUTI
        .map(p => safeParseDate(p.dataPedidoUTI))
        .filter((d): d is Date => d !== null);

    const dataMaisAntiga =
        datasPedidos.length > 0
            ? new Date(Math.min(...datasPedidos.map(d => d.getTime())))
            : null;

    const tempoMaximoUTI = formatarDuracao(dataMaisAntiga?.toISOString());

    return { solicitacoesCriticas, tempoMaximoUTI };
  }, [pacientesAguardandoUTI, pacientesAguardandoTransferencia]);

  // Card 3: Tempos Médios
  const temposMedias = useMemo(() => {
    const calcularTempoMedio = (listaPacientes: any[], dataField: string): string => {
        if (!listaPacientes || listaPacientes.length === 0) return '0m';

        const duracoesEmMinutos = listaPacientes
            .map(paciente => {
                const dataEntrada = safeParseDate(paciente[dataField]);
                if (!dataEntrada) return null;
                return differenceInMinutes(new Date(), dataEntrada);
            })
            .filter((m): m is number => m !== null && m >= 0);

        if (duracoesEmMinutos.length === 0) return '0m';

        const tempoTotal = duracoesEmMinutos.reduce((acc, curr) => acc + curr, 0);
        const tempoMedioMinutos = tempoTotal / duracoesEmMinutos.length;
        // Reusa a função de formatação para consistência
        return formatarDuracao(new Date(Date.now() - tempoMedioMinutos * 60000).toISOString());
    };
    
    return {
      aguardandoRegulacao: calcularTempoMedio([...decisaoClinica, ...decisaoCirurgica], 'dataInternacao'),
      aguardandoConclusao: calcularTempoMedio(pacientesJaRegulados, 'dataAtualizacaoStatus'),
      aguardandoTransferencia: calcularTempoMedio(pacientesAguardandoTransferencia, 'dataTransferencia'),
    };
  }, [pacientesJaRegulados, pacientesAguardandoTransferencia, decisaoClinica, decisaoCirurgica]);

  // Card 4: Demanda vs. Disponibilidade Real
  const capacidadeReal = useMemo(() => {
    // A lógica de compatibilidade será adicionada aqui no futuro
    return {
      pacientesComVaga: 0,
      leitosDisponiveis: 0,
      pacientesSemVaga: 0,
      pacientesSemLeitoCompativel: [],
      pacientesComLeitoCompativel: [],
      leitosDisponiveisData: []
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
