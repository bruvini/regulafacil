
import { Hospital, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './ui/button';

const getSaudacao = () => {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
};

const Header = () => {
  const { userData, logout } = useAuth();
  const saudacao = getSaudacao();

  return (
    <header className="bg-gradient-medical shadow-medical border-b border-border/50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <Hospital className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">RegulaFacil</h1>
            <p className="text-white/80 text-sm">Sistema de Gestão de Leitos Hospitalares</p>
          </div>
        </div>
        {userData && (
          <div className="flex items-center gap-4">
            <p className="text-sm text-white hidden md:block">
              {saudacao}, <span className="font-semibold">{userData.nomeCompleto.split(' ')[0]}</span>!
            </p>
            <Button onClick={logout} variant="destructive" size="sm">
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
