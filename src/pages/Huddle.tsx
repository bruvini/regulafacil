
import { PacientesAguardandoUTI } from '@/components/huddle/PacientesAguardandoUTI';
import { PacientesEmFluxoDeAlta } from '@/components/huddle/PacientesEmFluxoDeAlta';
import { InternacaoProlongada } from '@/components/huddle/InternacaoProlongada';
import { PacientesComObservacoes } from '@/components/huddle/PacientesComObservacoes';
import { usePacientes } from '@/hooks/usePacientes';
import { useLeitos } from '@/hooks/useLeitos';
import { useSetores } from '@/hooks/useSetores';
import { useAuth } from '@/hooks/useAuth';
import { useAuditoria } from '@/hooks/useAuditoria';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';
import { Observacao } from '@/types/observacao';
import { useState } from 'react';
import { KanbanSquare } from 'lucide-react';
import KanbanModal from '@/components/modals/KanbanModal';

const Huddle = () => {
  const { pacientes, loading: pacientesLoading } = usePacientes();
  const { leitos, loading: leitosLoading } = useLeitos();
  const { setores, loading: setoresLoading } = useSetores();
  const { userData } = useAuth();
  const { registrarLog } = useAuditoria();

  const loading = pacientesLoading || leitosLoading || setoresLoading;

  const handleAdicionarObservacao = async (
    pacienteId: string, 
    textoObservacao: string, 
    tipo: 'obsAltaProvavel' | 'obsInternacaoProlongada'
  ) => {
    if (!userData) return;

    try {
      const novaObservacao: Observacao = {
        id: crypto.randomUUID(),
        texto: textoObservacao,
        timestamp: new Date().toISOString(),
        usuario: userData.nomeCompleto
      };

      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, {
        [tipo]: arrayUnion(novaObservacao)
      });

      const paciente = pacientes.find(p => p.id === pacienteId);
      if (paciente) {
        const tipoLabel = tipo === 'obsAltaProvavel' ? 'alta provável' : 'internação prolongada';
        registrarLog(`Adicionou observação de ${tipoLabel} para o paciente ${paciente.nomeCompleto}.`, 'Huddle');
      }

      toast({
        title: "Sucesso!",
        description: "Observação adicionada com sucesso."
      });
    } catch (error) {
      console.error("Erro ao adicionar observação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a observação.",
        variant: "destructive"
      });
    }
  };

  const handleRemoverObservacao = async (
    pacienteId: string, 
    observacaoId: string, 
    tipo: 'obsAltaProvavel' | 'obsInternacaoProlongada'
  ) => {
    if (!userData) return;

    try {
      const paciente = pacientes.find(p => p.id === pacienteId);
      if (!paciente) return;

      const observacoes = paciente[tipo] || [];
      const observacaoParaRemover = observacoes.find(obs => obs.id === observacaoId);
      
      if (!observacaoParaRemover) return;

      const pacienteRef = doc(db, 'pacientesRegulaFacil', pacienteId);
      await updateDoc(pacienteRef, {
        [tipo]: arrayRemove(observacaoParaRemover)
      });

      const tipoLabel = tipo === 'obsAltaProvavel' ? 'alta provável' : 'internação prolongada';
      registrarLog(`Excluiu observação de ${tipoLabel} do paciente ${paciente.nomeCompleto}.`, 'Huddle');

      toast({
        title: "Sucesso!",
        description: "Observação removida com sucesso."
      });
    } catch (error) {
      console.error("Erro ao remover observação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a observação.",
        variant: "destructive"
      });
    }
  };

  const [showKanbanModal, setShowKanbanModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-lg bg-medical-primary flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-medical-primary">
              Huddle - Panorama de Pacientes
            </h1>
            <p className="text-muted-foreground">
              Acompanhamento de pacientes com necessidades específicas
            </p>
          </div>
          <Button 
            onClick={() => setShowKanbanModal(true)}
            variant="medical"
            className="flex items-center gap-2"
          >
            <KanbanSquare className="h-5 w-5" />
            KANBAN NIR
          </Button>
        </div>

        <Accordion type="multiple" className="space-y-4">
          <PacientesAguardandoUTI pacientes={pacientes} setores={setores} />

          <PacientesEmFluxoDeAlta
            pacientes={pacientes}
            leitos={leitos}
            setores={setores}
            onAdicionarObservacao={handleAdicionarObservacao}
            onRemoverObservacao={handleRemoverObservacao}
          />

          <InternacaoProlongada
            pacientes={pacientes}
            leitos={leitos}
            setores={setores}
            onAdicionarObservacao={handleAdicionarObservacao}
            onRemoverObservacao={handleRemoverObservacao}
          />

          <PacientesComObservacoes
            pacientes={pacientes}
            leitos={leitos}
            setores={setores}
          />
        </Accordion>
      </div>

      <KanbanModal
        open={showKanbanModal}
        onOpenChange={setShowKanbanModal}
      />
    </div>
  );
};

export default Huddle;
