import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil } from "lucide-react";
import { useIsolamentos } from "@/hooks/useIsolamentos";
import { Paciente } from '@/types/hospital';
import { PacienteIsolamento } from '@/types/isolamento';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { useAuditoria } from '@/hooks/useAuditoria';

interface Props {
  paciente: Paciente & {
    isolamento: PacienteIsolamento;
  };
  onEdit?: (paciente: Paciente & { isolamento: PacienteIsolamento }) => void;
}

export const CardPacienteSuspeito = ({ paciente, onEdit }: Props) => {
  const { isolamentos } = useIsolamentos();
  const { registrarLog } = useAuditoria();
  const tipo = isolamentos.find(t => t.id === paciente.isolamento?.isolamentoId);

  const handleConfirmar = async () => {
    try {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', paciente.id);
      const novosIsolamentos = paciente.isolamentosVigentes!.map(iso =>
        iso.isolamentoId === paciente.isolamento.isolamentoId
          ? { ...iso, status: 'confirmada' }
          : iso
      );
      await updateDoc(pacienteRef, { isolamentosVigentes: novosIsolamentos });
      toast({ title: 'Isolamento confirmado', description: 'Status atualizado para confirmado.' });
      registrarLog(
        'Isolamento confirmado',
        `Isolamento ${paciente.isolamento.sigla} confirmado para o paciente ${paciente.nomeCompleto}`
      );
    } catch (error) {
      console.error('Erro ao confirmar isolamento:', error);
      toast({ title: 'Erro', description: 'Não foi possível confirmar o isolamento.', variant: 'destructive' });
    }
  };

  const handleDescartar = async () => {
    try {
      const pacienteRef = doc(db, 'pacientesRegulaFacil', paciente.id);
      const novosIsolamentos = paciente.isolamentosVigentes!.filter(
        iso => iso.isolamentoId !== paciente.isolamento.isolamentoId
      );
      await updateDoc(pacienteRef, { isolamentosVigentes: novosIsolamentos });
      toast({ title: 'Hipótese descartada', description: 'Isolamento removido do paciente.' });
      registrarLog(
        'Hipótese descartada',
        `Isolamento ${paciente.isolamento.sigla} descartado para o paciente ${paciente.nomeCompleto}`
      );
    } catch (error) {
      console.error('Erro ao descartar isolamento:', error);
      toast({ title: 'Erro', description: 'Não foi possível descartar a hipótese.', variant: 'destructive' });
    }
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
      <CardFooter className="flex justify-between items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit?.(paciente)}
          className="text-muted-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDescartar}>
            <X className="mr-2 h-4 w-4" /> Descartar Hipótese
          </Button>
          <Button size="sm" onClick={handleConfirmar} className="bg-green-600 hover:bg-green-700">
            <Check className="mr-2 h-4 w-4" /> Confirmar Isolamento
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
