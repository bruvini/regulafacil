
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
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
  historicoAcessos?: any[]; // Array para armazenar timestamps de acesso
}

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const auth = getAuth();

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
      const emailCompleto = `${data.email}@joinville.sc.gov.br`;
      const senhaPadrao = 'hmsj@123';

      // Verificar duplicidade
      const emailExists = usuarios.some(u => u.email === emailCompleto);
      const matriculaExists = usuarios.some(u => u.matricula === data.matricula);

      if (emailExists) throw new Error("Este e-mail já está em uso.");
      if (matriculaExists) throw new Error("Esta matrícula já está em uso.");

      // Cria o usuário no Firebase Auth para obter o UID
      const userCredential = await createUserWithEmailAndPassword(auth, emailCompleto, senhaPadrao);
      const newUser = userCredential.user;

      // CORREÇÃO PRINCIPAL: Usar setDoc com o UID do usuário como ID do documento
      const userDocRef = doc(db, 'usuariosRegulaFacil', newUser.uid);

      await setDoc(userDocRef, {
        uid: newUser.uid,
        nomeCompleto: data.nomeCompleto.toUpperCase(),
        matricula: data.matricula,
        email: emailCompleto,
        tipoAcesso: data.tipoAcesso,
        permissoes: data.tipoAcesso === 'Comum' ? data.permissoes || [] : [],
        historicoAcessos: [] // Inicializa o histórico de acessos
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
