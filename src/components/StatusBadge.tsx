
import { Badge } from '@/components/ui/badge';
import { HistoricoStatus } from '@/types/hospital';

interface StatusBadgeProps {
  historicoStatus: HistoricoStatus[];
}

const StatusBadge = ({ historicoStatus }: StatusBadgeProps) => {
  const statusAtual = historicoStatus[historicoStatus.length - 1]?.status || 'Vago';

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Vago':
        return {
          variant: 'secondary' as const,
          className: 'bg-medical-success/10 text-medical-success border-medical-success/20'
        };
      case 'Ocupado':
        return {
          variant: 'destructive' as const,
          className: 'bg-medical-danger/10 text-medical-danger border-medical-danger/20'
        };
      case 'Bloqueado':
        return {
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'Higienizacao':
        return {
          variant: 'outline' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      default:
        return {
          variant: 'outline' as const,
          className: ''
        };
    }
  };

  const config = getStatusConfig(statusAtual);

  return (
    <Badge variant={config.variant} className={config.className}>
      {statusAtual}
    </Badge>
  );
};

export default StatusBadge;
