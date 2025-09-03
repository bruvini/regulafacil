import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RelatorioEspecialidadeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dadosOcupacao: Record<string, number>;
}

export const RelatorioEspecialidadeModal = ({ open, onOpenChange, dadosOcupacao }: RelatorioEspecialidadeModalProps) => {
  const { toast } = useToast();

  const especialidadesContagemOrdenada = useMemo(() => {
    const contagemAgrupada = Object.entries(dadosOcupacao).reduce(
      (acc, [esp, contagem]) => {
        let especialidade = esp;
        if (especialidade === 'BUCOMAXILO') {
          especialidade = 'ODONTOLOGIA C.TRAUM.B.M.F.';
        } else if (especialidade === 'INTENSIVISTA') {
          especialidade = 'CLINICA GERAL';
        }
        acc[especialidade] = (acc[especialidade] || 0) + contagem;
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.entries(contagemAgrupada).sort(([a], [b]) => a.localeCompare(b));
  }, [dadosOcupacao]);

  const handleCopiar = () => {
    const textoLista = especialidadesContagemOrdenada
      .map(([especialidade, contagem]) => `${especialidade}: ${contagem}`)
      .join('\n');

    const textoCompleto = `Ocupação por Especialidade\nQuantidade de pacientes internados por especialidade.\n\n${textoLista}`;

    navigator.clipboard
      .writeText(textoCompleto)
      .then(() => {
        toast({
          title: 'Copiado!',
          description: 'O relatório de ocupação foi copiado para a área de transferência.',
        });
      })
      .catch((err) => {
        console.error('Erro ao copiar texto: ', err);
        toast({
          title: 'Erro',
          description: 'Não foi possível copiar o relatório.',
          variant: 'destructive',
        });
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ocupação por Especialidade</DialogTitle>
          <DialogDescription>
            Quantidade de pacientes internados por especialidade.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-72 pr-4">
          {especialidadesContagemOrdenada.length > 0 ? (
            <ul className="space-y-2">
              {especialidadesContagemOrdenada.map(([especialidade, contagem]) => (
                <li key={especialidade} className="flex items-center justify-between">
                  <span>{especialidade}</span>
                  <Badge variant="secondary">{contagem}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Sem internações</p>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={handleCopiar}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar
          </Button>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

