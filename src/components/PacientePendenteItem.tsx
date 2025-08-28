
import React from 'react';
import { Paciente } from '@/types/hospital';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Biohazard, Clock } from 'lucide-react';
import { formatarDuracao } from '@/lib/utils';

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
  onAlta?: () => void;
  onConcluir: (paciente: Paciente) => void;
  onAlterar: (paciente: Paciente) => void;
  onCancelar: (paciente: Paciente) => void;
  onAltaDireta?: (paciente: any) => void;
}

export const PacientePendenteItem = ({ 
  paciente, 
  onRegularClick,
  onAlta,
  onConcluir,
  onAlterar,
  onCancelar,
  onAltaDireta
}: PacientePendenteItemProps) => {
  
  // Função para calcular idade
  const calcularIdade = (dataNascimento: string): string => {
    if (!dataNascimento) return 'N/A';
    
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    
    if (isNaN(nascimento.getTime())) return 'N/A';
    
    const diffMs = hoje.getTime() - nascimento.getTime();
    const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    
    return diffYears.toString();
  };

  const idade = calcularIdade(paciente.dataNascimento);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border">
      {/* Coluna da Esquerda: Informações do Paciente */}
      <div className="flex flex-col gap-1">
        
        {/* Linha 1: Nome, Idade/Sexo e Alerta de Isolamento */}
        <div className="flex items-center gap-2">
          <p className="font-bold text-md text-foreground">
            {paciente.nomeCompleto}
          </p>
          <Badge variant="outline" className="text-xs">
            {paciente.sexoPaciente?.charAt(0)} - {idade}a
          </Badge>
          
          {/* Badge de Isolamento Condicional */}
          {paciente.isolamentosVigentes && paciente.isolamentosVigentes.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="destructive" className="cursor-help">
                    <Biohazard className="h-4 w-4" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-bold">Isolamentos Ativos:</p>
                  <ul>
                    {paciente.isolamentosVigentes.map((iso, index) => (
                      <li key={index}>- {iso.sigla}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Linha 2: Especialidade e Tempo de Internação */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{paciente.especialidadePaciente}</span>
          <span className="text-gray-400">•</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatarDuracao(paciente.dataInternacao)}</span>
          </div>
        </div>

      </div>

      {/* Coluna da Direita: Botões de Ação */}
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={onAlta}
        >
          Dar Alta
        </Button>
        <Button
          size="sm"
          onClick={onRegularClick}
        >
          Regular
        </Button>
      </div>
    </div>
  );
};

export default PacientePendenteItem;
