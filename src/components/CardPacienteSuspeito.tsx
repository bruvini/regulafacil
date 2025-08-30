import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useIsolamentos } from "@/hooks/useIsolamentos";

interface Props {
  paciente: any;
}

export const CardPacienteSuspeito = ({ paciente }: Props) => {
  const { isolamentos } = useIsolamentos();
  const tipo = isolamentos.find(t => t.id === paciente.isolamento?.isolamentoId);

  const handleConfirmar = () => {
    // TODO: implementar confirmação do isolamento
  };

  const handleDescartar = () => {
    // TODO: implementar descarte da hipótese
  };

  return (
    <Card className="border-l-4 border-amber-400">
      <CardHeader>
        <CardTitle>{paciente.nomeCompleto}</CardTitle>
      </CardHeader>
      <CardContent>
        <p><strong>Isolamento:</strong> {tipo ? tipo.nomeMicroorganismo : paciente.isolamento?.sigla}</p>
        <p><strong>Início:</strong> {new Date(paciente.isolamento?.dataInicio).toLocaleDateString()}</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleDescartar}>
          <X className="mr-2 h-4 w-4" /> Descartar Hipótese
        </Button>
        <Button size="sm" onClick={handleConfirmar} className="bg-green-600 hover:bg-green-700">
          <Check className="mr-2 h-4 w-4" /> Confirmar Isolamento
        </Button>
      </CardFooter>
    </Card>
  );
};
