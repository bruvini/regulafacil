
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListaPacientesPendentes } from "@/components/ListaPacientesPendentes";
import { PacienteReguladoItem } from "@/components/PacienteReguladoItem";
import { useFiltrosRegulacao } from "@/hooks/useFiltrosRegulacao";

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
  filtrosProps: {
    filteredPacientes: any[];
    sortConfig: { key: string; direction: string };
  };
}

export const PacientesAguardandoRegulacao = ({ listas, handlers, filtrosProps }: PacientesAguardandoRegulacaoProps) => {
  // Aplicar ordenação aos sub-blocos
  const { filteredPacientes: pacientesOrdenados } = useFiltrosRegulacao([
    ...listas.decisaoCirurgica,
    ...listas.decisaoClinica,
    ...listas.recuperacaoCirurgica
  ]);

  // Separar pacientes ordenados por categoria
  const decisaoCirurgicaOrdenada = pacientesOrdenados.filter(p => 
    listas.decisaoCirurgica.some(dc => dc.id === p.id)
  );
  const decisaoClinicaOrdenada = pacientesOrdenados.filter(p => 
    listas.decisaoClinica.some(dc => dc.id === p.id)
  );
  const recuperacaoCirurgicaOrdenada = pacientesOrdenados.filter(p => 
    listas.recuperacaoCirurgica.some(rc => rc.id === p.id)
  );

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
            pacientes={decisaoCirurgicaOrdenada}
            onRegularClick={handlers.handleOpenRegulacaoModal}
            onAlta={(leitoId) => handlers.altaAposRecuperacao(leitoId)}
            onConcluir={handlers.handleConcluir}
            onAlterar={handlers.handleAlterar}
            onCancelar={handlers.handleCancelar}
          />
          <ListaPacientesPendentes
            titulo="Decisão Clínica"
            pacientes={decisaoClinicaOrdenada}
            onRegularClick={handlers.handleOpenRegulacaoModal}
            onAlta={(leitoId) => handlers.altaAposRecuperacao(leitoId)}
            onConcluir={handlers.handleConcluir}
            onAlterar={handlers.handleAlterar}
            onCancelar={handlers.handleCancelar}
          />
          <ListaPacientesPendentes
            titulo="Recuperação Cirúrgica"
            pacientes={recuperacaoCirurgicaOrdenada}
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
