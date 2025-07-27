
import { ImportacaoMVModal } from "@/components/modals/ImportacaoMVModal";
import { RegulacaoModal } from "@/components/modals/RegulacaoModal";
import { TransferenciaModal } from "@/components/modals/TransferenciaModal";
import { AlocacaoCirurgiaModal } from "@/components/modals/AlocacaoCirurgiaModal";
import { GerenciarTransferenciaModal } from "@/components/modals/GerenciarTransferenciaModal";
import { SugestoesRegulacaoModal } from '@/components/modals/SugestoesRegulacaoModal';
import { CancelamentoModal } from "@/components/modals/CancelamentoModal";
import { ResumoRegulacoesModal } from "@/components/modals/ResumoRegulacoesModal";
import {
  ResultadoValidacao,
  SyncSummary,
} from "@/components/modals/ValidacaoImportacao";

interface RegulacaoModalsProps {
  // Estados dos modais
  importModalOpen: boolean;
  regulacaoModalOpen: boolean;
  cancelamentoModalOpen: boolean;
  transferenciaModalOpen: boolean;
  alocacaoCirurgiaModalOpen: boolean;
  gerenciarTransferenciaOpen: boolean;
  resumoModalOpen: boolean;
  sugestoesModalOpen: boolean;
  
  // Dados
  pacienteParaRegular: any;
  pacienteParaAcao: any;
  cirurgiaParaAlocar: any;
  isAlteracaoMode: boolean;
  validationResult: ResultadoValidacao | null;
  syncSummary: SyncSummary | null;
  modoRegulacao: "normal" | "uti";
  processing: boolean;
  isSyncing: boolean;
  pacientesRegulados: any[];
  sugestoes: any[];
  
  // Handlers
  onProcessFileRequest: (file: File) => void;
  onConfirmSync: () => void;
  onConfirmarRegulacao: (leitoDestino: any, observacoes: string, motivoAlteracao?: string) => void;
  onConfirmarCancelamento: (motivo: string) => void;
  onConfirmarTransferenciaExterna: (destino: string, motivo: string) => void;
  onConfirmarAlocacaoCirurgia: (cirurgia: any, leito: any) => void;
  
  // Setters
  setImportModalOpen: (open: boolean) => void;
  setRegulacaoModalOpen: (open: boolean) => void;
  setCancelamentoModalOpen: (open: boolean) => void;
  setTransferenciaModalOpen: (open: boolean) => void;
  setAlocacaoCirurgiaModalOpen: (open: boolean) => void;
  setGerenciarTransferenciaOpen: (open: boolean) => void;
  setResumoModalOpen: (open: boolean) => void;
  setSugestoesModalOpen: (open: boolean) => void;
}

export const RegulacaoModals = ({
  importModalOpen,
  regulacaoModalOpen,
  cancelamentoModalOpen,
  transferenciaModalOpen,
  alocacaoCirurgiaModalOpen,
  gerenciarTransferenciaOpen,
  resumoModalOpen,
  sugestoesModalOpen,
  pacienteParaRegular,
  pacienteParaAcao,
  cirurgiaParaAlocar,
  isAlteracaoMode,
  validationResult,
  syncSummary,
  modoRegulacao,
  processing,
  isSyncing,
  pacientesRegulados,
  sugestoes,
  onProcessFileRequest,
  onConfirmSync,
  onConfirmarRegulacao,
  onConfirmarCancelamento,
  onConfirmarTransferenciaExterna,
  onConfirmarAlocacaoCirurgia,
  setImportModalOpen,
  setRegulacaoModalOpen,
  setCancelamentoModalOpen,
  setTransferenciaModalOpen,
  setAlocacaoCirurgiaModalOpen,
  setGerenciarTransferenciaOpen,
  setResumoModalOpen,
  setSugestoesModalOpen,
}: RegulacaoModalsProps) => {
  return (
    <>
      <ImportacaoMVModal
        open={importModalOpen}
        onOpenChange={(isOpen) => {
          setImportModalOpen(isOpen);
          if (!isOpen) {
            // Reset states when closing
          }
        }}
        onProcessFileRequest={onProcessFileRequest}
        validationResult={validationResult}
        syncSummary={syncSummary}
        processing={processing}
        isSyncing={isSyncing}
        onConfirmSync={onConfirmSync}
      />

      <CancelamentoModal
        open={cancelamentoModalOpen}
        onOpenChange={setCancelamentoModalOpen}
        onConfirm={onConfirmarCancelamento}
        paciente={pacienteParaAcao}
      />

      <ResumoRegulacoesModal
        open={resumoModalOpen}
        onOpenChange={setResumoModalOpen}
        pacientesRegulados={pacientesRegulados}
      />

      <TransferenciaModal
        open={transferenciaModalOpen}
        onOpenChange={setTransferenciaModalOpen}
        onConfirm={onConfirmarTransferenciaExterna}
      />

      <GerenciarTransferenciaModal
        open={gerenciarTransferenciaOpen}
        onOpenChange={setGerenciarTransferenciaOpen}
        paciente={pacienteParaAcao}
      />

      <AlocacaoCirurgiaModal
        open={alocacaoCirurgiaModalOpen}
        onOpenChange={setAlocacaoCirurgiaModalOpen}
        cirurgia={cirurgiaParaAlocar}
        onAlocarLeito={onConfirmarAlocacaoCirurgia}
      />

      <SugestoesRegulacaoModal
        open={sugestoesModalOpen}
        onOpenChange={setSugestoesModalOpen}
        sugestoes={sugestoes}
      />

      {pacienteParaRegular && (
        <RegulacaoModal
          open={regulacaoModalOpen}
          onOpenChange={(isOpen) => {
            setRegulacaoModalOpen(isOpen);
            if (!isOpen) {
              // Reset states when closing
            }
          }}
          paciente={pacienteParaRegular}
          origem={{
            setor: pacienteParaRegular.setorOrigem,
            leito: pacienteParaRegular.leitoCodigo,
          }}
          onConfirmRegulacao={onConfirmarRegulacao}
          isAlteracao={isAlteracaoMode}
          modo={modoRegulacao}
        />
      )}
    </>
  );
};
