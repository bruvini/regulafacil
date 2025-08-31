import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, User, Pencil, ChevronDown } from 'lucide-react';
import { useIsolamentos } from '@/hooks/useIsolamentos';
import { useAuditoria } from '@/hooks/useAuditoria';
import { GerenciadorDeRegras } from './GerenciadorDeRegras';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { Paciente } from '@/types/hospital';
import { PacienteIsolamento } from '@/types/isolamento';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { formatarDataSemFuso } from '@/lib/utils';

interface PacienteVigilanciaCardProps {
  paciente: Paciente;
  setorId: string;
  leitoId: string;
  onEditIsolamento?: (paciente: Paciente, isolamento: PacienteIsolamento) => void;
}

export const PacienteVigilanciaCard = ({ paciente, setorId, leitoId, onEditIsolamento }: PacienteVigilanciaCardProps) => {
  const { isolamentos: tiposDeIsolamento } = useIsolamentos();
  const { registrarLog } = useAuditoria();
  const [isOpen, setIsOpen] = useState(false);

  const calcularIdade = (dataNascimento: string): string => {
    if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return '?';
    const [dia, mes, ano] = dataNascimento.split('/').map(Number);
    const hoje = new Date();
    const nascimento = new Date(ano, mes - 1, dia);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade.toString();
  };

  const handleFinalizarIsolamento = async (isolamentoVigente: PacienteIsolamento) => {
    try {
      const tipoIsolamento = tiposDeIsolamento.find(t => t.id === isolamentoVigente.isolamentoId);

      // Atualizar o documento do paciente removendo o isolamento específico
      const pacienteRef = doc(db, 'pacientesRegulaFacil', paciente.id);
      await updateDoc(pacienteRef, {
        isolamentosVigentes: arrayRemove(isolamentoVigente)
      });

      // Registrar log de auditoria
      await registrarLog(
        'Isolamento finalizado',
        `Isolamento ${tipoIsolamento?.nomeMicroorganismo || 'desconhecido'} finalizado para o paciente ${paciente.nomeCompleto}`
      );

      toast({
        title: "Isolamento finalizado",
        description: `O isolamento ${tipoIsolamento?.sigla || 'desconhecido'} foi finalizado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao finalizar isolamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o isolamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <Card className="w-full">
        <CollapsibleTrigger asChild>
          <CardHeader className="flex flex-row items-center justify-between p-4 cursor-pointer">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-medical-danger" />
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {paciente.nomeCompleto}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {paciente.leitoCodigo} • {paciente.especialidadePaciente} • {calcularIdade(paciente.dataNascimento)} anos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {paciente.isolamentosVigentes?.length || 0} isolamento{(paciente.isolamentosVigentes?.length || 0) !== 1 ? 's' : ''}
              </Badge>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen && 'rotate-180'}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-4">
              {paciente.isolamentosVigentes?.map((isolamentoVigente: PacienteIsolamento) => {
                const tipoIsolamento = tiposDeIsolamento.find(t => t.id === isolamentoVigente.isolamentoId);
                if (!tipoIsolamento) return null;

                return (
                  <Card key={isolamentoVigente.isolamentoId} className="bg-background">
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tipoIsolamento.cor }} />
                          <div>
                            <p className="font-semibold">{tipoIsolamento.nomeMicroorganismo}</p>
                            <p className="text-xs text-muted-foreground">
                              Início: {formatarDataSemFuso(isolamentoVigente.dataInicio)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditIsolamento?.(paciente, isolamentoVigente)}
                            className="text-muted-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Badge style={{ backgroundColor: tipoIsolamento.cor, color: 'white' }}>
                            {tipoIsolamento.sigla}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <GerenciadorDeRegras
                        isolamentoVigente={isolamentoVigente}
                        tipoIsolamento={tipoIsolamento}
                        setorId={setorId}
                        leitoId={leitoId}
                        onFinalizarIsolamento={() => handleFinalizarIsolamento(isolamentoVigente)}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

