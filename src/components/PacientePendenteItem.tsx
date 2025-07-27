
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PacientePendenteItemProps {
  paciente: any;
  onRegularClick: () => void;
  onConcluir?: () => void;
  onAlterar?: () => void;
  onCancelar?: () => void;
  onAlta?: () => void;
  showAltaButton?: boolean;
}

export const PacientePendenteItem = ({
  paciente,
  onRegularClick,
  onConcluir,
  onAlterar,
  onCancelar,
  onAlta,
  showAltaButton = false,
}: PacientePendenteItemProps) => {
  const calcularIdade = (dataNascimento: string): number => {
    if (!dataNascimento) return 0;
    const [dia, mes, ano] = dataNascimento.split('/').map(Number);
    const hoje = new Date();
    const nascimento = new Date(ano, mes - 1, dia);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const calcularTempoInternacao = (dataInternacao: string): string => {
    if (!dataInternacao) return "N/A";
    try {
      const [dataParte, horaParte] = dataInternacao.split(' ');
      const [dia, mes, ano] = dataParte.split('/').map(Number);
      const [hora, minuto] = horaParte.split(':').map(Number);
      const dataEntrada = new Date(ano, mes - 1, dia, hora, minuto);
      return formatDistanceToNow(dataEntrada, { locale: ptBR });
    } catch {
      return "N/A";
    }
  };

  const idade = calcularIdade(paciente.dataNascimento);
  const tempoInternacao = calcularTempoInternacao(paciente.dataInternacao);

  return (
    <Card className="border-l-4 border-l-medical-primary">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-foreground">{paciente.nomeCompleto}</h4>
            <p className="text-sm text-muted-foreground">
              {paciente.leitoCodigo} • {paciente.siglaSetorOrigem}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={onRegularClick}>
              Regular
            </Button>
            {onConcluir && (
              <Button size="sm" variant="outline" onClick={onConcluir}>
                Concluir
              </Button>
            )}
            {onAlterar && (
              <Button size="sm" variant="outline" onClick={onAlterar}>
                Alterar
              </Button>
            )}
            {onCancelar && (
              <Button size="sm" variant="destructive" onClick={onCancelar}>
                Cancelar
              </Button>
            )}
            {showAltaButton && onAlta && (
              <Button size="sm" variant="outline" onClick={onAlta}>
                Informar Alta
              </Button>
            )}
          </div>
        </div>

        <Separator className="my-2" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>
            <span className="font-medium">Idade:</span>
            <p className="text-muted-foreground">{idade} anos</p>
          </div>
          <div>
            <span className="font-medium">Sexo:</span>
            <p className="text-muted-foreground">{paciente.sexoPaciente}</p>
          </div>
          <div>
            <span className="font-medium">Especialidade:</span>
            <p className="text-muted-foreground">{paciente.especialidadePaciente}</p>
          </div>
          <div>
            <span className="font-medium">Tempo:</span>
            <p className="text-muted-foreground">{tempoInternacao}</p>
          </div>
        </div>

        {paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {paciente.isolamentosVigentes.map((isolamento: string, index: number) => (
              <Badge key={index} variant="destructive" className="text-xs">
                {isolamento}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
