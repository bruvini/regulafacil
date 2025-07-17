import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { db, firebaseConfig } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuditoria } from './useAuditoria';

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
  const { registrarLog } = useAuditoria();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'usuariosRegulaFacil'), (snapshot) => {
      const usuariosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Usuario[];
      setUsuarios(usuariosData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const criarUsuario = async (data: Omit<Usuario, 'id' | 'uid'>): Promise<boolean> => {
    setLoading(true);

    // Crie uma instância secundária e temporária do Firebase App
    const secondaryApp = initializeApp(firebaseConfig, `secondary-app-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const emailCompleto = `${data.email}@joinville.sc.gov.br`;
      const senhaPadrao = 'hmsj@123';

      // Verificar duplicidade
      const emailExists = usuarios.some(u => u.email === emailCompleto);
      const matriculaExists = usuarios.some(u => u.matricula === data.matricula);

      if (emailExists) throw new Error("Este e-mail já está em uso.");
      if (matriculaExists) throw new Error("Esta matrícula já está em uso.");

      // Use a instância secundária para criar o usuário. Isso NÃO afetará a sessão do admin.
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, emailCompleto, senhaPadrao);
      const newUser = userCredential.user;

      // Crie o documento no Firestore com o UID do novo usuário como ID do documento
      const userDocRef = doc(db, 'usuariosRegulaFacil', newUser.uid);

      await setDoc(userDocRef, {
        uid: newUser.uid,
        nomeCompleto: data.nomeCompleto.toUpperCase(),
        matricula: data.matricula,
        email: emailCompleto,
        tipoAcesso: data.tipoAcesso,
        permissoes: data.tipoAcesso === 'Comum' ? data.permissoes || [] : [],
        historicoAcessos: []
      });

      toast({ title: "Sucesso!", description: "Usuário criado com sucesso." });
      
      // LOG AQUI:
      registrarLog(`Criou o usuário "${data.nomeCompleto.toUpperCase()}" (Matrícula: ${data.matricula}) com perfil "${data.tipoAcesso}".`, 'Gestão de Usuários');
      
      return true;
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      const mensagemErro = error.code === 'auth/email-already-in-use' 
          ? 'O e-mail fornecido já está em uso por outra conta.'
          : error.message || "Não foi possível criar o usuário.";
      toast({ title: "Erro", description: mensagemErro, variant: "destructive" });
      return false;
    } finally {
      // Deslogue o usuário da instância secundária e destrua o app temporário
      try {
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);
      } catch (cleanupError) {
        console.error("Erro ao limpar instância secundária:", cleanupError);
      }
      setLoading(false);
    }
  };

  const atualizarUsuario = async (id: string, data: Partial<Usuario>): Promise<boolean> => {
    setLoading(true);
    try {
      const userRef = doc(db, 'usuariosRegulaFacil', id);
      await updateDoc(userRef, {
        ...data,
        nomeCompleto: data.nomeCompleto?.toUpperCase(),
      });
      toast({ title: "Sucesso!", description: "Usuário atualizado com sucesso." });
      
      // LOG AQUI:
      registrarLog(`Editou o usuário "${data.nomeCompleto?.toUpperCase()}".`, 'Gestão de Usuários');
      
      setLoading(false);
      return true; // Retorna sucesso
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o usuário.", variant: "destructive" });
      setLoading(false);
      return false; // Retorna falha
    }
  };

  const excluirUsuario = async (id: string, uid?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const usuarioExcluido = usuarios.find(u => u.id === id);
      
      // Passo 1: Excluir do Firestore
      await deleteDoc(doc(db, 'usuariosRegulaFacil', id));

      // Passo 2: Chamar uma Cloud Function para excluir do Firebase Auth (MÉTODO SEGURO)
      // NOTA: A exclusão de usuários do Firebase Auth por outro usuário não é permitida
      // pelo SDK do cliente por razões de segurança. A única forma correta é através 
      // de uma Firebase Cloud Function que use o Admin SDK.
      // A função abaixo é um exemplo de como seria a chamada:
      /*
      const deleteUserFunction = httpsCallable(functions, 'deleteUser');
      await deleteUserFunction({ uid: uid });
      */

      toast({ 
        title: "Sucesso!", 
        description: "Usuário excluído do sistema. A exclusão da autenticação requer ação no backend." 
      });
      
      // LOG AQUI:
      if (usuarioExcluido) {
        registrarLog(`Excluiu o usuário "${usuarioExcluido.nomeCompleto}".`, 'Gestão de Usuários');
      }
      
      setLoading(false);
      return true; // Retorna sucesso
    } catch (error: any) {
      console.error("Erro ao excluir usuário:", error);
      toast({ title: "Erro", description: "Não foi possível excluir o usuário.", variant: "destructive" });
      setLoading(false);
      return false; // Retorna falha
    }
  };

  return { usuarios, loading, criarUsuario, atualizarUsuario, excluirUsuario };
};
