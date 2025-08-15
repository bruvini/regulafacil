
import { useState, useEffect } from 'react';
import { formatarDuracao } from '@/lib/utils';

interface DurationDisplayProps {
  dataAtualizacaoStatus: string;
}

const DurationDisplay = ({ dataAtualizacaoStatus }: DurationDisplayProps) => {
  const [duration, setDuration] = useState(() => formatarDuracao(dataAtualizacaoStatus));

  useEffect(() => {
    // Só atualiza se a data é válida
    if (!dataAtualizacaoStatus) {
      setDuration('N/A');
      return;
    }

    // Atualiza imediatamente
    setDuration(formatarDuracao(dataAtualizacaoStatus));

    // Atualiza a cada minuto
    const interval = setInterval(() => {
      setDuration(formatarDuracao(dataAtualizacaoStatus));
    }, 60000);

    return () => clearInterval(interval);
  }, [dataAtualizacaoStatus]);

  return <span className="text-xs text-muted-foreground">{duration}</span>;
};

export default DurationDisplay;
