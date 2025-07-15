
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, arrayUnion, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
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
      const userCredential = await signInWithEmailAndPassword(auth, emailCompleto, password);
      const user = userCredential.user;

      // Busca o documento do usuário no Firestore para atualizar o histórico
      const q = query(collection(db, 'usuariosRegulaFacil'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'usuariosRegulaFacil', userDoc.id), {
          historicoAcessos: arrayUnion(serverTimestamp())
        });
      }

      navigate('/inicio'); // Redireciona para a página inicial
      toast({ title: "Login realizado com sucesso!", description: "Bem-vindo ao RegulaFacil" });
    } catch (error: any) {
      console.error('Erro no login:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        toast({ title: "Erro de Login", description: "E-mail não encontrado. Verifique o usuário ou contate o administrador.", variant: "destructive" });
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast({ title: "Erro de Login", description: "Senha incorreta. Tente novamente.", variant: "destructive" });
      } else {
        toast({ title: "Erro Desconhecido", description: "Ocorreu um erro ao tentar fazer login.", variant: "destructive" });
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
