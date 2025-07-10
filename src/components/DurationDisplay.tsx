
import { useState, useEffect } from 'react';
import { formatarDuracao } from '@/lib/utils';

interface DurationDisplayProps {
  dataAtualizacaoStatus: string;
}

const DurationDisplay = ({ dataAtualizacaoStatus }: DurationDisplayProps) => {
  const [duration, setDuration] = useState(() => formatarDuracao(dataAtualizacaoStatus));

  useEffect(() => {
    // Atualiza a cada minuto
    const interval = setInterval(() => {
      setDuration(formatarDuracao(dataAtualizacaoStatus));
    }, 60000);

    return () => clearInterval(interval);
  }, [dataAtualizacaoStatus]);

  return <span className="text-xs text-muted-foreground">{duration}</span>;
};

export default DurationDisplay;
