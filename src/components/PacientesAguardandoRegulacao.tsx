
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListaPacientesPendentes } from "@/components/ListaPacientesPendentes";
import { PacienteReguladoItem } from "@/components/PacienteReguladoItem";

interface PacientesAguardandoRegulacaoProps {
  listas: {
    decisaoCirurgica: any[];
    decisaoClinica: any[];
    recuperacaoCirurgica: any[];
    totalPendentes: number;
    pacientesJaRegulados: any[];
  };
  handlers: {
    handleOpenRegulacaoModal: (paciente: any, modo?: string) => void;
    handleConcluir: (paciente: any) => void;
    handleAlterar: (paciente: any) => void;
    handleCancelar: (paciente: any) => void;
    altaAposRecuperacao: (leitoId: string) => void;
    setResumoModalOpen: (open: boolean) => void;
  };
}

export const PacientesAguardandoRegulacao = ({ listas, handlers }: PacientesAguardandoRegulacaoProps) => {
  return (
    <Card className="shadow-card border border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-medical-primary flex items-center gap-2">
          Pacientes Aguardando Regulação
          <Badge>{listas.totalPendentes}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ListaPacientesPendentes
            titulo="Decisão Cirúrgica"
            pacientes={listas.decisaoCirurgica}
            onRegularClick={handlers.handleOpenRegulacaoModal}
            onConcluir={handlers.handleConcluir}
            onAlterar={handlers.handleAlterar}
            onCancelar={handlers.handleCancelar}
          />
          <ListaPacientesPendentes
            titulo="Decisão Clínica"
            pacientes={listas.decisaoClinica}
            onRegularClick={handlers.handleOpenRegulacaoModal}
            onConcluir={handlers.handleConcluir}
            onAlterar={handlers.handleAlterar}
            onCancelar={handlers.handleCancelar}
          />
          <ListaPacientesPendentes
            titulo="Recuperação Cirúrgica"
            pacientes={listas.recuperacaoCirurgica}
            onRegularClick={handlers.handleOpenRegulacaoModal}
            onAlta={(leitoId) => handlers.altaAposRecuperacao(leitoId)}
            onConcluir={handlers.handleConcluir}
            onAlterar={handlers.handleAlterar}
            onCancelar={handlers.handleCancelar}
          />
        </div>
      </CardContent>
    </Card>
  );
};
