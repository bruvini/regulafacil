
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InfoBlock } from '@/components/passagem-plantao/InfoBlock';
import { usePassagemPlantaoData } from '@/hooks/usePassagemPlantaoData';
import { Paciente } from '@/types/hospital';
import { 
  Shield, 
  UserCheck, 
  Bed, 
  BedDouble, 
  AlertTriangle, 
  ArrowRightLeft, 
  Move, 
  Home, 
  Clock, 
  MessageSquare 
} from 'lucide-react';

interface PassagemPlantaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientesJaRegulados: Paciente[];
}

export const PassagemPlantaoModal = ({ 
  open, 
  onOpenChange, 
  pacientesJaRegulados 
}: PassagemPlantaoModalProps) => {
  const { gerarDadosParaSetor } = usePassagemPlantaoData();
  
  // Gerar dados para o setor "UNID. JS ORTOPEDIA"
  const dadosSetor = gerarDadosParaSetor("UNID. JS ORTOPEDIA", pacientesJaRegulados);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-medical-primary">
            Passagem de Plantão - UNID. JS ORTOPEDIA
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <InfoBlock
              title="Isolamentos Vigentes"
              icon={<Shield className="h-4 w-4" />}
              data={dadosSetor.isolamentos}
            />
            
            <InfoBlock
              title="Regulações Pendentes"
              icon={<UserCheck className="h-4 w-4" />}
              data={dadosSetor.regulacoesPendentes}
            />
            
            <InfoBlock
              title="Leitos PCP"
              icon={<Bed className="h-4 w-4" />}
              data={dadosSetor.leitosPCP}
            />
            
            <InfoBlock
              title="Leitos Vagos"
              icon={<BedDouble className="h-4 w-4" />}
              data={dadosSetor.leitosVagos}
            />
            
            <InfoBlock
              title="Aguardando UTI"
              icon={<AlertTriangle className="h-4 w-4" />}
              data={dadosSetor.pacientesUTI}
            />
            
            <InfoBlock
              title="Transferências Externas"
              icon={<ArrowRightLeft className="h-4 w-4" />}
              data={dadosSetor.pacientesTransferencia}
            />
            
            <InfoBlock
              title="Remanejamentos"
              icon={<Move className="h-4 w-4" />}
              data={dadosSetor.pacientesRemanejamento}
            />
            
            <InfoBlock
              title="Alta Provável"
              icon={<Home className="h-4 w-4" />}
              data={dadosSetor.pacientesAltaProvavel}
            />
            
            <InfoBlock
              title="Internações Prolongadas"
              icon={<Clock className="h-4 w-4" />}
              data={dadosSetor.internacoesProlongadas}
            />
            
            <InfoBlock
              title="Observações Gerais"
              icon={<MessageSquare className="h-4 w-4" />}
              data={dadosSetor.observacoesGerais}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
