
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import HomePage from "./pages/HomePage";
import RegulacaoLeitos from "./pages/RegulacaoLeitos";
import MapaLeitos from "./pages/MapaLeitos";
import GestaoIsolamentos from "./pages/GestaoIsolamentos";
import MarcacaoCirurgica from "./pages/MarcacaoCirurgica";
import Huddle from "./pages/Huddle";
import GestaoEstrategica from "./pages/GestaoEstrategica";
import Auditoria from "./pages/Auditoria";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import CentralHigienizacao from "./pages/CentralHigienizacao";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import ProtectedLayout from "./components/ProtectedLayout";
import { PermissionChecker } from "./components/PermissionChecker";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route element={<ProtectedLayout />}>
                <Route path="/inicio" element={<PermissionChecker><HomePage /></PermissionChecker>} />
                <Route path="/regulacao-leitos" element={<PermissionChecker><RegulacaoLeitos /></PermissionChecker>} />
                <Route path="/mapa-leitos" element={<PermissionChecker><MapaLeitos /></PermissionChecker>} />
                <Route path="/central-higienizacao" element={<PermissionChecker><CentralHigienizacao /></PermissionChecker>} />
                <Route path="/gestao-isolamentos" element={<PermissionChecker><GestaoIsolamentos /></PermissionChecker>} />
                <Route path="/marcacao-cirurgica" element={<PermissionChecker><MarcacaoCirurgica /></PermissionChecker>} />
                <Route path="/huddle" element={<PermissionChecker><Huddle /></PermissionChecker>} />
                <Route path="/gestao-estrategica" element={<PermissionChecker><GestaoEstrategica /></PermissionChecker>} />
                <Route path="/auditoria" element={<PermissionChecker><Auditoria /></PermissionChecker>} />
                <Route path="/gestao-usuarios" element={<PermissionChecker><GestaoUsuarios /></PermissionChecker>} />
                <Route path="*" element={<PermissionChecker><NotFound /></PermissionChecker>} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Footer />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
