import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BarChart3, Home, LogOut, Settings, User as UserIcon } from "lucide-react";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { logout } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/session";
import type { User } from "@/lib/data";

const ICON_CLASS = "text-white";

export function AppSidebar({ user }: { user: User }) {
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const [profileOpen, setProfileOpen] = useState(false);
  const home = homeFor(user);

  const items = [
    { title: "Início", url: home, icon: Home },
    ...(user.type === "admin"
      ? [{ title: "Métricas", url: "/metricas", icon: BarChart3 }]
      : []),
    { title: "Configurações", url: "/configuracoes", icon: Settings },
  ];

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={currentPath === item.url}
                      tooltip={item.title}
                    >
                      <Link to={item.url as "/admin"}>
                        <item.icon className={ICON_CLASS} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Perfil" onClick={() => setProfileOpen(true)}>
                <UserIcon className={ICON_CLASS} />
                <span>Perfil</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sair"
                onClick={async () => {
                  await logout();
                  navigate({ to: "/auth" });
                }}
              >
                <LogOut className={ICON_CLASS} />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <CollapseToggle />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Perfil</SheetTitle>
            <SheetDescription>Dados da sua conta</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3 text-sm">
            <Field label="Nome" value={user.name} />
            <Field label="Número de usuário" value={user.number} />
            <Field label="Tipo" value={user.type} />
            {user.type === "empresa" && <Field label="CNPJ" value={user.cnpj} />}
            {user.type === "motorista" && (
              <>
                <Field label="Placa" value={user.placa} />
                <Field label="Veículo" value={user.veiculo} />
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium capitalize">{value}</div>
    </div>
  );
}

function CollapseToggle() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <SidebarMenuButton asChild tooltip={collapsed ? "Expandir menu" : "Recolher menu"}>
      <SidebarTrigger className="w-full justify-start gap-2 h-8 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&>svg]:hidden">
        {collapsed ? <PanelLeftOpen className={ICON_CLASS} /> : <PanelLeftClose className={ICON_CLASS} />}
        <span>{collapsed ? "Expandir" : "Recolher"}</span>
      </SidebarTrigger>
    </SidebarMenuButton>
  );
}
