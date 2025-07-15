
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Defina os tipos de dados aqui para consistência
export interface Usuario {
  id?: string;
  nomeCompleto: string;
  matricula: string;
  email: string;
  tipoAcesso: 'Comum' | 'Administrador';
  permissoes?: string[];
  uid?: string; // Para armazenar o ID do Firebase Auth
}

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'usuariosRegulaFacil'), (snapshot) => {
      const usuariosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Usuario[];
      setUsuarios(usuariosData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const criarUsuario = async (data: Omit<Usuario, 'id' | 'uid'>) => {
    setLoading(true);
    try {
      // Lógica para criar no Firebase Auth e depois no Firestore
      // Esta parte exigiria a configuração do Firebase Admin SDK no backend para segurança.
      // Por enquanto, simularemos a criação e focaremos no Firestore.

      const emailCompleto = `${data.email}@joinville.sc.gov.br`;

      // Verificar duplicidade
      const emailExists = usuarios.some(u => u.email === emailCompleto);
      const matriculaExists = usuarios.some(u => u.matricula === data.matricula);

      if (emailExists) throw new Error("Este e-mail já está em uso.");
      if (matriculaExists) throw new Error("Esta matrícula já está em uso.");

      // Adicionar ao Firestore
      await addDoc(collection(db, 'usuariosRegulaFacil'), {
        ...data,
        email: emailCompleto,
        nomeCompleto: data.nomeCompleto.toUpperCase(),
      });

      toast({ title: "Sucesso!", description: "Usuário criado com sucesso." });
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      toast({ title: "Erro", description: error.message || "Não foi possível criar o usuário.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const atualizarUsuario = async (id: string, data: Partial<Usuario>) => {
    setLoading(true);
    try {
      const userRef = doc(db, 'usuariosRegulaFacil', id);
      await updateDoc(userRef, {
        ...data,
        nomeCompleto: data.nomeCompleto?.toUpperCase(),
      });
      toast({ title: "Sucesso!", description: "Usuário atualizado com sucesso." });
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o usuário.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const excluirUsuario = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'usuariosRegulaFacil', id));
      // Aqui também entraria a lógica para deletar do Firebase Auth
      toast({ title: "Sucesso!", description: "Usuário excluído com sucesso." });
    } catch (error: any) {
      console.error("Erro ao excluir usuário:", error);
      toast({ title: "Erro", description: "Não foi possível excluir o usuário.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return { usuarios, loading, criarUsuario, atualizarUsuario, excluirUsuario };
};
