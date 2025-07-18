// src/hooks/usePacientes.ts

import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
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

  // Funções para criar, atualizar e excluir pacientes serão chamadas
  // pela lógica de sincronização no componente principal.
  // Por enquanto, o hook se concentra em fornecer a lista atual de pacientes.

  return {
    pacientes,
    loading,
  };
};