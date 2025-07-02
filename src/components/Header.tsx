import { Hospital } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-gradient-medical shadow-medical border-b border-border/50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <Hospital className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">RegulaFacil</h1>
            <p className="text-white/80 text-sm">Sistema de Gestão de Leitos Hospitalares</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;