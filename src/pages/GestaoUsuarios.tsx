
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const GestaoUsuarios = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-lg bg-gray-600 flex items-center justify-center">
                <Settings className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-medical-primary mb-4">
              Gestão de Usuários
            </h1>
            <p className="text-lg text-muted-foreground">
              Administre perfis de acesso e permissões do sistema
            </p>
          </div>

          <Card className="shadow-card border border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-medical-primary">
                Página em Desenvolvimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta funcionalidade está sendo desenvolvida e estará disponível em breve. 
                Aqui você poderá gerenciar usuários do sistema, definir permissões, 
                controlar acessos e administrar perfis de diferentes profissionais.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GestaoUsuarios;
