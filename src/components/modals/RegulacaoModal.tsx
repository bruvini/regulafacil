
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertCircle, Copy, CheckCircle, BedDouble } from 'lucide-react';
import { DadosPaciente, Leito } from '@/types/hospital';
import { useLeitoFinder } from '@/hooks/useLeitoFinder';
import { Badge } from '@/components/ui/badge';

interface RegulacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: DadosPaciente | null;
  origem: { setor: string, leito: string };
  onConfirmRegulacao: (leitoDestino: any, observacoes: string) => void;
}

const pcpChecklist = [
  "Estar entre 18 e 60 anos de idade",
  "Não ser obeso",
  "Não estar em uso de ventilação mecânica",
  "Não necessitar de monitorização cardíaca contínua",
  "Não estar em uso de drogas vasoativas",
  "Não apresentar instabilidade hemodinâmica",
  "Não ter sido submetido a cirurgia de grande porte nas últimas 24h",
  "Não necessitar de cuidados intensivos",
  "Não apresentar alterações neurológicas agudas",
  "Não estar em pós-operatório imediato",
  "Não necessitar de isolamento por infecção",
  "Ter estabilidade clínica para permanência em enfermaria",
  "Não apresentar complicações pós-cirúrgicas graves"
];

export const RegulacaoModal = ({ open, onOpenChange, paciente, origem, onConfirmRegulacao }: RegulacaoModalProps) => {
  const { findAvailableLeitos } = useLeitoFinder();
  const [leitosDisponiveis, setLeitosDisponiveis] = useState<any[]>([]);
  const [leitoSelecionado, setLeitoSelecionado] = useState<any | null>(null);
  const [etapa, setEtapa] = useState(1); // 1: Seleção, 2: PCP, 3: Confirmação
  const [pcpChecks, setPcpChecks] = useState<boolean[]>(Array(pcpChecklist.length).fill(false));
  const [observacoes, setObservacoes] = useState('');
  
  useEffect(() => {
    if (paciente) {
      setLeitosDisponiveis(findAvailableLeitos(paciente));
    }
    // Resetar o estado ao abrir/fechar ou mudar de paciente
    setEtapa(1);
    setLeitoSelecionado(null);
    setPcpChecks(Array(pcpChecklist.length).fill(false));
    setObservacoes('');
  }, [open, paciente, findAvailableLeitos]);

  const handleSelectLeito = (leito: any) => {
    setLeitoSelecionado(leito);
    if (leito.leitoPCP) {
      setEtapa(2); // Vai para a etapa do checklist PCP
    } else {
      setEtapa(3); // Vai direto para a confirmação
    }
  };

  const handlePcpConfirm = () => {
    if (pcpChecks.every(check => check)) {
        setEtapa(3);
    } else {
        alert("Todas as condições para o leito PCP devem ser confirmadas.");
    }
  };

  const calcularIdade = (dataNascimento: string): number => {
    if (!dataNascimento) return 0;
    const [dia, mes, ano] = dataNascimento.split('/').map(Number);
    const hoje = new Date();
    const nascimento = new Date(ano, mes - 1, dia);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const renderConfirmacao = () => {
    if (!paciente || !leitoSelecionado) return null;
    
    const idade = calcularIdade(paciente.dataNascimento);
    const isolamentos = paciente.isolamentosVigentes?.map(i => i.sigla).join(', ') || 'Nenhum';
    const mensagem = `REGULAÇÃO DE LEITO - ${new Date().toLocaleString()}

PACIENTE: ${paciente.nomePaciente}
IDADE: ${idade} anos | SEXO: ${paciente.sexoPaciente}
ESPECIALIDADE: ${paciente.especialidadePaciente}
ISOLAMENTOS: ${isolamentos}

ORIGEM: ${origem.setor} - ${origem.leito}
DESTINO: ${leitoSelecionado.setorNome} - ${leitoSelecionado.codigoLeito}
TIPO DE LEITO: ${leitoSelecionado.leitoPCP ? 'PCP' : 'Enfermaria'}${leitoSelecionado.leitoIsolamento ? ' (Isolamento)' : ''}

STATUS: Regulação autorizada pelo NIR`;
    
    return (
        <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="whitespace-pre-wrap font-mono text-xs">{mensagem}</p>
            </div>
            <div>
                <Label htmlFor="observacoes">Observações do NIR (opcional)</Label>
                <Textarea 
                    id="observacoes"
                    placeholder="Adicionar observações da regulação..." 
                    value={observacoes} 
                    onChange={e => setObservacoes(e.target.value)} 
                />
            </div>
        </div>
    );
  };

  const renderSelecaoLeitos = () => {
    if (leitosDisponiveis.length === 0) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum leito disponível</h3>
          <p className="text-muted-foreground">
            Não há leitos compatíveis com este paciente no momento.
          </p>
        </div>
      );
    }

    // Agrupar leitos por setor
    const leitosPorSetor = leitosDisponiveis.reduce((acc, leito) => {
      if (!acc[leito.setorNome]) {
        acc[leito.setorNome] = [];
      }
      acc[leito.setorNome].push(leito);
      return acc;
    }, {} as Record<string, any[]>);

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {leitosDisponiveis.length} leito(s) disponível(is) para este paciente
        </div>
        <Accordion type="multiple" className="w-full">
          {Object.entries(leitosPorSetor).map(([setorNome, leitos]) => (
            <AccordionItem key={setorNome} value={setorNome}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex justify-between items-center w-full pr-4">
                  <span className="font-semibold">{setorNome}</span>
                  <Badge variant="secondary">{leitos.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                {leitos.map(leito => (
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
          ))}
        </Accordion>
      </div>
    );
  };

  const renderChecklistPCP = () => (
    <div className="space-y-4">
      <div className="text-center">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold">Checklist para Leito PCP</h3>
        <p className="text-sm text-muted-foreground">
          Confirme que o paciente atende a todos os critérios
        </p>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {pcpChecklist.map((item, index) => (
          <div key={index} className="flex items-start space-x-2">
            <Checkbox
              id={`pcp-${index}`}
              checked={pcpChecks[index]}
              onCheckedChange={(checked) => {
                const newChecks = [...pcpChecks];
                newChecks[index] = !!checked;
                setPcpChecks(newChecks);
              }}
            />
            <Label htmlFor={`pcp-${index}`} className="text-sm leading-5">
              {item}
            </Label>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t">
        <Button 
          onClick={handlePcpConfirm}
          disabled={!pcpChecks.every(check => check)}
          className="w-full"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Confirmar Critérios PCP
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {etapa === 1 && "Selecionar Leito"}
            {etapa === 2 && "Checklist PCP"}
            {etapa === 3 && "Confirmar Regulação"}
          </DialogTitle>
          <DialogDescription>
            {paciente && (
              <span>
                Regulando leito para: <strong>{paciente.nomePaciente}</strong>
                {origem && ` • Origem: ${origem.setor} - ${origem.leito}`}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {etapa === 1 && renderSelecaoLeitos()}
          {etapa === 2 && renderChecklistPCP()}
          {etapa === 3 && renderConfirmacao()}
        </div>

        {etapa === 3 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setEtapa(1)}>
              Voltar
            </Button>
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(renderConfirmacao()?.props.children[0].props.children.props.children || '')}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
            <Button onClick={() => onConfirmRegulacao(leitoSelecionado, observacoes)}>
              Confirmar Regulação
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
