
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Paciente } from '@/types/hospital';
import { useToast } from '@/hooks/use-toast';

export const usePacientes = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'pacientesRegulaFacil'), orderBy('nomeCompleto'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const pacientesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Paciente[];
        setPacientes(pacientesData);
        setLoading(false);
      }, 
      (error) => {
        console.error('Erro ao buscar pacientes:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados dos pacientes.",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  return { pacientes, loading };
};
