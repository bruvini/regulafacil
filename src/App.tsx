
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
import LoginPage from "./pages/LoginPage";
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
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/inicio" element={<AppLayout><HomePage /></AppLayout>} />
            <Route path="/regulacao-leitos" element={<AppLayout><RegulacaoLeitos /></AppLayout>} />
            <Route path="/mapa-leitos" element={<AppLayout><MapaLeitos /></AppLayout>} />
            <Route path="/gestao-isolamentos" element={<AppLayout><GestaoIsolamentos /></AppLayout>} />
            <Route path="/marcacao-cirurgica" element={<AppLayout><MarcacaoCirurgica /></AppLayout>} />
            <Route path="/huddle" element={<AppLayout><Huddle /></AppLayout>} />
            <Route path="/gestao-estrategica" element={<AppLayout><GestaoEstrategica /></AppLayout>} />
            <Route path="/auditoria" element={<AppLayout><Auditoria /></AppLayout>} />
            <Route path="/gestao-usuarios" element={<AppLayout><GestaoUsuarios /></AppLayout>} />
            <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
          </Routes>
        </BrowserRouter>
        <Footer />
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
