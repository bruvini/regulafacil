
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListaPacientesPendentes } from "@/components/ListaPacientesPendentes";

interface PacientesAguardandoRegulacaoProps {
  listas: {
    decisaoCirurgica: any[];
    decisaoClinica: any[];
    recuperacaoCirurgica: any[];
    totalPendentes: number;
    pacientesJaRegulados: any[];
  };
  handlers: {
    handleOpenRegulacaoModal: (paciente: any, modo?: "normal" | "uti") => void;
    handleConcluir: (paciente: any) => void;
    handleAlterar: (paciente: any) => void;
    handleCancelar: (paciente: any) => void;
    altaAposRecuperacao: (leitoId: string) => void;
    setResumoModalOpen: (open: boolean) => void;
  };
  filtrosProps: {
    sortConfig: { key: string; direction: string };
  };
  actingOnPatientId?: string | null;
}

export const PacientesAguardandoRegulacao = ({ 
  listas, 
  handlers, 
  filtrosProps,
  actingOnPatientId
}: PacientesAguardandoRegulacaoProps) => {
  return (
    <Card className="shadow-card border border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-medical-primary flex items-center gap-2">
          Pacientes Aguardando Regulação
          <Badge variant="secondary">{listas.totalPendentes}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lista de Decisão Cirúrgica */}
        {listas.decisaoCirurgica.length > 0 && (
          <ListaPacientesPendentes
            titulo="PS - DECISÃO CIRÚRGICA"
            pacientes={listas.decisaoCirurgica}
            onRegular={handlers.handleOpenRegulacaoModal}
            onAltaRecuperacao={handlers.altaAposRecuperacao}
            sortConfig={filtrosProps.sortConfig}
            actingOnPatientId={actingOnPatientId}
          />
        )}

        {/* Lista de Decisão Clínica */}
        {listas.decisaoClinica.length > 0 && (
          <ListaPacientesPendentes
            titulo="PS - DECISÃO CLÍNICA"
            pacientes={listas.decisaoClinica}
            onRegular={handlers.handleOpenRegulacaoModal}
            onAltaRecuperacao={handlers.altaAposRecuperacao}
            sortConfig={filtrosProps.sortConfig}
            actingOnPatientId={actingOnPatientId}
          />
        )}

        {/* Lista de Recuperação Cirúrgica */}
        {listas.recuperacaoCirurgica.length > 0 && (
          <ListaPacientesPendentes
            titulo="CC - RECUPERAÇÃO"
            pacientes={listas.recuperacaoCirurgica}
            onRegular={handlers.handleOpenRegulacaoModal}
            onAltaRecuperacao={handlers.altaAposRecuperacao}
            sortConfig={filtrosProps.sortConfig}
            actingOnPatientId={actingOnPatientId}
          />
        )}

        {/* Caso não haja pacientes */}
        {listas.totalPendentes === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum paciente aguardando regulação no momento.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
