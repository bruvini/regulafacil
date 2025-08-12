
import { Home, Users, Bed, Calendar, FileText, Settings, Activity, Shield, BarChart3, Stethoscope, Sparkles } from "lucide-react"
import { NavLink } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navLinks = [
  {
    title: "Início",
    url: "/",
    icon: Home,
  },
  {
    title: "Mapa de Leitos",
    url: "/mapa-leitos",
    icon: Bed,
  },
  {
    title: "Regulação de Leitos",
    url: "/regulacao-leitos", 
    icon: Activity,
  },
  {
    title: "Central de Higienização",
    url: "/central-higienizacao",
    icon: Sparkles,
  },
  {
    title: "Marcação Cirúrgica",
    url: "/marcacao-cirurgica",
    icon: Calendar,
  },
  {
    title: "Huddle",
    url: "/huddle",
    icon: Stethoscope,
  },
  {
    title: "Gestão de Isolamentos", 
    url: "/gestao-isolamentos",
    icon: Shield,
  },
  {
    title: "Gestão Estratégica",
    url: "/gestao-estrategica",
    icon: BarChart3,
  },
  {
    title: "Gestão de Usuários",
    url: "/gestao-usuarios", 
    icon: Users,
  },
  {
    title: "Auditoria",
    url: "/auditoria",
    icon: FileText,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navLinks.map((link) => (
                <SidebarMenuItem key={link.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={link.url}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-medical-primary text-white' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      <link.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{link.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
