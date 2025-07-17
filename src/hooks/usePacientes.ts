// src/hooks/usePacientes.ts

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Paciente } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';

export const usePacientes = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'pacientesRegulaFacil'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pacientesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Paciente[];
      setPacientes(pacientesData);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao buscar pacientes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos pacientes.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- Funções de manipulação de pacientes serão adicionadas aqui ---
  // Ex: criarPaciente, moverPaciente, darAltaPaciente, etc.

  return {
    pacientes,
    loading,
  };
};