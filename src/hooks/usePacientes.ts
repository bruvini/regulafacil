
// src/hooks/usePacientes.ts

import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Paciente } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';

export const usePacientes = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A consulta é na nova coleção 'pacientesRegulaFacil'
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
        title: "Erro de Conexão",
        description: "Não foi possível carregar os dados dos pacientes.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const criarPacienteManual = async (dadosPaciente: Omit<Paciente, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'pacientesRegulaFacil'), dadosPaciente);
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar paciente manualmente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o paciente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    pacientes,
    loading,
    criarPacienteManual,
  };
};
