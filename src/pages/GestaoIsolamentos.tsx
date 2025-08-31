import { useMemo, useState } from 'react';
import { Users, ShieldPlus, Terminal, Bell } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSetores } from '@/hooks/useSetores';
import { useLeitos } from '@/hooks/useLeitos';
import { usePacientes } from '@/hooks/usePacientes';
import { useAlertasIsolamento } from '@/hooks/useAlertasIsolamento';
import { AlertaIncompatibilidadeItem } from '@/components/AlertaIncompatibilidadeItem';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import GerenciamentoIsolamentoModal from '@/components/modals/GerenciamentoIsolamentoModal';
import { GerenciarPacientesIsolamentoModal } from '@/components/modals/GerenciarPacientesIsolamentoModal';
import { CardPacienteSuspeito } from '@/components/CardPacienteSuspeito';
import { CardPacienteConfirmado } from '@/components/CardPacienteConfirmado';
import { Paciente } from '@/types/hospital';
import { PacienteIsolamento } from '@/types/isolamento';
import FiltrosGestaoIsolamentos from '@/components/FiltrosGestaoIsolamentos';
import { differenceInDays } from 'date-fns';

const GestaoIsolamentos = () => {
  const [modalTiposOpen, setModalTiposOpen] = useState(false);
  const [modalPacientesOpen, setModalPacientesOpen] = useState(false);
  const [modalPacientesMode, setModalPacientesMode] = useState<'adicionar' | 'editar'>('adicionar');
  const [pacienteEdicao, setPacienteEdicao] = useState<Paciente | null>(null);
  const [isolamentoEdicao, setIsolamentoEdicao] = useState<PacienteIsolamento | null>(null);
  const [filtros, setFiltros] = useState({
    nome: '',
    setor: '',
    sexo: '',
    isolamentos: [] as string[],
    dias: '',
  });

  const { setores } = useSetores();
  const { leitos } = useLeitos();
  const { pacientes } = usePacientes();
  const { alertas, loading: alertasLoading } = useAlertasIsolamento();

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
      })
      .filter(paciente => {
        const matchNome = paciente.nomeCompleto.toLowerCase().includes(filtros.nome.toLowerCase());
        const matchSetor = !filtros.setor || paciente.setorId === filtros.setor;
        const matchSexo = !filtros.sexo || paciente.sexoPaciente === filtros.sexo;
        const matchIso = filtros.isolamentos.length === 0 || paciente.isolamentosVigentes?.some((iso: PacienteIsolamento) => filtros.isolamentos.includes(iso.isolamentoId));
        const diasFiltro = filtros.dias ? parseInt(filtros.dias) : null;
        const matchDias = !diasFiltro || paciente.isolamentosVigentes?.some((iso: PacienteIsolamento) => {
          const diff = differenceInDays(new Date(), new Date(iso.dataInicio));
          return diff >= diasFiltro;
        });
        return matchNome && matchSetor && matchSexo && matchIso && matchDias;
      });
  }, [pacientes, leitos, setores, filtros]);

  const pacientesSuspeitos = pacientesEmVigilancia.flatMap(paciente =>
    paciente.isolamentosVigentes
      ?.filter(iso => iso.status === 'suspeita')
      .map(isolamento => ({
        ...paciente,
        idUnico: `${paciente.id}-${isolamento.isolamentoId}`,
        isolamento: isolamento,
      })) || []
  );

  const pacientesConfirmados = pacientesEmVigilancia
    .filter(p => p.isolamentosVigentes?.some(iso => iso.status === 'confirmada'));

  const abrirModalAdicionar = () => {
    setModalPacientesMode('adicionar');
    setPacienteEdicao(null);
    setIsolamentoEdicao(null);
    setModalPacientesOpen(true);
  };

  const abrirModalEditar = (paciente: Paciente, isolamento: PacienteIsolamento) => {
    setModalPacientesMode('editar');
    setPacienteEdicao(paciente);
    setIsolamentoEdicao(isolamento);
    setModalPacientesOpen(true);
  };

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
                <Button variant="outline" size="icon" onClick={abrirModalAdicionar}>
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
      <FiltrosGestaoIsolamentos filtros={filtros} setFiltros={setFiltros} />

      <Card className="shadow-card border border-border/50 mb-6">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertas de Incompatibilidade Biológica
                <Badge variant="destructive">{alertas.length}</Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-4">
              {alertasLoading ? (
                <p>Analisando compatibilidade...</p>
              ) : alertas.length > 0 ? (
                <div className="space-y-2">
                  {alertas.map(alerta => (
                    <AlertaIncompatibilidadeItem key={alerta.pacienteId} alerta={alerta} />
                  ))}
                </div>
              ) : (
                <p>Nenhum risco detectado.</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:divide-x lg:divide-gray-200">
        <div className="lg:pr-6">
          <h2 className="text-lg font-semibold mb-3 text-amber-600">Pacientes em Investigação (Suspeitos)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pacientesSuspeitos.map(paciente => (
              <CardPacienteSuspeito key={paciente.idUnico} paciente={paciente} onEdit={(p) => abrirModalEditar(p, p.isolamento)} />
            ))}
          </div>
        </div>

        <div className="lg:pl-6">
          <h2 className="text-lg font-semibold mb-3 text-red-600">Pacientes com Isolamento Confirmado</h2>
          <div className="space-y-4">
            {pacientesConfirmados.map(paciente => (
              <CardPacienteConfirmado key={paciente.id} paciente={paciente} setorId={paciente.setorId} leitoId={paciente.leitoId} onEditIsolamento={abrirModalEditar} />
            ))}
          </div>
        </div>
      </div>

      <GerenciamentoIsolamentoModal open={modalTiposOpen} onOpenChange={setModalTiposOpen} />
      <GerenciarPacientesIsolamentoModal
        open={modalPacientesOpen}
        onOpenChange={(open) => {
          if (!open) {
            setModalPacientesMode('adicionar');
            setPacienteEdicao(null);
            setIsolamentoEdicao(null);
          }
          setModalPacientesOpen(open);
        }}
        mode={modalPacientesMode}
        paciente={pacienteEdicao || undefined}
        isolamento={isolamentoEdicao || undefined}
      />
    </div>
  );
};

export default GestaoIsolamentos;
