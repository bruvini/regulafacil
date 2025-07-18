// src/components/IndicadoresRegulacao.tsx

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, Users, Activity, TrendingUp, Stethoscope } from 'lucide-react';
import { differenceInMinutes, parse, isValid } from 'date-fns';
import { CompatibilidadeModal } from './modals/CompatibilidadeModal';
import { Paciente, Leito } from '@/types/hospital';

interface IndicadoresRegulacaoProps {
  pacientesAguardandoRegulacao: any[];
  pacientesJaRegulados: any[];
  pacientesAguardandoRemanejamento: any[];
  pacientesAguardandoUTI: any[];
  pacientesAguardandoTransferencia: any[];
  decisaoClinica: any[];
  decisaoCirurgica: any[];
  recuperacaoCirurgica: any[];
  leitos: Leito[];
  pacientes: Paciente[];
}

// --- FUNÇÕES DE CÁLCULO DE TEMPO (MAIS ROBUSTAS) ---
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
    if (!dataEntrada) return 'N/A';

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

  const indicadores = useMemo(() => {
    // --- LÓGICA CORRIGIDA PARA DEMANDA REAL ---
    const setoresDeEntrada = ["CC - RECUPERAÇÃO", "PS DECISÃO CIRURGICA", "PS DECISÃO CLINICA"];
    
    const pacientesNosSetoresDeEntrada = pacientesAguardandoRegulacao.filter(p =>
      setoresDeEntrada.includes(p.setorOrigem)
    );
    const idsPacientesJaContados = new Set(pacientesNosSetoresDeEntrada.map(p => p.id));

    const pacientesUTIForaDosSetores = pacientesAguardandoUTI.filter(p => 
      !idsPacientesJaContados.has(p.id)
    );
    const pacientesRemanejamentoForaDosSetores = pacientesAguardandoRemanejamento.filter(p => 
      !idsPacientesJaContados.has(p.id)
    );
    
    const demandaReal = [
      ...pacientesNosSetoresDeEntrada,
      ...pacientesUTIForaDosSetores,
      ...pacientesRemanejamentoForaDosSetores
    ];
    
    // --- Card 1: Carga de Trabalho Atual ---
    const aguardandoVaga = demandaReal.length;
    const aguardandoConclusao = pacientesJaRegulados.length;
    const totalPendencias = aguardandoVaga + aguardandoConclusao;

    // --- Card 2: Pontos de Atenção Crítica ---
    const solicitacoesCriticas = pacientesAguardandoUTI.length + pacientesAguardandoTransferencia.length;
    let tempoMaximoUTI = '0m';
    if (pacientesAguardandoUTI.length > 0) {
        const datasPedidos = pacientesAguardandoUTI.map(p => safeParseDate(p.dataPedidoUTI)).filter(Boolean) as Date[];
        if (datasPedidos.length > 0) {
            const dataMaisAntiga = new Date(Math.min(...datasPedidos.map(d => d.getTime())));
            tempoMaximoUTI = formatarDuracao(dataMaisAntiga.toISOString());
        }
    }

    // --- Card 3: Maiores Tempos de Espera (NOVO) ---
    const calcularMaiorTempo = (listaPacientes: any[], dataField: string): string => {
        if (!listaPacientes || listaPacientes.length === 0) return '0m';
        const datas = listaPacientes.map(p => safeParseDate(p[dataField])).filter(Boolean) as Date[];
        if (datas.length === 0) return '0m';
        const dataMaisAntiga = new Date(Math.min(...datas.map(d => d.getTime())));
        return formatarDuracao(dataMaisAntiga.toISOString());
    };

    const maiorTempoRegulacao = calcularMaiorTempo([...decisaoClinica, ...decisaoCirurgica], 'dataInternacao');
    const maiorTempoConclusao = calcularMaiorTempo(pacientesJaRegulados, 'dataAtualizacaoStatus');
    const maiorTempoTransferencia = calcularMaiorTempo(pacientesAguardandoTransferencia, 'dataTransferencia');

    // --- Card 4: Demanda vs. Disponibilidade Real ---
    const leitosVagos = leitos.filter(leito => ['Vago', 'Higienizacao'].includes(leito.historicoMovimentacao.slice(-1)[0]?.statusLeito));
    
    const verificarCompatibilidade = (paciente: any, leito: Leito): boolean => {
      // Implementar lógica de compatibilidade complexa aqui
      return true;
    };
    
    const pacientesSemLeitoCompativel = demandaReal.filter(paciente => {
      return !leitosVagos.some(leito => verificarCompatibilidade(paciente, leito));
    });

    return {
      cargaTrabalho: { total: totalPendencias, aguardandoVaga, aguardandoConclusao },
      pontosAtencao: { solicitacoesCriticas, tempoMaximoUTI, totalUTI: pacientesAguardandoUTI.length, totalTransf: pacientesAguardandoTransferencia.length },
      maioresTempos: { regulacao: maiorTempoRegulacao, conclusao: maiorTempoConclusao, transferencia: maiorTempoTransferencia },
      capacidadeReal: { demanda: demandaReal.length, oferta: leitosVagos.length, gargalo: pacientesSemLeitoCompativel.length, pacientesSemVaga: pacientesSemLeitoCompativel, leitosDisponiveisData: leitosVagos, pacientesComVaga: demandaReal.filter(p => !pacientesSemLeitoCompativel.some(ps => ps.id === p.id)) }
    };
  }, [pacientesAguardandoRegulacao, pacientesJaRegulados, pacientesAguardandoRemanejamento, pacientesAguardandoUTI, pacientesAguardandoTransferencia, decisaoClinica, decisaoCirurgica, recuperacaoCirurgica, leitos]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Carga de Trabalho Atual */}
        <Card className="shadow-card border border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Activity className="h-4 w-4" />Carga de Trabalho</CardTitle></CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-medical-primary">{indicadores.cargaTrabalho.total}</div>
                <p className="text-xs text-muted-foreground mb-2">Total de Pendências</p>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span>Aguardando Vaga:</span><Badge variant="secondary">{indicadores.cargaTrabalho.aguardandoVaga}</Badge></div>
                    <div className="flex justify-between"><span>Aguardando Conclusão:</span><Badge variant="outline">{indicadores.cargaTrabalho.aguardandoConclusao}</Badge></div>
                </div>
            </CardContent>
        </Card>

        {/* Card 2: Pontos de Atenção Crítica (CORRIGIDO) */}
        <Card className="shadow-card border border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-600"><AlertTriangle className="h-4 w-4" />Atenção Crítica</CardTitle></CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-amber-600">{indicadores.pontosAtencao.solicitacoesCriticas}</div>
                <p className="text-xs text-muted-foreground mb-2">Solicitações Críticas Totais</p>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span>Aguardando UTI:</span><Badge variant="destructive">{indicadores.pontosAtencao.totalUTI}</Badge></div>
                    <div className="flex justify-between"><span>Transf. Externa:</span><Badge variant="destructive" className="bg-amber-500">{indicadores.pontosAtencao.totalTransf}</Badge></div>
                    <div className="flex justify-between mt-1 pt-1 border-t"><span>Espera Máx. UTI:</span><span className="font-semibold">{indicadores.pontosAtencao.tempoMaximoUTI}</span></div>
                </div>
            </CardContent>
        </Card>

        {/* Card 3: Maiores Tempos de Espera (NOVO) */}
        <Card className="shadow-card border border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4" />Maiores Tempos de Espera</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span>Aguardando Vaga (PS/CC):</span><span className="font-semibold">{indicadores.maioresTempos.regulacao}</span></div>
                    <div className="flex justify-between"><span>Aguardando Conclusão:</span><span className="font-semibold">{indicadores.maioresTempos.conclusao}</span></div>
                    <div className="flex justify-between"><span>Aguardando Transferência:</span><span className="font-semibold">{indicadores.maioresTempos.transferencia}</span></div>
                </div>
            </CardContent>
        </Card>

        {/* Card 4: Capacidade Real */}
        <Card className="shadow-card border border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Stethoscope className="h-4 w-4" />Capacidade Real</CardTitle></CardHeader>
            <CardContent>
                <div className="text-lg font-bold">{indicadores.capacidadeReal.demanda} / {indicadores.capacidadeReal.oferta}</div>
                <p className="text-xs text-muted-foreground mb-1">Demanda Real / Leitos Vagos</p>
                {indicadores.capacidadeReal.gargalo > 0 ? (
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs text-destructive" onClick={() => setCompatibilidadeModalOpen(true)}>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {indicadores.capacidadeReal.gargalo} paciente(s) sem leito compatível
                  </Button>
                ) : (
                  <div className="text-xs text-green-600">✓ Todos têm leitos compatíveis</div>
                )}
            </CardContent>
        </Card>
      </div>

      <CompatibilidadeModal
        open={compatibilidadeModalOpen}
        onOpenChange={setCompatibilidadeModalOpen}
        pacientesSemLeitoCompativel={indicadores.capacidadeReal.pacientesSemVaga}
        pacientesComLeitoCompativel={indicadores.capacidadeReal.pacientesComVaga}
        leitosDisponiveis={indicadores.capacidadeReal.leitosDisponiveisData}
      />
    </>
  );
};