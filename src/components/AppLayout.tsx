
import { 
  BedDouble, 
  Shield, 
  Users, 
  Scissors, 
  TrendingUp, 
  FileText, 
  Settings,
  Home,
  Menu,
  BrainCircuit
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AppLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    title: 'Início',
    url: '/',
    icon: Home,
  },
  {
    title: 'Regulação de Leitos',
    url: '/regulacao-leitos',
    icon: BrainCircuit,
  },
  {
    title: 'Mapa de Leitos',
    url: '/mapa-leitos',
    icon: BedDouble,
  },
  {
    title: 'Gestão de Isolamentos',
    url: '/gestao-isolamentos',
    icon: Shield,
  },
  {
    title: 'Marcação Cirúrgica',
    url: '/marcacao-cirurgica',
    icon: Scissors,
  },
  {
    title: 'Huddle',
    url: '/huddle',
    icon: Users,
  },
  {
    title: 'Gestão Estratégica',
    url: '/gestao-estrategica',
    icon: TrendingUp,
  },
  {
    title: 'Auditoria',
    url: '/auditoria',
    icon: FileText,
  },
  {
    title: 'Gestão de Usuários',
    url: '/gestao-usuarios',
    icon: Settings,
  },
];

function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  
  return (
    <Sidebar className={state === 'collapsed' ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-medical-primary font-semibold">
            RegulaFácil
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = location.pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <NavLink 
                              to={item.url}
                              className={({ isActive }) => 
                                cn(
                                  'flex items-center w-full h-full',
                                  isActive ? 'bg-medical-primary/10 text-medical-primary' : 'hover:bg-medical-primary/5 text-foreground'
                                )
                              }
                            >
                              <IconComponent className={cn("h-5 w-5", state === 'expanded' ? 'mr-2' : 'mx-auto')} />
                              {state !== 'collapsed' && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {state === 'collapsed' && (
                          <TooltipContent side="right"><p>{item.title}</p></TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex items-center px-4 h-full">
              <SidebarTrigger className="mr-4" />
              <h1 className="font-semibold text-medical-primary">
                Hospital Municipal São José - NIR
              </h1>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
