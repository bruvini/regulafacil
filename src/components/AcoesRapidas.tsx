
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Download, ClipboardPaste, Lightbulb, BarChart3, Stethoscope, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AcoesRapidasProps {
  onImportarClick?: () => void;
  onGerarBoletimClick?: () => void;
  onPassagemClick?: () => void;
  onSugestoesClick?: () => void;
  onPanoramaClick?: () => void;
  onRelatorioEspecialidadeClick?: () => void;
  showAllButtons?: boolean;
  sugestoesDisponiveis?: boolean;
  panoramaDisponivel?: boolean;
}

export const AcoesRapidas = ({
  onImportarClick,
  onGerarBoletimClick,
  onPassagemClick,
  onSugestoesClick,
  onPanoramaClick,
  onRelatorioEspecialidadeClick,
  showAllButtons = false,
  sugestoesDisponiveis = false,
  panoramaDisponivel = false
}: AcoesRapidasProps) => {
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        {onImportarClick && (
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
        )}

        {onGerarBoletimClick && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onGerarBoletimClick}
              >
                <Newspaper className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Gerar Boletim Diário</p>
            </TooltipContent>
          </Tooltip>
        )}

        {onRelatorioEspecialidadeClick && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onRelatorioEspecialidadeClick}
              >
                <Stethoscope className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ocupação por Especialidade</p>
            </TooltipContent>
          </Tooltip>
        )}

        {showAllButtons && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onPassagemClick}
                >
                  <ClipboardPaste className="h-4 w-4" />
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

            {panoramaDisponivel && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onPanoramaClick}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Panorama Atual</p>
                </TooltipContent>
              </Tooltip>
            )}
          </>
        )}
      </TooltipProvider>
    </div>
  );
};
