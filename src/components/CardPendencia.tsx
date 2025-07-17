
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, MoreHorizontal, Clock, User } from 'lucide-react';
import { Pendencia } from '@/types/huddle';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CardPendenciaProps {
  pendencia: Pendencia;
  onStatusChange: (pendenciaId: string, novoStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'RESOLVIDO') => void;
  onOpenDetails: (pendencia: Pendencia) => void;
}

export const CardPendencia = ({ pendencia, onStatusChange, onOpenDetails }: CardPendenciaProps) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'ALTA_PROLONGADA':
        return 'bg-red-100 text-red-800';
      case 'VAGA_UTI':
        return 'bg-orange-100 text-orange-800';
      case 'SISREG':
        return 'bg-blue-100 text-blue-800';
      case 'INTERNACAO_PROLONGADA':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (categoria: string) => {
    switch (categoria) {
      case 'ALTA_PROLONGADA':
        return 'Alta Prolongada';
      case 'VAGA_UTI':
        return 'Vaga UTI';
      case 'SISREG':
        return 'SISREG';
      case 'INTERNACAO_PROLONGADA':
        return 'Internação Prolongada';
      default:
        return 'Outros';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'border-l-red-500';
      case 'EM_ANDAMENTO':
        return 'border-l-yellow-500';
      case 'RESOLVIDO':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const handleStatusClick = (e: React.MouseEvent, novoStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'RESOLVIDO') => {
    e.stopPropagation();
    onStatusChange(pendencia.id, novoStatus);
  };

  return (
    <Card 
      className={`hover:shadow-md cursor-pointer transition-all duration-200 border-l-4 ${getStatusColor(pendencia.status)}`}
      onClick={() => onOpenDetails(pendencia)}
    >
      <CardHeader className="p-3">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {pendencia.titulo}
          </h3>
          <Badge className={`text-xs ${getCategoryColor(pendencia.categoria)}`}>
            {getCategoryLabel(pendencia.categoria)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {pendencia.descricao}
        </p>
        
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getInitials(pendencia.responsavel.nome)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">
              {pendencia.responsavel.nome}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {pendencia.comentarios?.length || 0}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(pendencia.dataCriacao, { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </div>

          <div className="flex gap-1">
            {pendencia.status !== 'PENDENTE' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={(e) => handleStatusClick(e, 'PENDENTE')}
              >
                Pendente
              </Button>
            )}
            {pendencia.status !== 'EM_ANDAMENTO' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={(e) => handleStatusClick(e, 'EM_ANDAMENTO')}
              >
                Andamento
              </Button>
            )}
            {pendencia.status !== 'RESOLVIDO' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={(e) => handleStatusClick(e, 'RESOLVIDO')}
              >
                Resolver
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
