import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, Copy, CheckCircle, BedDouble, ClipboardCheck } from 'lucide-react';
import { DadosPaciente } from '@/types/hospital';
import { useLeitoFinder } from '@/hooks/useLeitoFinder';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface RegulacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: DadosPaciente | null;
  origem: { setor: string, leito: string };
  onConfirmRegulacao: (leitoDestino: any, observacoes: string, motivoAlteracao?: string) => void;
  isAlteracao?: boolean;
  modo?: 'normal' | 'uti';
}

const pcpChecklist = [
  "Estar entre 18 e 60 anos de idade",
  "Não ser obeso",
  "Não possuir acompanhante",
  "Ser independente nas tarefas diárias",
  "Não ter risco de queda",
  "Não possuir limitações de movimento",
  "Não ter realizado cirurgia de grande porte nos últimos 30 dias",
  "Não ter tido quedas ou desmaios nas últimas 24h",
  "Não ter tido 2 ou mais episódios de alterações de SSVV nas últimas 24h",
  "Não precisar de monitoramento contínuo",
  "Não possuir condições que afete seu intelecto (AVC, Alzheimer, Parkinson, Convulsão, etc)",
  "Não usar dispositivos invasivos além de Acesso Venoso Periférico",
  "Não necessitar de isolamento por infecção"
];

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
  const [leitosDisponiveis, setLeitosDisponiveis] = useState<any[]>([]);
  const [leitoSelecionado, setLeitoSelecionado] = useState<any | null>(null);
  const [etapa, setEtapa] = useState(1);
  const [pcpChecks, setPcpChecks] = useState<boolean[]>(Array(pcpChecklist.length).fill(false));
  const [observacoes, setObservacoes] = useState('');
  const [motivoAlteracao, setMotivoAlteracao] = useState('');

  useEffect(() => {
    if (open && paciente) {
      setLeitosDisponiveis(findAvailableLeitos(paciente, modo));
    }
    if (!open) {
      // Resetar tudo quando o modal fechar
      setEtapa(isAlteracao ? 0 : 1);
      setLeitoSelecionado(null);
      setPcpChecks(Array(pcpChecklist.length).fill(false));
      setObservacoes('');
      setMotivoAlteracao('');
    }
  }, [open, paciente, findAvailableLeitos, isAlteracao, modo]);

  const leitosAgrupadosPorSetor = useMemo(() => {
    return leitosDisponiveis.reduce((acc, leito) => {
      (acc[leito.setorNome] = acc[leito.setorNome] || []).push(leito);
      return acc;
    }, {} as Record<string, any[]>);
  }, [leitosDisponiveis]);

  const handleSelectLeito = (leito: any) => {
    setLeitoSelecionado(leito);
    if (leito.leitoPCP) setEtapa(2);
    else setEtapa(3);
  };

  const handlePcpConfirm = () => {
    if (pcpChecks.every(Boolean)) setEtapa(isAlteracao ? 4 : 3);
    else toast({ title: "Atenção", description: "Todos os critérios para o Leito PCP devem ser confirmados.", variant: "destructive" });
  };

  const getMensagemConfirmacao = () => {
    if (!paciente || !leitoSelecionado) return "";
    const idade = calcularIdade(paciente.dataNascimento);
    const isolamentos = paciente.isolamentosVigentes?.map(i => i.sigla).join(', ') || 'Nenhum';
    const obs = observacoes ? `\nObservações NIR: ${observacoes}` : "";
    const motivoAlt = isAlteracao && motivoAlteracao ? `\nMotivo da Alteração: ${motivoAlteracao}` : "";

    if (isAlteracao) {
      return `⚠️ ALTERAÇÃO DE REGULAÇÃO ⚠️
Paciente: ${paciente.nomePaciente} - ${paciente.sexoPaciente} - ${idade} anos
Origem: ${origem.setor} - ${origem.leito}
Regulação Prévia: ${(paciente as any).regulacao?.paraSetorSigla || 'N/A'} - ${(paciente as any).regulacao?.paraLeito || 'N/A'}
Novo Destino: ${leitoSelecionado.setorNome} - ${leitoSelecionado.codigoLeito}
Isolamento: ${isolamentos}${motivoAlt}${obs}

Data e hora da alteração: ${new Date().toLocaleString('pt-BR')}`;
    } else {
      return `⚠️ LEITO REGULADO ⚠️
Paciente: ${paciente.nomePaciente} - ${paciente.sexoPaciente} - ${idade} anos
Origem: ${origem.setor} - ${origem.leito}
Destino: ${leitoSelecionado.setorNome} - ${leitoSelecionado.codigoLeito}
Isolamento: ${isolamentos}${obs}

- Fazer contato com o destino para passar plantão e agilizar transferências. Avisar o NIR caso haja alguma intercorrência, dificuldade na passagem de plantão ou demais eventualidades!

Data e hora da regulação: ${new Date().toLocaleString('pt-BR')}`;
    }
  };

  const copiarParaClipboard = () => {
    const mensagem = getMensagemConfirmacao();
    navigator.clipboard.writeText(mensagem);
    toast({ title: "Copiado!", description: "Mensagem de regulação copiada para a área de transferência." });
  };

  const renderContent = () => {
    switch (etapa) {
      case 0: // Nova Etapa: Motivo da Alteração (só para isAlteracao)
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
      case 1: // Seleção de Leito
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
                      {(leitos as any[]).map(leito => (
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
      case 2: // Checklist PCP
        return (
          <>
            <DialogDescription className="flex items-center gap-2 text-amber-700"><AlertTriangle/>O leito selecionado é um Leito PCP. Confirme todos os critérios de elegibilidade.</DialogDescription>
            <ScrollArea className="h-[50vh] mt-4">
                <Card><CardContent className="p-4 space-y-3">
                    {pcpChecklist.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <Checkbox id={`pcp-${index}`} checked={pcpChecks[index]} onCheckedChange={(checked) => setPcpChecks(prev => prev.map((c, i) => i === index ? !!checked : c))} />
                            <Label htmlFor={`pcp-${index}`} className="text-sm">{item}</Label>
                        </div>
                    ))}
                </CardContent></Card>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setEtapa(isAlteracao ? 1 : 1)}>Voltar</Button>
              <Button onClick={handlePcpConfirm}><ClipboardCheck className="mr-2 h-4 w-4"/>Confirmar Critérios</Button>
            </DialogFooter>
          </>
        );
      case 3: // Confirmação Final (etapa original)
      case 4: // Confirmação Final (para modo alteração)
        return (
          <>
            <DialogDescription>Revise os dados da regulação e adicione observações se necessário.</DialogDescription>
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200">
                  <p className="whitespace-pre-wrap font-mono text-xs">{getMensagemConfirmacao()}</p>
              </div>
              <Textarea 
                placeholder={isAlteracao ? "Descreva o motivo da alteração..." : "Adicionar observações do NIR (opcional)..."} 
                value={observacoes} 
                onChange={e => setObservacoes(e.target.value)} 
              />
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setEtapa(leitoSelecionado?.leitoPCP ? 2 : 1)}>Voltar</Button>
              <Button variant="secondary" onClick={copiarParaClipboard}><Copy className="mr-2 h-4 w-4"/>Copiar</Button>
              <Button onClick={() => onConfirmRegulacao(leitoSelecionado, observacoes, motivoAlteracao)}><CheckCircle className="mr-2 h-4 w-4"/>{isAlteracao ? 'Confirmar Alteração' : 'Confirmar Regulação'}</Button>
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
            {modo === 'uti' ? 'Regular Leito de UTI para' : isAlteracao ? 'Alterar Regulação para' : 'Regular Leito para'}: {paciente?.nomePaciente}
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
