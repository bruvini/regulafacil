
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Download, FileText, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AcoesRapidasProps {
  onImportarClick: () => void;
  onPassagemClick?: () => void;
  onSugestoesClick?: () => void;
  showAllButtons?: boolean;
  sugestoesDisponiveis?: boolean;
}

export const AcoesRapidas = ({ 
  onImportarClick, 
  onPassagemClick, 
  onSugestoesClick,
  showAllButtons = false,
  sugestoesDisponiveis = false
}: AcoesRapidasProps) => {
  return (
    <div className="flex items-center gap-2">
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

        {showAllButtons && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onPassagemClick}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Gerar Passagem de Plantão</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onSugestoesClick}
                  disabled={!sugestoesDisponiveis}
                  className={cn(
                    sugestoesDisponiveis && "animate-pulse bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700"
                  )}
                >
                  <Lightbulb className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver Sugestões de Regulação</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </TooltipProvider>
    </div>
  );
};
