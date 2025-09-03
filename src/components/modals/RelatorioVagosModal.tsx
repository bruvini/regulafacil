import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSetores } from '@/hooks/useSetores';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { determinarSexoLeito, getQuartoId } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RelatorioVagosModal = ({ open, onOpenChange }: Props) => {
  const { setores } = useSetores();
  const { toast } = useToast();

  const leitosDisponiveis = useMemo(() => {
    const agrupados: Record<string, any[]> = {};
    const todosLeitos = setores.flatMap(s => s.leitos.map(l => ({ ...l, setorNome: s.nomeSetor })));
    const setoresExcluidos = ["PS DECISÃO CLINICA", "CC - SALAS CIRURGICAS", "CC3", "CC - PRE OPERATORIO", "PS DECISÃO CIRURGICA", "CC - RECUPERAÇÃO", "UNID. DE AVC - INTEGRAL", "SALA LARANJA", "CCA PRE - OPERATORIO", "UNID. AVC AGUDO", "CCA - SALAS CIRURGICAS"];

    setores.forEach(setor => {
        if (setoresExcluidos.includes(setor.nomeSetor)) return;

        const disponiveisDoSetor = setor.leitos
            .filter(l => ['Vago', 'Higienizacao'].includes(l.statusLeito))
            .map(leito => {
                const quartoId = getQuartoId(leito.codigoLeito);
                const ocupantes = todosLeitos.filter(l =>
                    getQuartoId(l.codigoLeito) === quartoId &&
                    l.statusLeito === 'Ocupado' &&
                    l.dadosPaciente
                );

                const bloqueioCoorte = ocupantes.length > 0
                    ? ocupantes[0].dadosPaciente?.isolamentosVigentes
                        ?.map(i => i.sigla)
                        .join(', ') || ''
                    : '';

                const sexoCompativel = determinarSexoLeito(leito, todosLeitos);

                return { ...leito, sexo: sexoCompativel, bloqueioCoorte };
            }).sort((a, b) => a.codigoLeito.localeCompare(b.codigoLeito));

        if (disponiveisDoSetor.length > 0) {
            agrupados[setor.nomeSetor] = disponiveisDoSetor;
        }
    });
    return agrupados;
  }, [setores]);

  const handleCopy = (setorNome: string, leitos: any[]) => {
    const listaLeitos = leitos.map(l => l.codigoLeito).join(', ');
    const mensagem = `*Disponibilidade de Leitos - ${setorNome}* 🏥\n\nOlá! Para mantermos nosso painel sempre atualizado, poderiam nos ajudar com a situação dos seguintes leitos?\n\n*Leitos para Verificação:*\n${listaLeitos}\n\n*Por favor, responder esta mensagem com:*\n1. O status atual de cada leito acima (Vago, Higienização, Bloqueado, etc.).\n2. Informar as altas previstas e suas pendências.\n3. Sinalizar outros leitos que estejam vagos mas não foram listados.\n\n_Sua colaboração é essencial para o fluxo do hospital!_`;
    navigator.clipboard.writeText(mensagem);
    toast({ title: "Mensagem Copiada!", description: `A mensagem para ${setorNome} foi copiada.` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Relatório de Leitos Disponíveis</DialogTitle>
          <DialogDescription>Lista de todos os leitos vagos ou em higienização, com o sexo do quarto quando aplicável.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0">
          <ScrollArea className="h-full pr-4 -mr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(leitosDisponiveis).map(([setorNome, leitos]) => (
                <div key={setorNome} className="break-inside-avoid">
                  <Card>
                    <CardHeader className="py-2 px-4 flex-row items-center justify-between">
                      <CardTitle className="text-base">{setorNome}</CardTitle>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => handleCopy(setorNome, leitos)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>Copiar Mensagem</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <ul className="space-y-1 text-sm">
                        {leitos.map(l => (
                          <li key={l.id}>
                            <strong>{l.codigoLeito}</strong> ({l.sexo}) -
                            {l.bloqueioCoorte ?
                              <span className="font-semibold text-amber-600"> Bloqueado ({l.bloqueioCoorte})</span> :
                              <span className={l.statusLeito === 'Higienizacao' ? 'text-blue-600' : 'text-green-600'}> {l.statusLeito}</span>
                            }
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
