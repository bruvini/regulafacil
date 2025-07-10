
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DurationDisplayProps {
  dataAtualizacaoStatus: string;
}

const DurationDisplay = ({ dataAtualizacaoStatus }: DurationDisplayProps) => {
  const [duration, setDuration] = useState('Calculando...');

  useEffect(() => {
    const updateDuration = () => {
      // 1. VERIFICAÇÃO DE SEGURANÇA: Checa se a data é válida antes de usar.
      if (!dataAtualizacaoStatus) {
        setDuration('N/A');
        return;
      }

      try {
        const updateDate = new Date(dataAtualizacaoStatus);

        // 2. VERIFICAÇÃO ADICIONAL: Checa se a data criada é um objeto de data válido.
        if (isNaN(updateDate.getTime())) {
          setDuration('Data inválida');
          return;
        }

        const formattedDuration = formatDistanceToNow(updateDate, {
          addSuffix: true,
          locale: ptBR
        });
        setDuration(formattedDuration);

      } catch (error) {
        console.error("Erro ao formatar data no DurationDisplay:", error);
        setDuration('Erro na data');
      }
    };

    updateDuration();

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
