import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bed,
  Shield,
  Users,
  Lightbulb,
  Clock,
  Heart,
} from "lucide-react";
import { Leito, Paciente } from "@/types/hospital";
import { parse, differenceInHours, isValid } from "date-fns";
import { useMemo } from 'react';
import { determinarSexoLeito } from '@/lib/utils';

interface SugestaoRegulacao {
  leito: Leito & {
    setorNome?: string;
    statusLeito?: string;
    sexoCompativel?: "Masculino" | "Feminino" | "Ambos";
  };
  pacientesElegiveis: (Paciente & {
    setorOrigem?: string;
    siglaSetorOrigem?: string;
  })[];
}

interface SugestaoAgrupada {
  setorNome: string;
  sugestoes: SugestaoRegulacao[];
}

interface SugestoesRegulacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sugestoes?: SugestaoAgrupada[];
  totalPendentes?: number;
  leitoSelecionado?: Leito | null;
  pacientesPendentes?: Paciente[];
  todosOsLeitos?: any[];
}

const calcularIdade = (dataNascimento: string): string => {
  if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento))
    return "?";
  const [dia, mes, ano] = dataNascimento.split("/").map(Number);
  const hoje = new Date();
  const nascimento = new Date(ano, mes - 1, dia);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade.toString();
};

const calcularTempoInternacao = (dataInternacao: string): string => {
  if (!dataInternacao) return "N/A";

  const dataEntrada = parse(dataInternacao, "dd/MM/yyyy HH:mm", new Date());
  if (!isValid(dataEntrada)) return "N/A";

  const horas = differenceInHours(new Date(), dataEntrada);
  const dias = Math.floor(horas / 24);
  const horasRestantes = horas % 24;

  if (dias > 0) {
    return `${dias}d ${horasRestantes}h`;
  }
  return `${horasRestantes}h`;
};

const getSexoIcon = (sexo: "Masculino" | "Feminino" | "Ambos") => {
  switch (sexo) {
    case "Masculino":
      return "♂";
    case "Feminino":
      return "♀";
    case "Ambos":
      return "⚥";
    default:
      return "?";
  }
};

const getSexoColor = (sexo: "Masculino" | "Feminino" | "Ambos") => {
  switch (sexo) {
    case "Masculino":
      return "text-blue-600";
    case "Feminino":
      return "text-pink-600";
    case "Ambos":
      return "text-purple-600";
    default:
      return "text-muted-foreground";
  }
};

const getPrioridadeIcon = (paciente: any, index: number) => {
  const temIsolamento =
    paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0;

  if (temIsolamento) {
    return <Shield className="h-4 w-4 text-red-600" />;
  }

  if (index === 0) {
    return <Clock className="h-4 w-4 text-medical-primary" />;
  }

  return null;
};

const getPrioridadeLabel = (paciente: any, index: number) => {
  const temIsolamento =
    paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0;

  if (temIsolamento) {
    return "Isolamento";
  }

  if (index === 0) {
    return "Maior Tempo";
  }

  return null;
};

