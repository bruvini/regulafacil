
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Download, FileText, Lightbulb } from 'lucide-react';

interface AcoesRapidasProps {
  onImportarClick: () => void;
  onPassagemClick?: () => void;
  onSugestoesClick?: () => void;
  showAllButtons?: boolean;
}

export const AcoesRapidas = ({ 
  onImportarClick, 
  onPassagemClick, 
  onSugestoesClick,
  showAllButtons = false 
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
