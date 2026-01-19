"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import {
  Home,
  Calendar,
  Palmtree,
  UserPlus,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AppSidebarProps {
  user: Profile | null;
}

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: Home, roles: ["admin_rrhh", "jefe_area", "empleado"] },
  { href: "/profile", label: "Mi Perfil", icon: Users, roles: ["admin_rrhh", "jefe_area", "empleado"] },
  { href: "/employees", label: "Empleados", icon: Users, roles: ["admin_rrhh", "jefe_area"] },
  { href: "/time-off", label: "Vacaciones", icon: Palmtree, roles: ["admin_rrhh", "jefe_area", "empleado"] },
  { href: "/calendar", label: "Calendario", icon: Calendar, roles: ["admin_rrhh", "jefe_area", "empleado"] },
  { href: "/onboarding", label: "Onboarding", icon: UserPlus, roles: ["admin_rrhh", "jefe_area"] },
  { href: "/admin/settings", label: "Configuracion", icon: Settings, roles: ["admin_rrhh"] },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo width={40} height={36} />
            <span className="font-semibold text-lg">GQ People</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Logo width={32} height={28} />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="mb-3 px-2">
            <p className="font-medium text-sm truncate">{user.full_name}</p>
            <p className="text-xs text-sidebar-foreground/70">{ROLE_LABELS[user.role]}</p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-2">Cerrar sesion</span>}
        </Button>
      </div>
    </aside>
  );
}
