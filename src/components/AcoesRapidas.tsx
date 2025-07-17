
// src/components/AcoesRapidas.tsx

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Download } from 'lucide-react';

interface AcoesRapidasProps {
  onImportarClick: () => void;
}

export const AcoesRapidas = ({ onImportarClick }: AcoesRapidasProps) => {
  return (
    <div className="flex justify-end">
      <Card className="shadow-card border border-border/50">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onImportarClick}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Importar pacientes MV</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
};
