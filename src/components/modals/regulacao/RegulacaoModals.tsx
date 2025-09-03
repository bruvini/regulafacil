
import { ImportacaoMVModal } from '../ImportacaoMVModal';
import { RegulacaoModal } from '../RegulacaoModal';
import { CancelamentoModal } from '../CancelamentoModal';
import { TransferenciaModal } from '../TransferenciaModal';
import { AlocacaoCirurgiaModal } from '../AlocacaoCirurgiaModal';
import { GerenciarTransferenciaModal } from '../GerenciarTransferenciaModal';
import { ResumoRegulacoesModal } from '../ResumoRegulacoesModal';
import { SugestoesRegulacaoModal } from '../SugestoesRegulacaoModal';
import { ResultadoValidacao, SyncSummary } from '../ValidacaoImportacao';

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
  
  // Dados dos modais
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
  totalPendentes: number;
  opcoes?: { isContraFluxo?: boolean };
  
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
  totalPendentes,
  opcoes,
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
        onOpenChange={setImportModalOpen}
        onProcessFileRequest={onProcessFileRequest}
        validationResult={validationResult}
        syncSummary={syncSummary}
        onConfirmSync={onConfirmSync}
        processing={processing}
        isSyncing={isSyncing}
      />

      <RegulacaoModal
        open={regulacaoModalOpen}
        onOpenChange={setRegulacaoModalOpen}
        paciente={pacienteParaRegular}
        origem={{ setor: pacienteParaRegular?.setorOrigem || '', leito: pacienteParaRegular?.leitoCodigo || '' }}
        onConfirmRegulacao={onConfirmarRegulacao}
        isAlteracao={isAlteracaoMode}
        modo={modoRegulacao}
        opcoes={opcoes}
      />

      <CancelamentoModal
        open={cancelamentoModalOpen}
        onOpenChange={setCancelamentoModalOpen}
        onConfirm={onConfirmarCancelamento}
        paciente={pacienteParaAcao}
      />

      <TransferenciaModal
        open={transferenciaModalOpen}
        onOpenChange={setTransferenciaModalOpen}
        onConfirm={onConfirmarTransferenciaExterna}
      />

      <AlocacaoCirurgiaModal
        open={alocacaoCirurgiaModalOpen}
        onOpenChange={setAlocacaoCirurgiaModalOpen}
        cirurgia={cirurgiaParaAlocar}
        onAlocarLeito={onConfirmarAlocacaoCirurgia}
      />

      <GerenciarTransferenciaModal
        open={gerenciarTransferenciaOpen}
        onOpenChange={setGerenciarTransferenciaOpen}
        paciente={pacienteParaAcao}
      />

      <ResumoRegulacoesModal
        open={resumoModalOpen}
        onOpenChange={setResumoModalOpen}
        pacientesRegulados={pacientesRegulados}
      />

      <SugestoesRegulacaoModal
        open={sugestoesModalOpen}
        onOpenChange={setSugestoesModalOpen}
        sugestoes={sugestoes}
        totalPendentes={totalPendentes}
      />
    </>
  );
};
