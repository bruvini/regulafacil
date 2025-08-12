
import { 
  BedDouble, 
  Shield, 
  Users, 
  Scissors, 
  TrendingUp, 
  FileText, 
  Settings,
  ArrowRight,
  BrainCircuit,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/config/routes';

const features = [
  {
    title: 'Regulação de Leitos',
    description: 'Gerencie solicitações de leitos e pendências em tempo real',
    icon: BrainCircuit,
    path: APP_ROUTES.private.regulacao,
    color: 'bg-medical-primary'
  },
  {
    title: 'Mapa de Leitos',
    description: 'Visualize a ocupação de todos os setores e leitos do hospital em tempo real',
    icon: BedDouble,
    path: APP_ROUTES.private.mapaLeitos,
    color: 'bg-cyan-600'
  },
  {
    title: 'Central de Higienização',
    description: 'Gerencie e monitore a limpeza e higienização dos leitos',
    icon: Sparkles,
    path: APP_ROUTES.private.centralHigienizacao,
    color: 'bg-emerald-600'
  },
  {
    title: 'Gestão de Isolamentos',
    description: 'Controle e monitore protocolos de isolamento de pacientes',
    icon: Shield,
    path: APP_ROUTES.private.gestaoIsolamentos,
    color: 'bg-medical-danger'
  },
  {
    title: 'Marcação Cirúrgica',
    description: 'Agende e gerencie cirurgias eletivas com controle de leitos',
    icon: Scissors,
    path: APP_ROUTES.private.marcacaoCirurgica,
    color: 'bg-purple-600'
  },
  {
    title: 'Huddle',
    description: 'Reuniões diárias e comunicação entre equipes',
    icon: Users,
    path: APP_ROUTES.private.huddle,
    color: 'bg-green-600'
  },
  {
    title: 'Gestão Estratégica',
    description: 'Indicadores e métricas para tomada de decisão',
    icon: TrendingUp,
    path: APP_ROUTES.private.gestaoEstrategica,
    color: 'bg-blue-600'
  },
  {
    title: 'Auditoria',
    description: 'Controle e rastreabilidade de todas as operações',
    icon: FileText,
    path: APP_ROUTES.private.auditoria,
    color: 'bg-orange-600'
  },
  {
    title: 'Gestão de Usuários',
    description: 'Controle de acesso e permissões do sistema',
    icon: Settings,
    path: APP_ROUTES.private.gestaoUsuarios,
    color: 'bg-gray-600'
  }
];

const HomePage = () => {
  const { userData } = useAuth();

  const featuresVisiveis = features.filter(feature => {
    if (userData?.tipoAcesso === 'Administrador') return true;
    const paginaId = feature.path.replace('/', '');
    return userData?.permissoes?.includes(paginaId);
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-medical-primary mb-4">
            RegulaFácil
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema integrado de regulação hospitalar para otimizar o fluxo de pacientes 
            e maximizar a eficiência dos recursos
          </p>
        </div>

        <div className="mb-12">
          <Card className="bg-medical-primary/5 border-medical-primary/20">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-2xl font-bold text-medical-primary mb-4">
                Bem-vindo ao Hospital Municipal São José
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Utilize o menu lateral para navegar entre os módulos do sistema. 
                Cada ferramenta foi desenvolvida para otimizar processos específicos 
                da regulação hospitalar.
              </p>
              {userData && (
                <p className="text-sm text-muted-foreground mt-4">
                  Logado como: {userData.nomeCompleto} ({userData.tipoAcesso})
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuresVisiveis.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={feature.path} 
                className="group hover:shadow-lg transition-all duration-200 border-border/50"
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild variant="ghost" className="w-full justify-between p-0 h-auto">
                    <Link to={feature.path} className="flex items-center justify-between w-full py-2">
                      <span className="text-medical-primary font-medium">Acessar</span>
                      <ArrowRight className="h-4 w-4 text-medical-primary" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
