
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, X, FileText, Clock, User, Calendar } from 'lucide-react';
import { Paciente } from '@/types/hospital';
import { formatarDuracao } from '@/lib/utils';

interface RegulacaoLeitoItemProps {
  paciente: Paciente;
  onConcluir: () => void;
  onCancelar: () => void;
  onObservacoes: () => void;
}

const calcularIdade = (dataNascimento?: string): string => {
  if (!dataNascimento) return '?';
  
  // Tentar diferentes formatos de data
  let dataObj: Date | null = null;
  
  if (dataNascimento.includes('/')) {
    const [dia, mes, ano] = dataNascimento.split('/').map(Number);
    dataObj = new Date(ano, mes - 1, dia);
  } else if (dataNascimento.includes('-')) {
    dataObj = new Date(dataNascimento);
  }
  
  if (!dataObj || isNaN(dataObj.getTime())) return '?';
  
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataObj.getFullYear();
  const m = hoje.getMonth() - dataObj.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < dataObj.getDate())) {
    idade--;
  }
  return idade.toString();
};

export const RegulacaoLeitoItem = ({
  paciente,
  onConcluir,
  onCancelar,
  onObservacoes
}: RegulacaoLeitoItemProps) => {
  const idade = calcularIdade(paciente.dataNascimento);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Informações do Paciente */}
          <div className="flex-grow space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">{paciente.nomeCompleto}</h3>
              <Badge variant="outline">
                {paciente.sexoPaciente?.charAt(0)} - {idade}a
              </Badge>
              {paciente.aguardaUTI && (
                <Badge variant="destructive">
                  Aguarda UTI
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{paciente.especialidadePaciente}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Internado há {formatarDuracao(paciente.dataInternacao)}</span>
              </div>
              {paciente.dataPedidoUTI && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>UTI solicitada: {new Date(paciente.dataPedidoUTI).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 ml-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onObservacoes}>
                    <FileText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver Observações</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onConcluir}>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Concluir Regulação</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onCancelar}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cancelar Regulação</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
