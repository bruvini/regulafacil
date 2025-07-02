import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'Vago' | 'Ocupado' | 'Bloqueado' | 'Higienização';
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
          className: 'bg-medical-warning/10 text-medical-warning border-medical-warning/20'
        };
      case 'Higienização':
        return {
          variant: 'outline' as const,
          className: 'bg-medical-accent/10 text-medical-accent border-medical-accent/20'
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