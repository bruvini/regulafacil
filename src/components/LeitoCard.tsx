
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLeitos } from '@/hooks/useLeitos';
import { LeitoEnriquecido } from '@/pages/MapaLeitos';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface LeitoCardProps {
  leito: LeitoEnriquecido;
  todosLeitosDoSetor: LeitoEnriquecido[];
  actions: any;
}

const LeitoCard = ({ leito, todosLeitosDoSetor, actions }: LeitoCardProps) => {
  const { toast } = useToast();
  const { atualizarStatusLeito } = useLeitos();

  const getCardBg = () => {
    switch (leito.statusLeito) {
      case 'Ocupado':
        return 'bg-red-100';
      case 'Reservado':
        return 'bg-blue-100';
      case 'Regulado':
        return 'bg-purple-100';
      case 'Higienizacao':
        return 'bg-yellow-100';
      case 'Bloqueado':
        return 'bg-gray-200';
      default:
        return 'bg-green-100';
    }
  };

  const getBorderColor = () => {
    switch (leito.statusLeito) {
      case 'Ocupado':
        return 'border-red-400';
      case 'Reservado':
        return 'border-blue-400';
      case 'Regulado':
        return 'border-purple-400';
      case 'Higienizacao':
        return 'border-yellow-400';
      case 'Bloqueado':
        return 'border-gray-400';
      default:
        return 'border-green-400';
    }
  };

  const handleBloquear = async (setorId: string, leitoId: string) => {
    try {
      await atualizarStatusLeito(leitoId, "Bloqueado", {
        motivoBloqueio: "Manutenção",
      });
      toast({
        title: "Sucesso",
        description: "Leito bloqueado para manutenção.",
      });
    } catch (error) {
      console.error("Erro ao bloquear leito:", error);
      toast({
        title: "Erro",
        description: "Não foi possível bloquear o leito.",
        variant: "destructive",
      });
    }
  };

  const handleLimpeza = async (setorId: string, leitoId: string) => {
    try {
      await atualizarStatusLeito(leitoId, "Higienizacao");
      toast({
        title: "Sucesso",
        description: "Leito marcado para limpeza.",
      });
    } catch (error) {
      console.error("Erro ao marcar leito para limpeza:", error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar o leito para limpeza.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    switch (leito.statusLeito) {
      case 'Vago':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Vago</Badge>;
      case 'Ocupado':
        return <Badge variant="destructive">Ocupado</Badge>;
      case 'Reservado':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">Reservado</Badge>;
      case 'Regulado':
        return <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-300">Regulado</Badge>;
      case 'Higienizacao':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Higienização</Badge>;
      case 'Bloqueado':
        return <Badge variant="destructive">Bloqueado</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <Card className={`${getCardBg()} border-2 ${getBorderColor()} transition-all duration-200`}>
      <CardContent className="p-3 space-y-3">
        {/* Cabeçalho com código do leito e ações */}
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold text-sm">{leito.codigoLeito}</h4>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge()}
            </div>
          </div>
          
          {/* Ações do leito */}
          <div className="flex gap-1">
            {leito.statusLeito === 'Vago' && (
              <>
                {/* Novo ícone para adicionar paciente */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => actions.onAdicionarPaciente?.(leito)}
                  className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                  title="Adicionar Paciente"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
                
                {/* Bloquear leito */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => actions.onBloquear(leito.setorId, leito.id)}
                  className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                  title="Bloquear Leito"
                >
                  <Lock className="h-3.5 w-3.5" />
                </Button>

                {/* Limpeza */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => actions.onLimpeza(leito.setorId, leito.id)}
                  className="h-7 w-7 p-0 hover:bg-yellow-50 hover:text-yellow-600"
                  title="Marcar para Limpeza"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </Button>
              </>
            )}

            {leito.statusLeito === 'Higienizacao' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => atualizarStatusLeito(leito.id, "Vago")}
                className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600"
                title="Liberar Leito"
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </Button>
            )}

            {leito.statusLeito === 'Bloqueado' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => atualizarStatusLeito(leito.id, "Vago")}
                className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600"
                title="Liberar Leito"
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </Button>
            )}

            {leito.statusLeito === 'Ocupado' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => actions.onDesocupar(leito.setorId, leito.id)}
                className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600"
                title="Desocupar Leito"
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Informações adicionais do leito */}
        <div>
          {leito.statusLeito === 'Ocupado' && leito.paciente && (
            <>
              <p className="text-xs text-muted-foreground">
                Paciente: {leito.paciente.nomeCompleto}
              </p>
              <p className="text-xs text-muted-foreground">
                Especialidade: {leito.paciente.especialidadePaciente}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeitoCard;
