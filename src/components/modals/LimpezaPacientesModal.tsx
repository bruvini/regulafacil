
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, writeBatch, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuditoria } from '@/hooks/useAuditoria';

interface LimpezaPacientesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LimpezaPacientesModal = ({ open, onOpenChange }: LimpezaPacientesModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { registrarLog } = useAuditoria();

  const handleLimpeza = async () => {
    setIsLoading(true);
    
    try {
      console.log('Iniciando limpeza geral de pacientes...');
      
      // Passo 1: Buscar todos os pacientes para contar
      const pacientesSnapshot = await getDocs(collection(db, 'pacientesRegulaFacil'));
      const totalPacientes = pacientesSnapshot.size;
      console.log(`Total de pacientes encontrados: ${totalPacientes}`);
      
      // Passo 2: Deletar todos os pacientes
      const deletePromises = pacientesSnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'pacientesRegulaFacil', docSnapshot.id))
      );
      await Promise.all(deletePromises);
      console.log('Todos os pacientes foram removidos');
      
      // Passo 3: Atualizar status dos leitos (exceto bloqueados)
      const leitosSnapshot = await getDocs(collection(db, 'leitosRegulaFacil'));
      const batch = writeBatch(db);
      
      let leitosAtualizados = 0;
      
      leitosSnapshot.docs.forEach(leitoDoc => {
        const leitoData = leitoDoc.data();
        const historicoRecente = leitoData.historicoMovimentacao[leitoData.historicoMovimentacao.length - 1];
        
        // Só atualiza se não estiver bloqueado
        if (historicoRecente.statusLeito !== 'Bloqueado') {
          const novoHistorico = {
            statusLeito: 'Vago',
            dataAtualizacaoStatus: new Date().toISOString(),
          };
          
          batch.update(doc(db, 'leitosRegulaFacil', leitoDoc.id), {
            historicoMovimentacao: [...leitoData.historicoMovimentacao, novoHistorico]
          });
          leitosAtualizados++;
        }
      });
      
      await batch.commit();
      console.log(`${leitosAtualizados} leitos atualizados para status Vago`);
      
      // Passo 4: Registrar log de auditoria
      await registrarLog(
        `Limpeza Geral de Pacientes - Todos os pacientes foram removidos do sistema. Total de pacientes removidos: ${totalPacientes}. Leitos atualizados: ${leitosAtualizados}.`,
        'Mapa de Leitos'
      );
      
      // Sucesso
      toast({
        title: "Limpeza concluída com sucesso!",
        description: `${totalPacientes} pacientes foram removidos e ${leitosAtualizados} leitos foram liberados.`,
      });
      
      onOpenChange(false);
      
      // Recarregar a página para refletir as mudanças
      window.location.reload();
      
    } catch (error) {
      console.error('Erro durante a limpeza:', error);
      toast({
        title: "Erro na limpeza",
        description: "Ocorreu um erro durante a limpeza dos dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
          <div className="bg-background rounded-lg p-8 flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-medical-primary" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Limpando dados...</h3>
              <p className="text-sm text-muted-foreground">Por favor, aguarde. Esta operação pode levar alguns minutos.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Confirmação */}
      <Dialog open={open && !isLoading} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  Confirmar Limpeza Geral de Pacientes
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          
          <DialogDescription className="text-base leading-relaxed">
            <strong className="text-destructive">Atenção!</strong> Esta é uma ação irreversível e removerá todos os pacientes do sistema, resetando o status dos leitos para 'Vago'. 
            <br /><br />
            Você tem certeza que deseja continuar?
          </DialogDescription>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleLimpeza}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Confirmar e Limpar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
