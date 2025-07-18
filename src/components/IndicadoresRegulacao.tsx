import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Users, Activity } from 'lucide-react';
import { intervalToDuration, parse, isValid } from 'date-fns';
import { Paciente, Leito } from '@/types/hospital';

interface Props {
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
}: Props) => {

  // Função para calcular duração em horas
  const calcularHoras = (dataISOouString: string | undefined | null): number => {
    if (!dataISOouString) return 0;
    
    let dataEntrada: Date;
    
    // Corrigindo a verificação de tipo
    if (typeof dataISOouString === 'string') {
      const dataPotencial = new Date(dataISOouString);
      if (isValid(dataPotencial)) {
        dataEntrada = dataPotencial;
      } else {
        const dataParseada = parse(dataISOouString, 'dd/MM/yyyy HH:mm', new Date());
        if (isValid(dataParseada)) {
          dataEntrada = dataParseada;
        } else {
          return 0;
        }
      }
    } else {
      return 0;
    }

    const agora = new Date();
    const diffMs = agora.getTime() - dataEntrada.getTime();
    return diffMs / (1000 * 60 * 60); // Converter para horas
  };

  // Função para formatar horas em texto legível
  const formatarTempo = (horas: number): string => {
    if (horas < 1) return `${Math.round(horas * 60)}m`;
    const h = Math.floor(horas);
    const m = Math.round((horas - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Função para verificar compatibilidade leito-paciente
  const verificarCompatibilidade = (paciente: any, leito: Leito): boolean => {
    // Leito deve estar vago ou em higienização
    const ultimoHistorico = leito.historicoMovimentacao[leito.historicoMovimentacao.length - 1];
    if (!ultimoHistorico || !['Vago', 'Higienizacao'].includes(ultimoHistorico.statusLeito)) {
      return false;
    }

    // Verificar compatibilidade de isolamento
    const pacientePrecisaIsolamento = paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0;
    if (pacientePrecisaIsolamento && !leito.leitoIsolamento) {
      return false;
    }

    // Verificar compatibilidade de sexo (implementação básica)
    // Aqui você pode expandir com lógica mais complexa de quartos compartilhados
    
    return true;
  };

  const indicadores = useMemo(() => {
    // --- LÓGICA CORRIGIDA PARA DEMANDA REAL ---
    const setoresDeEntrada = ["CC - RECUPERAÇÃO", "PS DECISÃO CIRURGICA", "PS DECISÃO CLINICA"];
    
    // 1. Pacientes nos setores de entrada
    const pacientesNosSetoresDeEntrada = pacientesAguardandoRegulacao.filter(p =>
      setoresDeEntrada.includes(p.setorOrigem)
    );
    const idsPacientesJaContados = new Set(pacientesNosSetoresDeEntrada.map(p => p.id));

    // 2. Pacientes aguardando UTI que NÃO estão nos setores de entrada
    const pacientesUTIForaDosSetores = pacientesAguardandoUTI.filter(p => 
      !idsPacientesJaContados.has(p.id)
    );

    // 3. Pacientes aguardando remanejamento que NÃO estão nos setores de entrada
    const pacientesRemanejamentoForaDosSetores = pacientesAguardandoRemanejamento.filter(p => 
      !idsPacientesJaContados.has(p.id)
    );
    
    // O total de "Aguardando Vaga" e a "Demanda" real são a soma desses três grupos
    const aguardandoVaga = pacientesNosSetoresDeEntrada.length + 
                         pacientesUTIForaDosSetores.length + 
                         pacientesRemanejamentoForaDosSetores.length;
    
    const todosPacientesNaFila = [
      ...pacientesNosSetoresDeEntrada,
      ...pacientesUTIForaDosSetores,
      ...pacientesRemanejamentoForaDosSetores
    ];

    // Card 1: Carga de Trabalho Atual (com a nova lógica)
    const aguardandoConclusao = pacientesJaRegulados.length;
    const totalPendencias = aguardandoVaga + aguardandoConclusao;

    // Card 2: Pontos de Atenção Crítica
    const solicitacoesCriticas = pacientesAguardandoUTI.length + pacientesAguardandoTransferencia.length;
    
    const tempoMaximoUTI = pacientesAguardandoUTI.length > 0 
      ? Math.max(...pacientesAguardandoUTI.map(p => calcularHoras(p.dataPedidoUTI)))
      : 0;

    // Card 3: Tempos Médios de Espera
    const todosAguardandoRegulacao = [
      ...decisaoClinica.map(p => ({ ...p, dataReferencia: p.dataInternacao })),
      ...decisaoCirurgica.map(p => ({ ...p, dataReferencia: p.dataInternacao })),
      ...recuperacaoCirurgica.map(p => ({ ...p, dataReferencia: p.dataInternacao })),
      ...pacientesAguardandoRemanejamento.map(p => ({ ...p, dataReferencia: p.dataPedidoRemanejamento }))
    ];

    const tempoMedioRegulacao = todosAguardandoRegulacao.length > 0
      ? todosAguardandoRegulacao.reduce((acc, p) => acc + calcularHoras(p.dataReferencia), 0) / todosAguardandoRegulacao.length
      : 0;

    const tempoMedioConclusao = pacientesJaRegulados.length > 0
      ? pacientesJaRegulados.reduce((acc, p) => {
          // Encontrar a data de regulação no histórico
          const leito = leitos.find(l => l.id === p.leitoId);
          const historicoRegulacao = leito?.historicoMovimentacao.find(h => h.statusLeito === 'Regulado');
          return acc + calcularHoras(historicoRegulacao?.dataAtualizacaoStatus);
        }, 0) / pacientesJaRegulados.length
      : 0;

    const tempoMedioTransferencia = pacientesAguardandoTransferencia.length > 0
      ? pacientesAguardandoTransferencia.reduce((acc, p) => acc + calcularHoras(p.dataTransferencia), 0) / pacientesAguardandoTransferencia.length
      : 0;

    // Card 4: Demanda vs. Disponibilidade Real (usando a nova lógica)
    const leitosVagos = leitos.filter(leito => {
      const ultimoHistorico = leito.historicoMovimentacao[leito.historicoMovimentacao.length - 1];
      return ultimoHistorico && ['Vago', 'Higienizacao'].includes(ultimoHistorico.statusLeito);
    });

    const pacientesSemLeitoCompativel = todosPacientesNaFila.filter(paciente => {
      return !leitosVagos.some(leito => verificarCompatibilidade(paciente, leito));
    }).length;

    return {
      cargaTrabalho: {
        total: totalPendencias,
        aguardandoVaga, // <-- Valor corrigido
        aguardandoConclusao
      },
      pontosAtencao: {
        // ...
      },
      temposMedias: {
        // ...
      },
      demandaDisponibilidade: {
        demanda: todosPacientesNaFila.length, // <-- Valor corrigido
        oferta: leitosVagos.length,
        gargalo: pacientesSemLeitoCompativel
      }
    };
  }, [
    pacientesAguardandoRegulacao,
    pacientesJaRegulados,
    pacientesAguardandoRemanejamento,
    pacientesAguardandoUTI,
    pacientesAguardandoTransferencia,
    decisaoClinica,
    decisaoCirurgica,
    recuperacaoCirurgica,
    leitos
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Carga de Trabalho Atual */}
      <Card className="shadow-card border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-medical-primary flex items-center gap-2">
            <Users className="h-5 w-5" />
            Carga de Trabalho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-medical-primary mb-2">
            {indicadores.cargaTrabalho.total}
          </div>
          <p className="text-sm text-muted-foreground mb-3">Total de Pendências</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Aguardando Vaga:</span>
              <Badge variant="secondary">{indicadores.cargaTrabalho.aguardandoVaga}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Aguardando Conclusão:</span>
              <Badge variant="outline">{indicadores.cargaTrabalho.aguardandoConclusao}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Pontos de Atenção Crítica */}
      <Card className="shadow-card border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Atenção Crítica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-destructive mb-2">
            {indicadores.pontosAtencao.solicitacoesCriticas}
          </div>
          <p className="text-sm text-muted-foreground mb-3">Solicitações Críticas</p>
          <div className="text-sm">
            <div className="flex justify-between items-center">
              <span>Espera Máx. UTI:</span>
              <Badge variant="destructive">{indicadores.pontosAtencao.tempoMaximoUTI}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Tempos Médios de Espera */}
      <Card className="shadow-card border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tempos Médios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Aguardando Regulação:</span>
              <Badge variant="outline">{indicadores.temposMedias.regulacao}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Aguardando Conclusão:</span>
              <Badge variant="outline">{indicadores.temposMedias.conclusao}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Aguardando Transferência:</span>
              <Badge variant="outline">{indicadores.temposMedias.transferencia}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Demanda vs. Disponibilidade Real */}
      <Card className="shadow-card border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-medical-secondary flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Capacidade Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-medical-secondary mb-2">
            {indicadores.demandaDisponibilidade.demanda} / {indicadores.demandaDisponibilidade.oferta}
          </div>
          <p className="text-sm text-muted-foreground mb-3">Demanda / Leitos Vagos</p>
          <div className="text-sm">
            {indicadores.demandaDisponibilidade.gargalo > 0 ? (
              <div className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>{indicadores.demandaDisponibilidade.gargalo} sem leito compatível</span>
              </div>
            ) : (
              <div className="text-green-600">
                ✓ Todos os pacientes têm leitos compatíveis
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
