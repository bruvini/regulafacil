
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSetores } from '@/hooks/useSetores';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getQuartoId = (codigoLeito: string): string | null => {
    const match = codigoLeito.match(/^(\d+[\s-]?\w*|\w+[\s-]?\d+)\s/);
    return match ? match[1].trim() : null;
};

export const RelatorioVagosModal = ({ open, onOpenChange }: Props) => {
  const { setores } = useSetores();
  const { toast } = useToast();

  const leitosDisponiveis = useMemo(() => {
    const agrupados: Record<string, any[]> = {};
    const todosLeitos = setores.flatMap(s => s.leitos.map(l => ({ ...l, setorNome: s.nomeSetor })));

    setores.forEach(setor => {
      const disponiveisDoSetor = setor.leitos
        .filter(l => ['Vago', 'Higienizacao'].includes(l.statusLeito))
        .map(leito => {
          const quartoId = getQuartoId(leito.codigoLeito);
          let sexoQuarto = 'Misto';
          if (quartoId) {
            const ocupantes = todosLeitos.filter(l => getQuartoId(l.codigoLeito) === quartoId && l.statusLeito === 'Ocupado' && l.dadosPaciente?.sexoPaciente);
            if (ocupantes.length > 0) {
              sexoQuarto = ocupantes[0].dadosPaciente!.sexoPaciente;
            }
          }
          return { ...leito, sexoQuarto: sexoQuarto.charAt(0) };
        });

      if (disponiveisDoSetor.length > 0) {
        agrupados[setor.nomeSetor] = disponiveisDoSetor;
      }
    });
    return agrupados;
  }, [setores]);

  const handleCopy = (setorNome: string, leitos: any[]) => {
    const listaLeitos = leitos.map(l => l.codigoLeito).join(', ');
    const mensagem = `Olá! 👋 Para mantermos nosso painel sempre atualizado, poderiam confirmar a situação dos seguintes leitos no setor *${setorNome}*?\n\n*Leitos para verificação:*\n${listaLeitos}\n\nPor favor, respondam a esta mensagem com o status atual de cada um (Vago, Higienização, Bloqueado, etc.).\n\n_Agradecemos a colaboração!_\n*NIR - Núcleo Interno de Regulação*`;
    navigator.clipboard.writeText(mensagem);
    toast({ title: "Mensagem Copiada!", description: `A mensagem para ${setorNome} foi copiada.` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Relatório de Leitos Disponíveis</DialogTitle>
          <DialogDescription>Lista de todos os leitos vagos ou em higienização, com o sexo do quarto quando aplicável.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0">
          <ScrollArea className="h-full pr-4 -mr-4">
            <div className="space-y-4">
              {Object.entries(leitosDisponiveis).map(([setorNome, leitos]) => (
                <Card key={setorNome}>
                  <CardHeader className="py-2 px-4 flex-row items-center justify-between">
                    <CardTitle className="text-base">{setorNome}</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(setorNome, leitos)}>
                        <Copy className="h-4 w-4 mr-2" /> Copiar Mensagem
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {leitos.map(l => (
                        <li key={l.id}>
                          <strong>{l.codigoLeito}</strong> ({l.sexoQuarto}) - <span className={l.statusLeito === 'Higienizacao' ? 'text-blue-600' : 'text-green-600'}>{l.statusLeito}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
