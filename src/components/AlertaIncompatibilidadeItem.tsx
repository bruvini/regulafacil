
import { AlertaIncompatibilidade } from '@/hooks/useAlertasIsolamento';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export const AlertaIncompatibilidadeItem = ({ alerta }: { alerta: AlertaIncompatibilidade }) => (
    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
        <div>
            <p className="font-bold text-sm text-amber-900 flex items-center">
              {alerta.nomePaciente}
              <Badge
                variant={alerta.status === 'suspeita' ? 'destructive' : 'secondary'}
                className="ml-2"
              >
                {alerta.status === 'suspeita' ? 'SUSPEITO' : 'CONFIRMADO'}
              </Badge>
            </p>
            <p className="text-xs text-amber-800">{alerta.setorNome} - {alerta.leitoCodigo}</p>
            <p className="text-xs mt-1 text-amber-700">{alerta.motivo}</p>
        </div>
    </div>
);
