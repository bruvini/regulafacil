import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { CalendarDays, MapPin, Users, FileText, Calendar, Clock, UserCheck, AlertTriangle, Bed, Shield, Activity, Heart } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { LeitoEnriquecido } from '@/types/hospital';

interface LeitoCardProps {
  leito: LeitoEnriquecido;
  todosLeitosDoSetor: LeitoEnriquecido[];
  actions: any;
}

const LeitoCard = ({ leito, todosLeitosDoSetor, actions }: LeitoCardProps) => {
  const ocupacaoRecente = useMemo(() => {
    if (!leito.dadosPaciente) return null;

    return formatDistanceToNow(new Date(leito.dadosPaciente.dataInternacao), {
      addSuffix: true,
      locale: ptBR,
    });
  }, [leito.dadosPaciente]);

  const hasOtherOccupiedLeitos = useMemo(() => {
    return todosLeitosDoSetor.some(otherLeito => 
      otherLeito.statusLeito === 'Ocupado' && 
      otherLeito.id !== leito.id
    );
  }, [todosLeitosDoSetor, leito.id]);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">{leito.codigoLeito}</div>
          {leito.leitoPCP && (
            <Badge variant="outline">PCP</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Status: {leito.statusLeito}
        </div>
        {leito.dadosPaciente && (
          <>
            <Separator className="my-2" />
            <div className="text-xs">
              Paciente: {leito.dadosPaciente.nomeCompleto}
            </div>
            <div className="text-xs text-muted-foreground">
              Internado {ocupacaoRecente}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LeitoCard;
