import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, ChevronDown, Pencil, XCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsolamentos } from "@/hooks/useIsolamentos";
import { Paciente } from '@/types/hospital';
import { PacienteIsolamento } from '@/types/isolamento';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { useAuditoria } from '@/hooks/useAuditoria';
import { useState } from 'react';
import { formatarDataSemFuso } from '@/lib/utils';

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
  const [isOpen, setIsOpen] = useState(false);

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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <Card className="border-l-4 border-amber-400">
        <CollapsibleTrigger asChild>
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
            <CardTitle className="text-base">{paciente.nomeCompleto}</CardTitle>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen && 'rotate-180'}`} />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <p><strong>Isolamento:</strong> {tipo ? tipo.nomeMicroorganismo : paciente.isolamento?.sigla}</p>
            <p><strong>Início:</strong> {formatarDataSemFuso(paciente.isolamento?.dataInicio)}</p>
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
            <TooltipProvider>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDescartar}>
                      <XCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Descartar Hipótese</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleConfirmar}>
                      <CheckCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Confirmar Isolamento</p></TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </CardFooter>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
