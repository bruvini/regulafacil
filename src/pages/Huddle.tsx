
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const Huddle = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-lg bg-medical-warning flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-medical-primary mb-4">
              Huddle
            </h1>
            <p className="text-lg text-muted-foreground">
              Centralize informações e comunicação da equipe multidisciplinar
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
                Aqui você poderá centralizar informações de passagem de plantão, 
                comunicação entre equipes, alertas importantes e coordenação 
                multidisciplinar.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Huddle;
