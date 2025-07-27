// src/components/modals/ResumoRegulacoesModal.tsx

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatarDuracao } from '@/lib/utils'; // Importa a função de formatação de tempo

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacientesRegulados: any[];
}

export const ResumoRegulacoesModal = ({ open, onOpenChange, pacientesRegulados }: Props) => {
  const { toast } = useToast();

  // 1. PROCESSAMENTO E AGRUPAMENTO DOS DADOS
  // --------------------------------------------------
  // O useMemo garante que este cálculo complexo só seja refeito se a lista de pacientes mudar.
  const dadosAgrupados = useMemo(() => {
    // Objeto para agrupar pacientes por setor de ORIGEM (quem está enviando)
    const porOrigem: Record<string, any[]> = {};
    // Objeto para agrupar pacientes por setor de DESTINO (quem está recebendo)
    const porDestino: Record<string, any[]> = {};

    pacientesRegulados.forEach(paciente => {
      // Pula qualquer paciente que não tenha os dados completos da regulação.
      if (!paciente.regulacao) return;

      // **AJUSTE PRINCIPAL: CALCULA A DURAÇÃO DA ESPERA**
      // Calcula há quanto tempo a regulação está pendente.
      const tempoDeRegulacao = formatarDuracao(paciente.regulacao.dataAtualizacaoStatus);
      // Armazena a duração em milissegundos para facilitar a ordenação numérica.
      const msDeRegulacao = new Date().getTime() - new Date(paciente.regulacao.dataAtualizacaoStatus).getTime();

      // Cria um objeto de 'paciente para exibição' com os dados já formatados.
      const pacienteComTempo = {
        ...paciente,
        tempoDeRegulacao,
        msDeRegulacao,
      };

      // Adiciona o paciente à lista do seu setor de origem.
      if (!porOrigem[paciente.setorOrigem]) {
        porOrigem[paciente.setorOrigem] = [];
      }
      porOrigem[paciente.setorOrigem].push(pacienteComTempo);

      // Adiciona o paciente à lista do seu setor de destino.
      if (!porDestino[paciente.regulacao.paraSetor]) {
        porDestino[paciente.regulacao.paraSetor] = [];
      }
      porDestino[paciente.regulacao.paraSetor].push(pacienteComTempo);
    });

    return { porOrigem, porDestino };
  }, [pacientesRegulados]);

  // 2. FUNÇÃO PARA COPIAR O RESUMO PARA A ÁREA DE TRANSFERÊNCIA
  // --------------------------------------------------
  const handleCopy = (setorNome: string, tipo: 'origem' | 'destino') => {
    // Seleciona a lista correta de pacientes (origem ou destino).
    const lista = tipo === 'origem' ? dadosAgrupados.porOrigem[setorNome] : dadosAgrupados.porDestino[setorNome];
    if (!lista || lista.length === 0) return;

    // **AJUSTE PRINCIPAL: ORDENA A LISTA POR TEMPO DE ESPERA**
    // Ordena os pacientes em ordem decrescente, do que está esperando há mais tempo para o mais recente.
    const listaOrdenada = [...lista].sort((a, b) => b.msDeRegulacao - a.msDeRegulacao);

    // Monta o cabeçalho da mensagem.
    const header = `*REGULAÇÕES PENDENTES - ${tipo === 'origem' ? 'SAÍDAS' : 'CHEGADAS'} (${setorNome})*`;
    
    // Mapeia cada paciente para uma linha de texto, agora incluindo o tempo de regulação.
    const corpo = listaOrdenada.map(p => 
      `_${p.siglaSetorOrigem} - ${p.leitoCodigo}_ - *${p.nomeCompleto}* / VAI PARA: *${p.regulacao.paraSetor} - ${p.regulacao.paraLeito}* (*Tempo de regulação: ${p.tempoDeRegulacao}*)`
    ).join('\n');

    // Monta as orientações finais.
    const footer = `\n- Passar plantão para o destino, se ainda não realizado;
- Informar ao NIR sobre as transferências realizadas ou se houver dificuldades na passagem de plantão;
- Informar equipe de limpeza para higienização dos leitos liberados;`;

    // Junta tudo, copia e exibe a notificação de sucesso.
    const mensagemCompleta = `${header}\n${corpo}\n${footer}`;
    navigator.clipboard.writeText(mensagemCompleta);
    toast({ title: 'Copiado!', description: `Resumo do setor ${setorNome} copiado.` });
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
                      {/* **AJUSTE PRINCIPAL: ORDENA E EXIBE O TEMPO** */}
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
                      {/* **AJUSTE PRINCIPAL: ORDENA E EXIBE O TEMPO** */}
                     {[...pacientes].sort((a, b) => b.msDeRegulacao - a.msDeRegulacao).map(p => (
                       <div key={p.id} className="text-sm border-b last:border-b-0 py-1">
                         <div className="flex justify-between items-center">
                           <span><strong>{p.leitoCodigo}:</strong> {p.nomeCompleto}</span>
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