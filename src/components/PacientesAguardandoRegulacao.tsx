
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
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Decisão Cirúrgica */}
          {listas.decisaoCirurgica.length > 0 && (
            <ListaPacientesPendentes
              titulo="PS - DECISÃO CIRÚRGICA"
              pacientes={listas.decisaoCirurgica}
              onRegularClick={handlers.handleOpenRegulacaoModal}
              onAlta={handlers.altaAposRecuperacao}
              onConcluir={handlers.handleConcluir}
              onAlterar={handlers.handleAlterar}
              onCancelar={handlers.handleCancelar}
            />
          )}

          {/* Lista de Decisão Clínica */}
          {listas.decisaoClinica.length > 0 && (
            <ListaPacientesPendentes
              titulo="PS - DECISÃO CLÍNICA"
              pacientes={listas.decisaoClinica}
              onRegularClick={handlers.handleOpenRegulacaoModal}
              onAlta={handlers.altaAposRecuperacao}
              onConcluir={handlers.handleConcluir}
              onAlterar={handlers.handleAlterar}
              onCancelar={handlers.handleCancelar}
            />
          )}

          {/* Lista de Recuperação Cirúrgica */}
          {listas.recuperacaoCirurgica.length > 0 && (
            <ListaPacientesPendentes
              titulo="CC - RECUPERAÇÃO"
              pacientes={listas.recuperacaoCirurgica}
              onRegularClick={handlers.handleOpenRegulacaoModal}
              onAlta={handlers.altaAposRecuperacao}
              onConcluir={handlers.handleConcluir}
              onAlterar={handlers.handleAlterar}
              onCancelar={handlers.handleCancelar}
            />
          )}
        </div>

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
