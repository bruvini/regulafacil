
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListaPacientesPendentes } from "@/components/ListaPacientesPendentes";
import { PacienteReguladoItem } from "@/components/PacienteReguladoItem";
import { parse, differenceInHours, isValid } from 'date-fns';

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
  // Aplicar ordenação específica aos sub-blocos usando os pacientes já filtrados
  const aplicarOrdenacao = (pacientes: any[]) => {
    return [...pacientes].sort((a, b) => {
      let comparison = 0;
      
      if (filtrosProps.sortConfig?.key === 'nome') {
        comparison = (a?.nomeCompleto || '').localeCompare(b?.nomeCompleto || '');
      } else if (filtrosProps.sortConfig?.key === 'idade') {
        const calcularIdade = (dataNascimento: string): number => {
          if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return 999;
          const [dia, mes, ano] = dataNascimento.split('/').map(Number);
          const hoje = new Date();
          const nascimento = new Date(ano, mes - 1, dia);
          let idade = hoje.getFullYear() - nascimento.getFullYear();
          const m = hoje.getMonth() - nascimento.getMonth();
          if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
          return idade;
        };
        const idadeA = a?.dataNascimento ? calcularIdade(a.dataNascimento) : 0;
        const idadeB = b?.dataNascimento ? calcularIdade(b.dataNascimento) : 0;
        comparison = idadeA - idadeB;
      } else if (filtrosProps.sortConfig?.key === 'tempo') {
        const dataA = a?.dataInternacao ? parse(a.dataInternacao, 'dd/MM/yyyy HH:mm', new Date()) : new Date(0);
        const dataB = b?.dataInternacao ? parse(b.dataInternacao, 'dd/MM/yyyy HH:mm', new Date()) : new Date(0);
        if (isValid(dataA) && isValid(dataB)) {
          const tempoA = differenceInHours(new Date(), dataA);
          const tempoB = differenceInHours(new Date(), dataB);
          comparison = tempoA - tempoB;
        }
      }

      return filtrosProps.sortConfig?.direction === 'desc' ? -comparison : comparison;
    });
  };

  // Aplicar ordenação a cada sub-bloco
  const decisaoCirurgicaOrdenada = aplicarOrdenacao(listas.decisaoCirurgica);
  const decisaoClinicaOrdenada = aplicarOrdenacao(listas.decisaoClinica);
  const recuperacaoCirurgicaOrdenada = aplicarOrdenacao(listas.recuperacaoCirurgica);

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
