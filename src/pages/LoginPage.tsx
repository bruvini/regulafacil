
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Hospital } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const emailCompleto = `${email}@joinville.sc.gov.br`;

    try {
      // ADICIONA CONFIGURAÇÃO DE PERSISTÊNCIA ANTES DO LOGIN
      await setPersistence(auth, browserLocalPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, emailCompleto, password);
      const user = userCredential.user;

      // Após o login bem-sucedido, vamos buscar o documento do usuário para
      // verificar se é o primeiro login ANTES de registrar o acesso.
      const userDocRef = doc(db, 'usuariosRegulaFacil', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const ePrimeiroLogin = !userData.historicoAcessos || userData.historicoAcessos.length === 0;

        // Registra o novo acesso no Firestore
        // CORREÇÃO: Substituímos serverTimestamp() por new Date()
        await updateDoc(userDocRef, {
          historicoAcessos: arrayUnion(new Date()) 
        });

        // A lógica de forçar a troca de senha será tratada pelo AuthProvider/Layout
        // que detectará o estado de primeiro login.
        // Redireciona para a página inicial (rota raiz)
        navigate('/');
        toast({ title: "Login realizado com sucesso!", description: "Bem-vindo ao RegulaFacil" });
      } else {
        throw new Error("Documento do usuário não encontrado no Firestore.");
      }

    } catch (error: any) {
      console.error("Erro no login:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        toast({ title: "Erro de Login", description: "E-mail não encontrado. Verifique o usuário ou contate o administrador.", variant: "destructive" });
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast({ title: "Erro de Login", description: "Senha incorreta. Tente novamente.", variant: "destructive" });
      } else {
        toast({ title: "Erro Desconhecido", description: error.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-medical-primary text-white w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Hospital className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl text-medical-primary">RegulaFacil</CardTitle>
          <CardDescription>Acesso ao Sistema de Gestão de Leitos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="flex items-center">
                <Input 
                  id="email" 
                  placeholder="usuario" 
                  className="rounded-r-none focus-visible:ring-offset-0"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <span className="p-2 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">@joinville.sc.gov.br</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