export const SugestoesRegulacaoModal = ({
  open,
  onOpenChange,
  sugestoes,
  totalPendentes,
  leitoSelecionado,
  pacientesPendentes,
  todosOsLeitos,
}: SugestoesRegulacaoModalProps) => {
  const sugestoesCalculadas = useMemo(() => {
    if (sugestoes && sugestoes.length > 0) return sugestoes;
    if (!leitoSelecionado || !pacientesPendentes || !todosOsLeitos) return [];

    const sexoCompativelComLeito = determinarSexoLeito(
      leitoSelecionado,
      todosOsLeitos
    );

    const pacientesCompativeis = pacientesPendentes.filter(paciente => {
      if (sexoCompativelComLeito === 'Ambos') return true;
      return paciente.sexoPaciente === sexoCompativelComLeito;
    });

    return [
      {
        setorNome: leitoSelecionado.setorNome || '',
        sugestoes: [
          {
            leito: {
              ...leitoSelecionado,
              sexoCompativel: sexoCompativelComLeito,
            },
            pacientesElegiveis: pacientesCompativeis,
          },
        ],
      },
    ];
  }, [sugestoes, leitoSelecionado, pacientesPendentes, todosOsLeitos]);

  const totalLeitos = sugestoesCalculadas.reduce(
    (acc, grupo) => acc + grupo.sugestoes.length,
    0
  );

  const totalPendentesValor =
    totalPendentes ?? pacientesPendentes?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-medical-primary" />
            Sugestões Inteligentes de Regulação
          </DialogTitle>
          <DialogDescription>
            Sistema de auxílio à decisão baseado em compatibilidade de leitos e
            pacientes com priorização otimizada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-medical-primary" />
              <span className="text-sm font-medium">
                {totalLeitos} leitos disponíveis
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-medical-secondary" />
              <span className="text-sm font-medium">
                {totalPendentesValor} pacientes aguardando regulação
              </span>
            </div>
          </div>

          {/* Legenda de Priorização */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">
              Ordem de Priorização:
            </h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-red-600" />
                <span>1º Isolamento</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-medical-primary" />
                <span>2º Maior Tempo</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-orange-600" />
                <span>3º Mais Idoso</span>
              </div>
            </div>
          </div>

          {sugestoesCalculadas.length > 0 ? (
            <div className="space-y-6">
              {sugestoesCalculadas.map((grupo, grupoIndex) => (
                <Card key={grupo.setorNome} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-medical-primary">
                      {grupo.setorNome}
                      <Badge variant="secondary" className="ml-2">
                        {grupo.sugestoes.length} leitos
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <div className="px-6 pb-6">
                    <Accordion type="multiple" className="w-full">
                      {grupo.sugestoes.map((sugestao, index) => (
                        <AccordionItem
                          key={sugestao.leito.id}
                          value={`${grupoIndex}-${index}`}
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Bed className="h-4 w-4 text-medical-primary" />
                                  <span className="font-semibold">
                                    {sugestao.leito.codigoLeito}
                                  </span>
                                  {/* Indicador de sexo compatível */}
                                  <span
                                    className={`text-lg font-bold ${getSexoColor(
                                      sugestao.leito.sexoCompativel || "Ambos"
                                    )}`}
                                  >
                                    {getSexoIcon(
                                      sugestao.leito.sexoCompativel || "Ambos"
                                    )}
                                  </span>
                                  <span
                                    className={`text-xs ${getSexoColor(
                                      sugestao.leito.sexoCompativel || "Ambos"
                                    )}`}
                                  >
                                    {sugestao.leito.sexoCompativel === "Ambos"
                                      ? "Livre"
                                      : sugestao.leito.sexoCompativel}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  {sugestao.leito.leitoPCP && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      PCP
                                    </Badge>
                                  )}
                                  {sugestao.leito.leitoIsolamento && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      <Shield className="h-3 w-3 mr-1" />
                                      Isolamento
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge variant="default">
                                {sugestao.pacientesElegiveis.length} pacientes
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4">
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-muted-foreground">
                                Pacientes Compatíveis (ordenados por
                                prioridade):
                              </h4>
                              <div className="space-y-2">
                                {sugestao.pacientesElegiveis.map(
                                  (paciente, idx) => {
                                    const prioridadeIcon = getPrioridadeIcon(
                                      paciente,
                                      idx
                                    );
                                    const prioridadeLabel = getPrioridadeLabel(
                                      paciente,
                                      idx
                                    );
                                    const tempoInternacao =
                                      calcularTempoInternacao(
                                        paciente.dataInternacao
                                      );

                                    return (
                                      <div
                                        key={paciente.id}
                                        className="flex items-center justify-between p-3 bg-card border rounded-lg"
                                      >
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">
                                              {paciente.nomeCompleto} - (
                                              {calcularIdade(
                                                paciente.dataNascimento
                                              )}{" "}
                                              anos)
                                            </span>
                                            {prioridadeIcon && (
                                              <div className="flex items-center gap-1">
                                                {prioridadeIcon}
                                                <Badge
                                                  variant="default"
                                                  className="text-xs bg-medical-success"
                                                >
                                                  {prioridadeLabel}
                                                </Badge>
                                              </div>
                                            )}
                                            {/* Isolamentos do paciente */}
                                            {paciente.isolamentosVigentes &&
                                              paciente.isolamentosVigentes
                                                .length > 0 && (
                                                <div className="flex gap-1">
                                                  {paciente.isolamentosVigentes.map(
                                                    (isolamento, isoIdx) => (
                                                      <Badge
                                                        key={isoIdx}
                                                        variant="destructive"
                                                        className="text-xs"
                                                      >
                                                        {isolamento.sigla}
                                                      </Badge>
                                                    )
                                                  )}
                                                </div>
                                              )}
                                          </div>
                                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>
                                              Origem:{" "}
                                              {paciente.siglaSetorOrigem ||
                                                "N/A"}
                                            </span>
                                            <span>
                                              Especialidade:{" "}
                                              {paciente.especialidadePaciente ||
                                                "N/A"}
                                            </span>
                                            <span>
                                              Sexo: {paciente.sexoPaciente}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              Internado há: {tempoInternacao}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-3">
                <Lightbulb className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Nenhuma sugestão disponível</h3>
                  <p className="text-sm text-muted-foreground">
                    Não há pacientes compatíveis com os leitos disponíveis no
                    momento.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
