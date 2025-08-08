import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BedDouble, User2, Users, PercentCircle, Clock } from "lucide-react";

interface IndicadoresGeraisProps {
  contagem: any;
  taxa: number;
  tempos: any;
  nivelPCP: any;
  setoresEnriquecidos?: Array<{
    id: string;
    nomeSetor: string;
    leitos: Array<{
      statusLeito: string;
      leitoIsolamento: boolean;
    }>;
  }>;
}

export function IndicadoresGerais({ 
  contagem, 
  taxa, 
  tempos, 
  nivelPCP, 
  setoresEnriquecidos = [] 
}: IndicadoresGeraisProps) {
  // Setores específicos para contagem de leitos vagos
  const setoresContagem = [
    "UNID. CIRURGICA", "UNID. CLINICA MEDICA", "UNID. INT. GERAL - UIG",
    "UNID. JS ORTOPEDIA", "UNID. NEFROLOGIA TRANSPLANTE", "UNID. ONCOLOGIA", "UTI"
  ];

  // Calcular leitos vagos considerando apenas setores específicos
  const leitosVagosFiltrados = setoresEnriquecidos
    .filter(setor => setoresContagem.includes(setor.nomeSetor))
    .flatMap(setor => setor.leitos.filter(leito => leito.statusLeito === 'Vago'));

  const totalVagos = leitosVagosFiltrados.length;
  const vagosSemIsolamento = leitosVagosFiltrados.filter(leito => !leito.leitoIsolamento).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card de Leitos Vagos Atualizado */}
      <Card className="shadow-card border border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-medical-primary">Vagos</CardTitle>
          <BedDouble className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-medical-primary">{totalVagos}</div>
          <p className="text-xs text-muted-foreground">
            {vagosSemIsolamento} vagos (sem isolamento por coorte)
          </p>
        </CardContent>
      </Card>

      {/* Card de Taxa de Ocupação */}
      <Card className="shadow-card border border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-medical-primary">Ocupação</CardTitle>
          <PercentCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-medical-primary">{taxa}%</div>
          <p className="text-xs text-muted-foreground">Taxa de ocupação geral</p>
        </CardContent>
      </Card>

      {/* Card de Tempo Médio de Internação */}
      <Card className="shadow-card border border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-medical-primary">Tempo Médio</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-medical-primary">{tempos?.internacao}</div>
          <p className="text-xs text-muted-foreground">Tempo médio de internação</p>
        </CardContent>
      </Card>

      {/* Card de Nível de Pacientes Críticos (PCP) */}
       <Card className="shadow-card border border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-medical-primary">Nível PCP</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-medical-primary">{nivelPCP?.totalPacientesPCP}</div>
          <p className="text-xs text-muted-foreground">Total de pacientes nível PCP</p>
        </CardContent>
      </Card>
    </div>
  );
}
