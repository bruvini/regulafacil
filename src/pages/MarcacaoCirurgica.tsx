
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const MarcacaoCirurgica = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-lg bg-medical-success flex items-center justify-center">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-medical-primary mb-4">
              Marcação Cirúrgica
            </h1>
            <p className="text-lg text-muted-foreground">
              Agende e organize as cirurgias com controle de sala e recursos
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
                Aqui você poderá agendar cirurgias, gerenciar salas operatórias, 
                controlar recursos e equipamentos, além de acompanhar a programação 
                cirúrgica em tempo real.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarcacaoCirurgica;
