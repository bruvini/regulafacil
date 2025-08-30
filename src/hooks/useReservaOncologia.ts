import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ReservaOncologia, TentativaContato } from '@/types/reservaOncologia';
import { toast } from '@/hooks/use-toast';

export const useReservaOncologia = () => {
  const [reservas, setReservas] = useState<ReservaOncologia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'reservaOncologia'),
      where('status', '==', 'aguardando')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ReservaOncologia[];
      setReservas(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const adicionarReserva = async (data: Omit<ReservaOncologia, 'id' | 'status' | 'tentativasContato'>) => {
    try {
      await addDoc(collection(db, 'reservaOncologia'), {
        ...data,
        status: 'aguardando',
        tentativasContato: [],
      });
      toast({ title: 'Sucesso!', description: 'Reserva adicionada.' });
    } catch (err) {
      console.error('Erro ao adicionar reserva:', err);
      toast({ title: 'Erro', description: 'Não foi possível adicionar a reserva.', variant: 'destructive' });
    }
  };

  const atualizarReserva = async (id: string, data: Partial<ReservaOncologia>) => {
    try {
      await updateDoc(doc(db, 'reservaOncologia', id), data);
      toast({ title: 'Sucesso!', description: 'Reserva atualizada.' });
    } catch (err) {
      console.error('Erro ao atualizar reserva:', err);
      toast({ title: 'Erro', description: 'Não foi possível atualizar a reserva.', variant: 'destructive' });
    }
  };

  const excluirReserva = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reservaOncologia', id));
      toast({ title: 'Sucesso!', description: 'Reserva excluída.' });
    } catch (err) {
      console.error('Erro ao excluir reserva:', err);
      toast({ title: 'Erro', description: 'Não foi possível excluir a reserva.', variant: 'destructive' });
    }
  };

  const registrarTentativaContato = async (id: string, tentativa: TentativaContato) => {
    try {
      await updateDoc(doc(db, 'reservaOncologia', id), {
        tentativasContato: arrayUnion(tentativa),
      });
    } catch (err) {
      console.error('Erro ao registrar tentativa de contato:', err);
    }
  };

  const marcarComoInternado = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reservaOncologia', id), { status: 'internado' });
    } catch (err) {
      console.error('Erro ao marcar como internado:', err);
    }
  };

  return {
    reservas,
    loading,
    adicionarReserva,
    atualizarReserva,
    excluirReserva,
    registrarTentativaContato,
    marcarComoInternado,
  };
};
