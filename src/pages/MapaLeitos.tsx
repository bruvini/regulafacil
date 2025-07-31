import { useState, useEffect, useMemo } from 'react';
import { useSetores } from '@/hooks/useSetores';
import { useLeitos } from '@/hooks/useLeitos';
import { Button } from '@/components/ui/button';
import { Plus, Lock, Sparkles, UserPlus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import SetorCard from '@/components/SetorCard';
import { Leito, Setor } from '@/types/hospital';
import { useRegulacaoLogic } from '@/hooks/useRegulacaoLogic';
import { Skeleton } from '@/components/ui/skeleton';
import AdicionarPacienteModal from '@/components/modals/AdicionarPacienteModal';

export interface LeitoEnriquecido extends Leito {
  setorNome: string;
  statusLeito: string;
  sexoCompativel?: 'Masculino' | 'Feminino' | 'Ambos';
}

const MapaLeitos = () => {
  const { setores, loading: setoresLoading } = useSetores();
  const { leitos, loading: leitosLoading, atualizarStatusLeito } = useLeitos();

  // Novos estados para adicionar paciente
  const [adicionarPacienteModalOpen, setAdicionarPacienteModalOpen] = useState(false);
  const [leitoParaAdicionarPaciente, setLeitoParaAdicionarPaciente] = useState<LeitoEnriquecido | null>(null);

  const {
    handlers: {
      handleAbrirAdicionarPacienteModal,
      handleConfirmarAdicaoPaciente,
      setAdicionarPacienteModalOpen,
    },
    modals: {
      leitoParaAdicionarPaciente,
    },
  } = useRegulacaoLogic();

  useEffect(() => {
    document.title = 'Mapa de Leitos | Regula Fácil';
  }, []);

  const setoresComLeitos = useMemo(() => {
    if (setoresLoading || leitosLoading) {
      return [];
    }

    return setores.map((setor) => ({
      ...setor,
      leitos: leitos.filter((leito) => leito.setorId === setor.id),
    }));
  }, [setores, leitos, setoresLoading, leitosLoading]);

  const handleBloquear = async (setorId: string, leitoId: string) => {
    await atualizarStatusLeito(leitoId, 'Bloqueado', {
      motivoBloqueio: 'Manutenção',
    });
  };

  const handleLimpeza = async (setorId: string, leitoId: string) => {
    await atualizarStatusLeito(leitoId, 'Higienizacao');
  };

  const actions = {
    onBloquear: handleBloquear,
    onLimpeza: handleLimpeza,
    onAdicionarPaciente: handleAbrirAdicionarPacienteModal,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Leitos</CardTitle>
          <CardDescription>
            Visualize e gerencie os leitos disponíveis.
          </CardDescription>
        </CardHeader>
      </Card>

      {setoresLoading || leitosLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-40" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-24" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {setoresComLeitos.map((setor) => (
            <SetorCard key={setor.id} setor={setor as any} actions={actions} />
          ))}
        </div>
      )}
      
      {/* Novo Modal para Adicionar Paciente */}
      <AdicionarPacienteModal
        open={adicionarPacienteModalOpen || false}
        onClose={() => setAdicionarPacienteModalOpen(false)}
        onConfirm={handleConfirmarAdicaoPaciente}
        leitoInfo={leitoParaAdicionarPaciente ? {
          codigoLeito: leitoParaAdicionarPaciente.codigoLeito,
          setorNome: setores.find(s => s.id === leitoParaAdicionarPaciente.setorId)?.nomeSetor || 'Setor não encontrado'
        } : null}
      />
    </div>
  );
};

export default MapaLeitos;
