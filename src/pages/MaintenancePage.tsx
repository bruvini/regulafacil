
import { Settings, HardHat, Monitor } from 'lucide-react';

const MaintenancePage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-medical-primary/5 to-blue-50 text-center p-4">
      <div className="max-w-3xl">
        {/* Ícones animados */}
        <div className="flex justify-center items-center mb-8 relative">
          <div className="relative">
            <Settings className="h-20 w-20 text-medical-primary animate-spin" style={{ animationDuration: '3s' }} />
            <HardHat className="h-16 w-16 text-amber-500 absolute -top-2 -right-2" />
          </div>
          <Monitor className="h-24 w-24 text-slate-600 ml-6" />
        </div>

        {/* Título principal */}
        <h1 className="text-5xl font-bold text-medical-primary mb-6 animate-fade-in">
          Estamos calibrando nossos instrumentos
        </h1>

        {/* Mensagem principal */}
        <div className="space-y-4 mb-8">
          <p className="text-xl text-slate-700 leading-relaxed">
            O <span className="font-semibold text-medical-primary">RegulaFacil</span> está passando por uma manutenção programada para ficar ainda melhor.
          </p>
          
          <p className="text-lg text-slate-600">
            Nossa equipe está trabalhando para trazer novas funcionalidades e mais performance.
          </p>
          
          <p className="text-base text-slate-500 italic">
            Agradecemos a sua paciência. Voltaremos em breve, mais fortes e eficientes para ajudar a salvar vidas.
          </p>
        </div>

        {/* Indicador de progresso visual */}
        <div className="bg-white rounded-lg shadow-lg p-6 mx-auto max-w-md">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-medical-primary rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-medical-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="w-2 h-2 bg-medical-primary rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            <span className="text-sm font-medium text-slate-600">Sistema em atualização</span>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-medical-primary to-blue-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Rodapé com informações adicionais */}
        <div className="mt-12 text-sm text-slate-400">
          <p>© 2024 RegulaFacil - Sistema de Regulação Hospitalar</p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
