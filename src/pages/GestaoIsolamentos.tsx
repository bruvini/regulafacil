import { useMemo, useState } from 'react';
import { Users, ShieldPlus, Terminal } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSetores } from '@/hooks/useSetores';
import { useLeitos } from '@/hooks/useLeitos';
import { usePacientes } from '@/hooks/usePacientes';
import GerenciamentoIsolamentoModal from '@/components/modals/GerenciamentoIsolamentoModal';
import { GerenciarPacientesIsolamentoModal } from '@/components/modals/GerenciarPacientesIsolamentoModal';
import { CardPacienteSuspeito } from '@/components/CardPacienteSuspeito';
import { CardPacienteConfirmado } from '@/components/CardPacienteConfirmado';

const GestaoIsolamentos = () => {
  const [modalTiposOpen, setModalTiposOpen] = useState(false);
  const [modalPacientesOpen, setModalPacientesOpen] = useState(false);

  const { setores } = useSetores();
  const { leitos } = useLeitos();
  const { pacientes } = usePacientes();

  const pacientesEmVigilancia = useMemo(() => {
    const mapaLeitos = new Map(leitos.map(l => [l.id, l]));
    const mapaSetores = new Map(setores.map(s => [s.id, s]));

    return pacientes
      .filter(p => p.isolamentosVigentes && p.isolamentosVigentes.length > 0)
      .map(paciente => {
        const leito = mapaLeitos.get(paciente.leitoId);
        const setor = leito ? mapaSetores.get(leito.setorId) : undefined;
        return {
          ...paciente,
          leitoCodigo: leito?.codigoLeito || 'N/A',
          setorNome: setor?.nomeSetor || 'N/A',
          setorId: setor?.id || '',
          leitoId: leito?.id || '',
        };
      });
  }, [pacientes, leitos, setores]);

  const pacientesSuspeitos = pacientesEmVigilancia
    .filter(p => p.isolamentosVigentes?.some((iso: any) => iso.status === 'suspeita'))
    .map(p => ({ ...p, isolamento: p.isolamentosVigentes.find((iso: any) => iso.status === 'suspeita') }));

  const pacientesConfirmados = pacientesEmVigilancia
    .filter(p => p.isolamentosVigentes?.some((iso: any) => iso.status === 'confirmada'))
    .map(p => ({ ...p, isolamento: p.isolamentosVigentes.find((iso: any) => iso.status === 'confirmada') }));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Isolamentos</h1>
          <p className="text-sm text-gray-500">Monitore e gerencie pacientes em vigilância epidemiológica.</p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setModalTiposOpen(true)}>
                  <ShieldPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Gerenciar Tipos de Isolamento</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setModalPacientesOpen(true)}>
                  <Users className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Gerenciar Pacientes em Isolamento</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Em Breve!</AlertTitle>
        <AlertDescription>
          Novos indicadores de vigilância epidemiológica estão em desenvolvimento para aprimorar sua gestão.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3 text-amber-600">Pacientes em Investigação (Suspeitos)</h2>
          <div className="space-y-4">
            {pacientesSuspeitos.map(paciente => (
              <CardPacienteSuspeito key={paciente.id} paciente={paciente} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3 text-red-600">Pacientes com Isolamento Confirmado</h2>
          <div className="space-y-4">
            {pacientesConfirmados.map(paciente => (
              <CardPacienteConfirmado key={paciente.id} paciente={paciente} setorId={paciente.setorId} leitoId={paciente.leitoId} />
            ))}
          </div>
        </div>
      </div>

      <GerenciamentoIsolamentoModal open={modalTiposOpen} onOpenChange={setModalTiposOpen} />
      <GerenciarPacientesIsolamentoModal open={modalPacientesOpen} onOpenChange={setModalPacientesOpen} />
    </div>
  );
};

export default GestaoIsolamentos;
