
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BedDouble, Shield, Users, Calendar, TrendingUp, FileText, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const features = [
    {
      title: 'Regulação de Leitos',
      description: 'Gerencie a ocupação e disponibilidade dos leitos hospitalares em tempo real',
      icon: BedDouble,
      path: '/regulacao-leitos',
      color: 'bg-medical-primary'
    },
    {
      title: 'Gestão de Isolamentos',
      description: 'Controle e monitore os leitos de isolamento e precauções especiais',
      icon: Shield,
      path: '/gestao-isolamentos',
      color: 'bg-medical-danger'
    },
    {
      title: 'Marcação Cirúrgica',
      description: 'Agende e organize as cirurgias com controle de sala e recursos',
      icon: Calendar,
      path: '/marcacao-cirurgica',
      color: 'bg-medical-success'
    },
    {
      title: 'Huddle',
      description: 'Centralize informações e comunicação da equipe multidisciplinar',
      icon: Users,
      path: '/huddle',
      color: 'bg-medical-warning'
    },
    {
      title: 'Gestão Estratégica',
      description: 'Análise de indicadores e relatórios para gestão hospitalar',
      icon: TrendingUp,
      path: '/gestao-estrategica',
      color: 'bg-blue-600'
    },
    {
      title: 'Auditoria',
      description: 'Controle de qualidade e conformidade dos processos assistenciais',
      icon: FileText,
      path: '/auditoria',
      color: 'bg-purple-600'
    },
    {
      title: 'Gestão de Usuários',
      description: 'Administre perfis de acesso e permissões do sistema',
      icon: Settings,
      path: '/gestao-usuarios',
      color: 'bg-gray-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-medical-primary mb-4">
              Bem-vindo ao RegulaFácil
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Sistema integrado de gestão hospitalar desenvolvido pelo NIR (Núcleo de Informações e Regulação) 
              do Hospital Municipal São José. Uma ferramenta completa para otimizar processos assistenciais, 
              melhorar a gestão de leitos e fortalecer a comunicação entre equipes multidisciplinares.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Card key={feature.path} className="shadow-card hover:shadow-medical transition-all duration-200 border border-border/50">
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-3`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {feature.description}
                    </p>
                    <Link to={feature.path}>
                      <Button 
                        className="w-full bg-medical-primary hover:bg-medical-secondary text-white"
                        size="sm"
                      >
                        Acessar
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* About NIR Section */}
          <Card className="mt-12 shadow-card border border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-medical-primary">
                Sobre o NIR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                O Núcleo de Informações e Regulação (NIR) é responsável pela gestão estratégica 
                dos recursos hospitalares, otimização de fluxos assistenciais e coordenação entre 
                diferentes setores do Hospital Municipal São José. Nossa missão é garantir 
                eficiência operacional, qualidade assistencial e melhor experiência para 
                pacientes e profissionais de saúde.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
