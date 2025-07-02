import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DurationDisplayProps {
  dataAtualizacaoStatus: string;
}

const DurationDisplay = ({ dataAtualizacaoStatus }: DurationDisplayProps) => {
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const updateDuration = () => {
      try {
        const updateDate = new Date(dataAtualizacaoStatus);
        const formattedDuration = formatDistanceToNow(updateDate, {
          addSuffix: true,
          locale: ptBR
        });
        setDuration(formattedDuration);
      } catch (error) {
        setDuration('Data inválida');
      }
    };

    // Update immediately
    updateDuration();

    // Update every minute
    const interval = setInterval(updateDuration, 60000);

    return () => clearInterval(interval);
  }, [dataAtualizacaoStatus]);

  return (
    <span className="text-xs text-muted-foreground">
      {duration}
    </span>
  );
};

export default DurationDisplay;