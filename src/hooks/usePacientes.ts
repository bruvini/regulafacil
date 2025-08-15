
import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Paciente } from '@/types/hospital';
import { toast } from '@/hooks/use-toast';
import { reconciliarPacientesComPlanilha, PacientePlanilha, ImportacaoResumo } from '@/services/importacaoPacientes';

export const usePacientes = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A consulta é na nova coleção 'pacientesRegulaFacil'
    const q = query(collection(db, 'pacientesRegulaFacil'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Transforma todos os documentos recebidos em um array de objetos
      const allDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Paciente[];

      // Usa um Map para garantir que cada paciente é único pelo seu ID.
      // O Map sobrescreve qualquer chave duplicada, resultando em uma coleção única.
      const pacientesMap = new Map(allDocs.map(paciente => [paciente.id, paciente]));

      // Converte os valores do Map de volta para um array e atualiza o estado.
      // Esta é agora a única fonte de verdade para a lista de pacientes.
      setPacientes(Array.from(pacientesMap.values()));

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

    // Limpa o listener ao desmontar o componente para evitar vazamentos de memória
    return () => unsubscribe();
  }, []); // O array de dependências vazio garante que o listener seja configurado apenas uma vez.

  const criarPacienteManual = async (dadosPaciente: Omit<Paciente, 'id'>): Promise<string | null> => {
    // 1. Padroniza o nome para maiúsculas para a verificação e salvamento
    const nomeEmMaiusculo = dadosPaciente.nomeCompleto.toUpperCase();

    try {
      // 2. Cria a query para verificar duplicatas
      const q = query(
        collection(db, 'pacientesRegulaFacil'),
        where('nomeCompleto', '==', nomeEmMaiusculo),
        where('dataNascimento', '==', dadosPaciente.dataNascimento)
      );

      // 3. Executa a query
      const querySnapshot = await getDocs(q);

      // 4. Se o resultado não for vazio, um duplicado existe
      if (!querySnapshot.empty) {
        toast({
          title: "Erro de Duplicidade",
          description: "Este paciente já está cadastrado no sistema (mesmo nome e data de nascimento).",
          variant: "destructive",
        });
        return null; // Retorna nulo para indicar que a criação falhou
      }

      // 5. Se não houver duplicatas, cria o novo paciente com o nome padronizado
      const docRef = await addDoc(collection(db, 'pacientesRegulaFacil'), {
        ...dadosPaciente,
        nomeCompleto: nomeEmMaiusculo, // Garante que o nome salvo esteja em maiúsculas
      });
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

  // NOVO: importação com reconciliação atômica (batch write)
  const importarPacientesDaPlanilha = async (pacientesDaPlanilha: PacientePlanilha[]): Promise<ImportacaoResumo> => {
    setLoading(true);
    try {
      const resumo = await reconciliarPacientesComPlanilha(pacientesDaPlanilha);
      return resumo;
    } finally {
      setLoading(false);
    }
  };

  return {
    pacientes,
    loading,
    criarPacienteManual,
    importarPacientesDaPlanilha, // exposto para uso na UI
  };
};
