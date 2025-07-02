
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RegulacaoLeitos from "./pages/RegulacaoLeitos";
import MapaLeitos from "./pages/MapaLeitos";
import GestaoIsolamentos from "./pages/GestaoIsolamentos";
import MarcacaoCirurgica from "./pages/MarcacaoCirurgica";
import Huddle from "./pages/Huddle";
import GestaoEstrategica from "./pages/GestaoEstrategica";
import Auditoria from "./pages/Auditoria";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="min-h-screen flex flex-col">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/regulacao-leitos" element={<RegulacaoLeitos />} />
              <Route path="/mapa-leitos" element={<MapaLeitos />} />
              <Route path="/gestao-isolamentos" element={<GestaoIsolamentos />} />
              <Route path="/marcacao-cirurgica" element={<MarcacaoCirurgica />} />
              <Route path="/huddle" element={<Huddle />} />
              <Route path="/gestao-estrategica" element={<GestaoEstrategica />} />
              <Route path="/auditoria" element={<Auditoria />} />
              <Route path="/gestao-usuarios" element={<GestaoUsuarios />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
        <Footer />
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
