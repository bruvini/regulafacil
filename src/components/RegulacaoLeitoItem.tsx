
import React from 'react';
import { Paciente } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Biohazard, Clock } from 'lucide-react';
import { formatarDuracao } from '@/lib/utils';

interface RegulacaoLeitoItemProps {
  paciente: Paciente;
  onRegular: () => void;
  isActing: boolean;
}

export const RegulacaoLeitoItem = ({ paciente, onRegular, isActing }: RegulacaoLeitoItemProps) => {
  // Calcular idade
  const calcularIdade = (dataNascimento: string | Date): number => {
    const nascimento = typeof dataNascimento === 'string' ? new Date(dataNascimento) : dataNascimento;
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  const idade = calcularIdade(paciente.dataNascimento || new Date());

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

      {/* Coluna da Direita: Botão de Ação */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onRegular}
          disabled={isActing}
        >
          {isActing ? 'Regulando...' : 'Regular'}
        </Button>
      </div>
    </div>
  );
};

export default RegulacaoLeitoItem;
