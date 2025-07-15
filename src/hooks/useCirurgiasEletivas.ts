
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SolicitacaoCirurgica } from '@/types/hospital';
import { startOfTomorrow, startOfToday, endOfTomorrow } from 'date-fns';

export const useCirurgiasEletivas = () => {
  const [cirurgias, setCirurgias] = useState<SolicitacaoCirurgica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hoje = startOfToday();
    const fimAmanha = endOfTomorrow();

    const q = query(
      collection(db, 'cirurgiasRegulaFacil'),
      where('dataPrevistaInternacao', '>=', hoje),
      where('dataPrevistaInternacao', '<=', fimAmanha)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const cirurgiasCarregadas: SolicitacaoCirurgica[] = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as SolicitacaoCirurgica))
        .filter(cirurgia => !cirurgia.leitoReservado);
      
      setCirurgias(cirurgiasCarregadas);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { cirurgias, loading };
};
