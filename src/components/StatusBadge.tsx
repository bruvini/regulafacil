
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'Vago' | 'Ocupado' | 'Bloqueado' | 'Higienizacao' | 'Regulado' | 'Reservado';
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
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
      case 'Regulado':
        return {
          variant: 'secondary' as const,
          className: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case 'Reservado':
        return {
          variant: 'secondary' as const,
          className: 'bg-teal-100 text-teal-800 border-teal-200'
        };
      default:
        return {
          variant: 'outline' as const,
          className: ''
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={config.className}>
      {status}
    </Badge>
  );
};

export default StatusBadge;
