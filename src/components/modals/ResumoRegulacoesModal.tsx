// src/components/modals/ResumoRegulacoesModal.tsx

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatarDuracao } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientesRegulados: any[];
}

export const ResumoRegulacoesModal = ({ open, onOpenChange, pacientesRegulados }: Props) => {
  const { toast } = useToast();

  const dadosAgrupados = useMemo(() => {
    const porOrigem: Record<string, any[]> = {};
    const porDestino: Record<string, any[]> = {};

    pacientesRegulados.forEach(paciente => {
      if (!paciente.regulacao || !paciente.regulacao.dataAtualizacaoStatus) return;

      const tempoDeRegulacao = formatarDuracao(paciente.regulacao.dataAtualizacaoStatus);
      const msDeRegulacao = new Date().getTime() - new Date(paciente.regulacao.dataAtualizacaoStatus).getTime();

      const pacienteComTempo = {
        ...paciente,
        tempoDeRegulacao,
        msDeRegulacao,
      };

      if (!porOrigem[paciente.setorOrigem]) {
        porOrigem[paciente.setorOrigem] = [];
      }
      porOrigem[paciente.setorOrigem].push(pacienteComTempo);

      if (!porDestino[paciente.regulacao.paraSetor]) {
        porDestino[paciente.regulacao.paraSetor] = [];
      }
      porDestino[paciente.regulacao.paraSetor].push(pacienteComTempo);
    });

    return { porOrigem, porDestino };
  }, [pacientesRegulados]);

  // --- FUNÇÃO DE CÓPIA ATUALIZADA E INTELIGENTE ---
  const handleCopy = (setorNome: string, tipo: 'origem' | 'destino') => {
    const lista = tipo === 'origem' ? dadosAgrupados.porOrigem[setorNome] : dadosAgrupados.porDestino[setorNome];
    if (!lista || lista.length === 0) return;

    // Ordena os pacientes pelo maior tempo de espera, garantindo que os casos mais críticos fiquem no topo.
    const listaOrdenada = [...lista].sort((a, b) => b.msDeRegulacao - a.msDeRegulacao);

    // Define o cabeçalho da mensagem
    const header = `*REGULAÇÕES PENDENTES - Setor: ${setorNome}*`;

    let corpo = '';
    let footer = '';

    // **AJUSTE PRINCIPAL: MENSAGENS E ORIENTAÇÕES PERSONALIZADAS**
    // --------------------------------------------------
    if (tipo === 'origem') {
      // 1. MENSAGEM PARA QUEM ENVIA O PACIENTE
      corpo = listaOrdenada.map(p => 
        `_${p.leitoCodigo}_ - *${p.nomeCompleto}* / VAI PARA: *${p.regulacao.paraSetor} - ${p.regulacao.paraLeito}* / Aguardando há: *${p.tempoDeRegulacao}*`
      ).join('\n');
      
      // Orientações específicas para a equipe de origem.
      footer = `\n*ORIENTAÇÕES PARA A EQUIPE DE ORIGEM:*
- Identificar os pacientes acima na unidade;
- Passar o plantão para o enfermeiro(a) do setor de destino;
- Informar ao NIR sobre qualquer intercorrência que impacte a transferência;
- *AVISAR O NIR ASSIM QUE O PACIENTE FOR TRANSFERIDO!*`;

    } else {
      // 2. MENSAGEM PARA QUEM RECEBE O PACIENTE
      corpo = listaOrdenada.map(p => 
        `*${p.regulacao.paraLeito}* - *${p.nomeCompleto}* / VEM DE: _${p.setorOrigem} - ${p.leitoCodigo}_ / Aguardando há: *${p.tempoDeRegulacao}*`
      ).join('\n');

      // Orientações específicas para a equipe de destino.
      footer = `\n*ORIENTAÇÕES PARA A EQUIPE DE DESTINO:*
- Verificar se os leitos de destino estão prontos para receber os pacientes;
- Informar ao NIR caso ainda não tenha recebido o plantão do setor de origem;
- *PUXAR O PACIENTE PARA O LEITO NO SISTEMA MV ASSIM QUE ELE CHEGAR NA UNIDADE!*`;
    }
    // --------------------------------------------------

    const mensagemCompleta = `${header}\n\n${corpo}\n\n${footer}`;
    navigator.clipboard.writeText(mensagemCompleta);
    toast({ title: 'Copiado!', description: `Resumo do setor ${setorNome} copiado com sucesso.` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Resumo de Regulações Pendentes</DialogTitle>
          <DialogDescription>Visão geral de todas as regulações aguardando conclusão, agrupadas por setor de origem e destino.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Coluna de Origens */}
          <div className="flex flex-col">
            <h3 className="font-semibold mb-2 text-center">ORIGENS (QUEM ESTÁ ENVIANDO)</h3>
            <ScrollArea className="h-full border rounded-md p-4">
              <div className="space-y-4">
                {Object.entries(dadosAgrupados.porOrigem).map(([setorNome, pacientes]) => (
                  <Card key={setorNome}>
                    <CardHeader className="flex-row items-center justify-between py-2 px-4">
                      <CardTitle className="text-base">{setorNome}</CardTitle>
                      <Button size="sm" variant="outline" onClick={() => handleCopy(setorNome, 'origem')}><Copy className="h-4 w-4 mr-2" />Copiar</Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {[...pacientes].sort((a, b) => b.msDeRegulacao - a.msDeRegulacao).map(p => (
                        <div key={p.id} className="text-sm border-b last:border-b-0 py-1">
                          <div className="flex justify-between items-center">
                            <span><strong>{p.leitoCodigo}:</strong> {p.nomeCompleto}</span>
                            <span className="flex items-center gap-1 font-mono text-xs text-red-600">
                              <Clock className="h-3 w-3" />
                              {p.tempoDeRegulacao}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">→ {p.regulacao.paraSetor} - {p.regulacao.paraLeito}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Coluna de Destinos */}
          <div className="flex flex-col">
            <h3 className="font-semibold mb-2 text-center">DESTINOS (QUEM ESTÁ RECEBENDO)</h3>
            <ScrollArea className="h-full border rounded-md p-4">
              <div className="space-y-4">
                {Object.entries(dadosAgrupados.porDestino).map(([setorNome, pacientes]) => (
                   <Card key={setorNome}>
                   <CardHeader className="flex-row items-center justify-between py-2 px-4">
                     <CardTitle className="text-base">{setorNome}</CardTitle>
                     <Button size="sm" variant="outline" onClick={() => handleCopy(setorNome, 'destino')}><Copy className="h-4 w-4 mr-2" />Copiar</Button>
                   </CardHeader>
                   <CardContent className="p-4 pt-0">
                     {[...pacientes].sort((a, b) => b.msDeRegulacao - a.msDeRegulacao).map(p => (
                       <div key={p.id} className="text-sm border-b last:border-b-0 py-1">
                         <div className="flex justify-between items-center">
                           <span><strong>{p.regulacao.paraLeito}:</strong> {p.nomeCompleto}</span>
                           <span className="flex items-center gap-1 font-mono text-xs text-red-600">
                             <Clock className="h-3 w-3" />
                             {p.tempoDeRegulacao}
                           </span>
                         </div>
                         <p className="text-xs text-muted-foreground">← {p.setorOrigem} - {p.leitoCodigo}</p>
                       </div>
                     ))}
                   </CardContent>
                 </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};