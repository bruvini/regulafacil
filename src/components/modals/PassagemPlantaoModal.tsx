
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePassagemPlantaoData } from '@/hooks/usePassagemPlantaoData';
import { InfoBlock } from '@/components/passagem-plantao/InfoBlock';
import { Paciente } from '@/types/hospital';
import { Bed, Shield, ArrowDownUp, Hospital, Thermometer, AlertTriangle, MessageSquare, MoveRight, UserCheck } from 'lucide-react';

interface PassagemPlantaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientesJaRegulados: Paciente[];
}

export const PassagemPlantaoModal = ({ open, onOpenChange, pacientesJaRegulados }: PassagemPlantaoModalProps) => {
  const { gerarDadosParaSetor } = usePassagemPlantaoData();

  // Para este exemplo, estamos focando em um setor, mas a estrutura permite expansão
  const nomeSetor = "UNID. JS ORTOPEDIA";
  const dados = gerarDadosParaSetor(nomeSetor, pacientesJaRegulados);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Passagem de Plantão - {nomeSetor}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            <InfoBlock 
              title="Isolamentos" 
              icon={<Shield size={18} />} 
              data={dados.isolamentos} 
            />
            <InfoBlock 
              title="Regulações Pendentes" 
              icon={<ArrowDownUp size={18} />} 
              data={dados.regulacoesPendentes} 
            />
            <InfoBlock 
              title="Leitos PCP" 
              icon={<UserCheck size={18} />} 
              data={dados.leitosPCP} 
            />
            <InfoBlock 
              title="Leitos Vagos" 
              icon={<Bed size={18} />} 
              data={dados.leitosVagos} 
            />
            <InfoBlock 
              title="Aguardando UTI" 
              icon={<AlertTriangle size={18} />} 
              data={dados.aguardandoUTI} 
            />
            <InfoBlock 
              title="Remanejamentos" 
              icon={<MoveRight size={18} />} 
              data={dados.remanejamentos} 
            />
            <InfoBlock 
              title="Transferências Externas" 
              icon={<Hospital size={18} />} 
              data={dados.transferencias} 
            />
            <InfoBlock 
              title="Provável Alta" 
              icon={<Thermometer size={18} />} 
              data={dados.provavelAlta} 
            />
            <InfoBlock 
              title="Observações Relevantes" 
              icon={<MessageSquare size={18} />} 
              data={dados.observacoes} 
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
