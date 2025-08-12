
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
import NotFound from '@/pages/NotFound';
import ProtectedLayout from '@/components/ProtectedLayout';
import AppLayout from '@/components/AppLayout';

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
            <Toaster />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedLayout><AppLayout /></ProtectedLayout>}>
                <Route index element={<HomePage />} />
                <Route path="mapa-leitos" element={<MapaLeitos />} />
                <Route path="regulacao" element={<RegulacaoLeitos />} />
                <Route path="central-higienizacao" element={<CentralHigienizacao />} />
                <Route path="marcacao-cirurgica" element={<MarcacaoCirurgica />} />
                <Route path="huddle" element={<Huddle />} />
                <Route path="gestao-isolamentos" element={<GestaoIsolamentos />} />
                <Route path="gestao-usuarios" element={<GestaoUsuarios />} />
                <Route path="gestao-estrategica" element={<GestaoEstrategica />} />
                <Route path="auditoria" element={<Auditoria />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
