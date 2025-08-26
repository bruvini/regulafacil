import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface RelatorioEspecialidadeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dadosOcupacao: Record<string, number>;
}

export const RelatorioEspecialidadeModal = ({ open, onOpenChange, dadosOcupacao }: RelatorioEspecialidadeModalProps) => {
  const entries = Object.entries(dadosOcupacao).sort(([a], [b]) => a.localeCompare(b));

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
          {entries.length > 0 ? (
            <ul className="space-y-2">
              {entries.map(([especialidade, contagem]) => (
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
      </DialogContent>
    </Dialog>
  );
};

