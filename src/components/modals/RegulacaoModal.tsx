// src/components/modals/RegulacaoModal.tsx

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, Copy, CheckCircle, BedDouble, Users2 } from 'lucide-react';
import { Paciente } from '@/types/hospital'; // CORREÇÃO: Importa o tipo correto
import { useLeitoFinder, LeitoCompativel } from '@/hooks/useLeitoFinder';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { descreverMotivoRemanejamento } from '@/lib/utils';

interface RegulacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: Paciente | null; // CORREÇÃO: Usa o tipo Paciente
  origem: { setor: string, leito: string };
  onConfirmRegulacao: (leitoDestino: any, observacoes: string, motivoAlteracao?: string) => void;
  isAlteracao?: boolean;
  modo?: 'normal' | 'uti';
}

const calcularIdade = (dataNascimento?: string): string => {
    if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return '?';
    const [dia, mes, ano] = dataNascimento.split('/').map(Number);
    let idade = new Date().getFullYear() - ano;
    const m = new Date().getMonth() - (mes - 1);
    if (m < 0 || (m === 0 && new Date().getDate() < dia)) idade--;
    return idade.toString();
};

export const RegulacaoModal = ({ open, onOpenChange, paciente, origem, onConfirmRegulacao, isAlteracao = false, modo = 'normal' }: RegulacaoModalProps) => {
  const { findAvailableLeitos } = useLeitoFinder();
  const { toast } = useToast();
  const [leitosDisponiveis, setLeitosDisponiveis] = useState<LeitoCompativel[]>([]);
  const [leitoSelecionado, setLeitoSelecionado] = useState<LeitoCompativel | null>(null);
  const [etapa, setEtapa] = useState(1);
  const [observacoes, setObservacoes] = useState('');
  const [motivoAlteracao, setMotivoAlteracao] = useState('');

  const pcpChecklist = [
    "Menor de 18 anos ou maior de 60 anos?",
    "Qual a comorbidade/condição?",
    "É obeso(a)?",
    "Possui acompanhante?",
    "Qual o grau de dependência?",
    "Apresenta risco de queda elevado?",
    "Possui alguma limitação para se locomover?",
    "Realizou alguma cirurgia de grande porte nos últimos 30 dias?",
    "Apresentou queda ou desmaio nas últimas 24 horas?",
    "Houve 2 ou mais episódios de alterações de sinais vitais nas últimas 24 horas?",
    "Necessita de monitoramento contínuo?",
    "Alguma condição que afete seu intelecto (AVC, alzheimer, parkinson, convulsão etc)?",
    "Em uso de algum dispositivo invasivo além de acesso venoso (O2, tubo orotraqueal, traqueostomia, acesso venoso central, sonda vesical de demora etc)?",
    "Necessidade de isolamento por infecção?"
  ];

  useEffect(() => {
    if (open && paciente) {
      setLeitosDisponiveis(findAvailableLeitos(paciente, modo));
    }
    if (!open) {
      setEtapa(isAlteracao ? 0 : 1);
      setLeitoSelecionado(null);
      setObservacoes('');
      setMotivoAlteracao('');
    }
  }, [open, paciente, findAvailableLeitos, isAlteracao, modo]);

  const leitosAgrupadosPorSetor = useMemo(() => {
    return leitosDisponiveis.reduce((acc, leito) => {
      (acc[leito.setorNome] = acc[leito.setorNome] || []).push(leito);
      return acc;
    }, {} as Record<string, LeitoCompativel[]>);
  }, [leitosDisponiveis]);

  const handleSelectLeito = (leito: LeitoCompativel) => {
    setLeitoSelecionado(leito);
    setEtapa(isAlteracao ? 3 : 2);
  };

const getMensagemConfirmacao = () => {
    if (!paciente || !leitoSelecionado) return "";

    // Lógica para Nova Regulação
    if (!isAlteracao) {
        let mensagem = `*✨ LEITO REGULADO ✨*\n\n- *Paciente:* _${paciente.nomeCompleto}_\n- *Origem:* _${origem.setor} - ${origem.leito}_ → *Destino:* _${leitoSelecionado.setorNome} - ${leitoSelecionado.codigoLeito}_`;

        const isolamentos = paciente.isolamentosVigentes?.map(i => i.sigla).join(', ');
        if (isolamentos) {
            mensagem += `\n- *Isolamento:* _${isolamentos}_`;
        }
        if (observacoes) {
            mensagem += `\n- *Obs. NIR:* _${observacoes}_`;
        }
        if (paciente.remanejarPaciente) {
            const motivo = descreverMotivoRemanejamento(paciente.motivoRemanejamento);
            if (motivo) {
                mensagem += `\n- *Motivo Remanejamento:* _${motivo}_`;
            }
        }
        mensagem += `\n\n- _${new Date().toLocaleString('pt-BR')}_`;
        return mensagem;
    }

    // Lógica para Alteração de Regulação
    if (isAlteracao) {
        let mensagem = `*🔄 REGULAÇÃO ALTERADA 🔄*\n\n- *Paciente:* _${paciente.nomeCompleto}_\n- *Origem:* _${origem.setor} - ${origem.leito}_\n- *Novo Destino:* _${leitoSelecionado.setorNome} ${leitoSelecionado.codigoLeito}_`;

        if (motivoAlteracao) {
            mensagem += `\n- *Motivo:* _${motivoAlteracao}_`;
        }
        mensagem += `\n\n- _${new Date().toLocaleString('pt-BR')}_`;
        return mensagem;
    }

    return "";
};

  const copiarParaClipboard = () => {
    const mensagem = getMensagemConfirmacao();
    navigator.clipboard.writeText(mensagem);
    toast({ title: "Copiado!", description: "Mensagem de regulação copiada para a área de transferência." });
  };

  const handleConfirmar = () => {
    const mensagem = getMensagemConfirmacao();
    navigator.clipboard.writeText(mensagem);
    toast({ title: "Regulação Confirmada!", description: "A mensagem foi copiada para a área de transferência." });
    onConfirmRegulacao(leitoSelecionado, observacoes, motivoAlteracao);
  };

  const renderContent = () => {
    switch (etapa) {
      case 0:
        return (
          <>
            <DialogDescription>Informe o motivo da alteração da regulação.</DialogDescription>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="motivo-alteracao">Motivo da Alteração</Label>
                <Textarea 
                  id="motivo-alteracao"
                  value={motivoAlteracao} 
                  onChange={(e) => setMotivoAlteracao(e.target.value)}
                  placeholder="Descreva o motivo da alteração..."
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={() => setEtapa(1)} disabled={!motivoAlteracao.trim()}>Continuar</Button>
            </DialogFooter>
          </>
        );
      case 1:
        return (
          <>
            <DialogDescription>Selecione um leito disponível compatível com o perfil do paciente.</DialogDescription>
            <ScrollArea className="h-[50vh] mt-4">
              <Accordion type="multiple" className="w-full pr-4">
                {Object.keys(leitosAgrupadosPorSetor).length > 0 ? Object.entries(leitosAgrupadosPorSetor).map(([setorNome, leitos]) => (
                  <AccordionItem key={setorNome} value={setorNome}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex justify-between items-center w-full pr-4">
                        <span className="font-semibold">{setorNome}</span>
                        <Badge variant="secondary">{(leitos as any[]).length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      {(leitos as LeitoCompativel[]).map(leito => (
                        <Card
                          key={leito.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSelectLeito(leito)}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <BedDouble className="h-4 w-4" />
                                <span className="font-medium">{leito.codigoLeito}</span>
                                {leito.leitoPCP && <Badge variant="outline">PCP</Badge>}
                                {leito.leitoIsolamento && <Badge variant="destructive">Isolamento</Badge>}
                                {leito.temHomonimo && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="destructive" className="flex items-center gap-1">
                                          <Users2 className="h-3 w-3" />
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          Alerta: Já existe um paciente com o mesmo primeiro nome neste
                                          quarto.
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                              <Badge variant={leito.statusLeito === 'Vago' ? 'default' : 'secondary'}>
                                {leito.statusLeito}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )) : <p className="text-center text-muted-foreground py-8">Nenhum leito compatível encontrado.</p>}
              </Accordion>
            </ScrollArea>
          </>
        );
      case 2:
      case 3:
        return (
          <>
            <DialogDescription>Revise os dados da regulação e adicione observações se necessário.</DialogDescription>
            <div className="space-y-4 mt-4">
              {leitoSelecionado?.leitoPCP && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-xs space-y-2">
                  <p className="font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Atenção: Leito PCP Selecionado!
                  </p>
                  <p>Apenas para ciência, o paciente atende aos critérios abaixo?</p>
                  <ul className="list-disc list-inside pl-2 text-xs">
                    {pcpChecklist.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200">
                {/* CORREÇÃO: nomePaciente -> nomeCompleto */}
                <p className="whitespace-pre-wrap font-mono text-xs">{getMensagemConfirmacao()}</p>
              </div>
              <Textarea 
                placeholder={isAlteracao ? "Descreva o motivo da alteração..." : "Adicionar observações do NIR (opcional)..."} 
                value={observacoes} 
                onChange={e => setObservacoes(e.target.value)} 
              />
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setEtapa(1)}>Voltar</Button>
              <Button variant="secondary" onClick={copiarParaClipboard}>
                <Copy className="mr-2 h-4 w-4"/>Copiar
              </Button>
              <Button onClick={handleConfirmar}>
                <CheckCircle className="mr-2 h-4 w-4"/>
                {isAlteracao ? 'Confirmar Alteração' : 'Confirmar Regulação'}
              </Button>
            </DialogFooter>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {/* CORREÇÃO: nomePaciente -> nomeCompleto */}
            {modo === 'uti' ? 'Regular Leito de UTI para' : isAlteracao ? 'Alterar Regulação para' : 'Regular Leito para'}: {paciente?.nomeCompleto}
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};