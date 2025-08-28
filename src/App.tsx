
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { APP_ROUTES } from '@/config/routes';

import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import MapaLeitos from '@/pages/MapaLeitos';
import RegulacaoLeitos from '@/pages/RegulacaoLeitos';
import CentralHigienizacao from '@/pages/CentralHigienizacao';
import MarcacaoCirurgica from '@/pages/MarcacaoCirurgica';
import Huddle from '@/pages/Huddle';
import GestaoIsolamentos from '@/pages/GestaoIsolamentos';
import GestaoUsuarios from '@/pages/GestaoUsuarios';
import GestaoEstrategica from '@/pages/GestaoEstrategica';
import Auditoria from '@/pages/Auditoria';
import MaintenancePage from '@/pages/MaintenancePage';
import NotFound from '@/pages/NotFound';
import ProtectedLayout from '@/components/ProtectedLayout';
import { AuthProvider } from '@/hooks/useAuth';
import { useSistemaConfig } from '@/hooks/useSistemaConfig';

const queryClient = new QueryClient();

const AppContent = () => {
  const { modoManutencaoAtivo, loading } = useSistemaConfig();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const overrideKey = params.get('override_maint');

    // Senha de bypass para administradores
    if (overrideKey === 'nir_master_key') {
      return; 
    }

    if (!loading && modoManutencaoAtivo && location.pathname !== '/manutencao') {
      navigate('/manutencao', { replace: true });
    }
  }, [modoManutencaoAtivo, loading, location, navigate]);

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Toaster />
      <Routes>
        <Route path={APP_ROUTES.public.login} element={<LoginPage />} />
        <Route path={APP_ROUTES.public.manutencao} element={<MaintenancePage />} />
        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<HomePage />} />
          <Route path={APP_ROUTES.private.mapaLeitos.substring(1)} element={<MapaLeitos />} />
          <Route path={APP_ROUTES.private.regulacao.substring(1)} element={<RegulacaoLeitos />} />
          <Route path={APP_ROUTES.private.centralHigienizacao.substring(1)} element={<CentralHigienizacao />} />
          <Route path={APP_ROUTES.private.marcacaoCirurgica.substring(1)} element={<MarcacaoCirurgica />} />
          <Route path={APP_ROUTES.private.huddle.substring(1)} element={<Huddle />} />
          <Route path={APP_ROUTES.private.gestaoIsolamentos.substring(1)} element={<GestaoIsolamentos />} />
          <Route path={APP_ROUTES.private.gestaoUsuarios.substring(1)} element={<GestaoUsuarios />} />
          <Route path={APP_ROUTES.private.gestaoEstrategica.substring(1)} element={<GestaoEstrategica />} />
          <Route path={APP_ROUTES.private.auditoria.substring(1)} element={<Auditoria />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
