
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  MessageSquare,
  FileDown 
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
  const { getDadosPassagemPlantao } = usePassagemPlantaoData();
  
  // Gerar dados para todos os setores relevantes
  const dadosPorSetor = getDadosPassagemPlantao(pacientesJaRegulados);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0 flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold text-medical-primary">
            Passagem de Plantão da Regulação
          </DialogTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled
                  className="ml-4"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exportar para .docx (em breve)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 pb-6">
          {dadosPorSetor.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <p>Nenhum dado disponível para passagem de plantão</p>
            </div>
          ) : (
            <div className="space-y-8">
              {dadosPorSetor.map(setorInfo => (
                <div key={setorInfo.nomeSetor} className="border-b pb-6 last:border-b-0">
                  <h2 className="text-xl font-bold mb-4 text-medical-primary border-l-4 border-medical-primary pl-3">
                    {setorInfo.nomeSetor}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {setorInfo.dados.isolamentos.length > 0 && (
                      <InfoBlock
                        title="Isolamentos Vigentes"
                        icon={<Shield className="h-4 w-4" />}
                        data={setorInfo.dados.isolamentos}
                      />
                    )}
                    
                    {setorInfo.dados.regulacoesPendentes.length > 0 && (
                      <InfoBlock
                        title="Regulações Pendentes"
                        icon={<UserCheck className="h-4 w-4" />}
                        data={setorInfo.dados.regulacoesPendentes}
                      />
                    )}
                    
                    {setorInfo.dados.leitosPCP.length > 0 && (
                      <InfoBlock
                        title="Leitos PCP"
                        icon={<Bed className="h-4 w-4" />}
                        data={setorInfo.dados.leitosPCP}
                      />
                    )}
                    
                    {setorInfo.dados.leitosVagos.length > 0 && (
                      <InfoBlock
                        title="Leitos Vagos"
                        icon={<BedDouble className="h-4 w-4" />}
                        data={setorInfo.dados.leitosVagos}
                      />
                    )}
                    
                    {setorInfo.dados.pacientesUTI.length > 0 && (
                      <InfoBlock
                        title="Aguardando UTI"
                        icon={<AlertTriangle className="h-4 w-4" />}
                        data={setorInfo.dados.pacientesUTI}
                      />
                    )}
                    
                    {setorInfo.dados.pacientesTransferencia.length > 0 && (
                      <InfoBlock
                        title="Transferências Externas"
                        icon={<ArrowRightLeft className="h-4 w-4" />}
                        data={setorInfo.dados.pacientesTransferencia}
                      />
                    )}
                    
                    {setorInfo.dados.pacientesRemanejamento.length > 0 && (
                      <InfoBlock
                        title="Remanejamentos"
                        icon={<Move className="h-4 w-4" />}
                        data={setorInfo.dados.pacientesRemanejamento}
                      />
                    )}
                    
                    {setorInfo.dados.pacientesAltaProvavel.length > 0 && (
                      <InfoBlock
                        title="Alta Provável"
                        icon={<Home className="h-4 w-4" />}
                        data={setorInfo.dados.pacientesAltaProvavel}
                      />
                    )}
                    
                    {setorInfo.dados.observacoesGerais.length > 0 && (
                      <InfoBlock
                        title="Observações Gerais"
                        icon={<MessageSquare className="h-4 w-4" />}
                        data={setorInfo.dados.observacoesGerais}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
