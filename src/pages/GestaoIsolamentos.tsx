
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Settings } from 'lucide-react';
import GerenciamentoIsolamentoModal from '@/components/modals/GerenciamentoIsolamentoModal';

const GestaoIsolamentos = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-lg bg-medical-danger flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-medical-primary mb-4">
              Gestão de Isolamentos
            </h1>
            <p className="text-lg text-muted-foreground">
              Controle e monitore os leitos de isolamento e precauções especiais
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="shadow-card border border-border/50">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-medical-primary flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuração de Tipos de Isolamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Configure os tipos de isolamento, microorganismos e regras de precaução 
                    que serão utilizados pela equipe de Controle de Infecção Hospitalar (CCIH).
                  </p>
                  
                  <Button 
                    onClick={() => setModalOpen(true)}
                    variant="medical"
                    size="lg"
                    className="w-full"
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Gerenciar Tipos de Isolamento
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border border-border/50">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-medical-primary">
                  Funcionalidades Futuras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-muted-foreground">
                  <p>• Monitoramento em tempo real dos leitos em isolamento</p>
                  <p>• Alertas automáticos para revisão de precauções</p>
                  <p>• Relatórios de conformidade com protocolos</p>
                  <p>• Integração com sistema de laboratório</p>
                  <p>• Dashboard executivo de controle de infecção</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <GerenciamentoIsolamentoModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </div>
  );
};

export default GestaoIsolamentos;
