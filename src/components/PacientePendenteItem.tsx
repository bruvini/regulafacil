
// src/components/PacientePendenteItem.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Biohazard, Clock, CheckCircle, LogOut, Edit, X } from 'lucide-react';
import { formatarDuracao } from '@/lib/utils';
import { Paciente, IsolamentoVigente } from '@/types/hospital';

interface PacientePendenteItemProps {
  paciente: Paciente;
  onRegularClick: (paciente: Paciente) => void;
  onAlta?: (paciente: Paciente) => void;
  onConcluir?: (paciente: Paciente) => void;
  onAlterar?: (paciente: Paciente) => void;
  onCancelar?: (paciente: Paciente) => void;
  onAltaDireta?: (paciente: any) => void;
}

const calcularIdade = (dataNascimento?: string): string => {
  if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return '?';
  const [dia, mes, ano] = dataNascimento.split('/').map(Number);
  let idade = new Date().getFullYear() - ano;
  const m = new Date().getMonth() - (mes - 1);
  if (m < 0 || (m === 0 && new Date().getDate() < dia)) idade--;
  return idade.toString();
};

export const PacientePendenteItem = ({ 
  paciente, 
  onRegularClick, 
  onAlta,
  onConcluir,
  onAlterar,
  onCancelar,
  onAltaDireta
}: PacientePendenteItemProps) => {
  const idade = calcularIdade(paciente.dataNascimento);

  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border">
      
      {/* Coluna da Esquerda: Informações do Paciente */}
      <div className="flex-grow min-w-0">
        
        {/* Linha 1: Nome, Idade/Sexo e Alerta de Isolamento */}
        <div className="flex items-center gap-2">
          <p className="font-bold text-base truncate" title={paciente.nomeCompleto}>
            {paciente.nomeCompleto}
          </p>
          <Badge variant="outline" className="text-xs flex-shrink-0">
            {paciente.sexoPaciente?.charAt(0)} - {idade}a
          </Badge>
          
          {/* Badge de Isolamento Condicional */}
          {paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="destructive" className="cursor-help flex-shrink-0">
                    <Biohazard className="h-4 w-4" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-bold">Isolamentos Ativos:</p>
                  <ul className="list-disc list-inside">
                    {paciente.isolamentosVigentes.map((iso: IsolamentoVigente, index: number) => (
                      <li key={index}>- {iso.sigla}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Linha 2: Especialidade e Tempo de Internação */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          <span>{paciente.especialidadePaciente}</span>
          <span className="text-gray-400">•</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatarDuracao(paciente.dataInternacao)}</span>
          </div>
        </div>

      </div>

      {/* Coluna da Direita: Botões de Ação */}
      <div className="flex items-center flex-shrink-0 gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => onRegularClick(paciente)}>
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Regular Paciente</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {onAlta && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onAlta(paciente)}>
                  <LogOut className="h-5 w-5 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Dar Alta</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {onConcluir && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onConcluir(paciente)}>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Concluir</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {onAlterar && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onAlterar(paciente)}>
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Alterar</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {onCancelar && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onCancelar(paciente)}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Cancelar</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
