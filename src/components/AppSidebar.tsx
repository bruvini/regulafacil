
import { useState } from "react"
import { 
  Circle, 
  Square, 
  Triangle, 
  Star, 
  Hexagon, 
  Home,
  MapPin,
  Users,
  Building,
  Stethoscope,
  Activity,
  Calendar,
  Shield,
  BarChart3,
  Sparkles
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Mapa de Leitos", url: "/mapa-leitos", icon: MapPin },
  { title: "Regulação de Leitos", url: "/regulacao", icon: Activity },
  { title: "Central de Higienização", url: "/central-higienizacao", icon: Sparkles },
  { title: "Marcação Cirúrgica", url: "/marcacao-cirurgica", icon: Calendar },
  { title: "Huddle", url: "/huddle", icon: Stethoscope },
  { title: "Gestão de Isolamentos", url: "/gestao-isolamentos", icon: Shield },
  { title: "Gestão de Usuários", url: "/gestao-usuarios", icon: Users },
  { title: "Gestão Estratégica", url: "/gestao-estrategica", icon: BarChart3 },
  { title: "Auditoria", url: "/auditoria", icon: Building },
]

export function AppSidebar() {
  const { collapsed } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const isExpanded = menuItems.some((i) => isActive(i.url))
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible
    >
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup
          open={isExpanded}
          onOpenChange={() => {}}
        >
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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
