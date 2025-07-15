
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Hospital } from 'lucide-react';

const LoginPage = () => {
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
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="flex items-center">
                <Input id="email" placeholder="usuario" className="rounded-r-none focus-visible:ring-offset-0" />
                <span className="p-2 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">@joinville.sc.gov.br</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" size="lg">Entrar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
