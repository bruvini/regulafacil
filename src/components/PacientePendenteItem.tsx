import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  UserCheck, 
  Edit, 
  X, 
  LogOut,
  Clock,
  MapPin,
  User,
  Calendar
} from 'lucide-react';
import { Paciente } from '@/types/paciente';

interface PacientePendenteItemProps {
  paciente: Paciente & {
    setorOrigem: string;
    siglaSetorOrigem: string;
    leitoCodigo: string;
    leitoId: string;
    statusLeito: string;
    regulacao?: any;
  };
  onRegularClick: () => void;
  onEditarClick: () => void;
  onCancelarClick: () => void;
  onConcluir: () => void;
  onAlterar: () => void;
  onCancelar: () => void;
  onAltaDireta: (paciente: any) => void;
}

export const PacientePendenteItem = ({
  paciente,
  onRegularClick,
  onEditarClick,
  onCancelarClick,
  onConcluir,
  onAlterar,
  onCancelar,
  onAltaDireta
}: PacientePendenteItemProps) => {
  return (
    <Card className="w-full">
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Informações do Paciente */}
        <div>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <h3 className="text-lg font-semibold">{paciente.nome}</h3>
          </div>
          <div className="text-sm text-gray-500">
            <p>
              <Calendar className="inline-block h-4 w-4 mr-1" />
              Nascimento: {new Date(paciente.dataNascimento).toLocaleDateString()}
            </p>
            <p>
              <MapPin className="inline-block h-4 w-4 mr-1" />
              Setor de Origem: {paciente.setorOrigem} ({paciente.siglaSetorOrigem})
            </p>
            <p>
              <Clock className="inline-block h-4 w-4 mr-1" />
              Leito: {paciente.leitoCodigo}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onRegularClick}>
                  <UserCheck className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Regular Paciente</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onEditarClick}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar Paciente</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onCancelarClick}>
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cancelar Paciente</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onAltaDireta(paciente)}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Alta Direta</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};
