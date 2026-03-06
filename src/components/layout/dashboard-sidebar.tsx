"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Calendar,
  Target,
  Apple,
  Dumbbell,
  Heart,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { signOut } from "next-auth/react";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Fitness", href: "/fitness", icon: TrendingUp },
  { label: "Activities", href: "/activities", icon: Calendar },
  { label: "Zones", href: "/zones", icon: Target },
  { label: "Nutrition", href: "/nutrition", icon: Apple },
  { label: "Plan", href: "/plan", icon: Dumbbell },
  { label: "Health", href: "/health", icon: Heart },
];

const settingsItems = [
  { label: "Settings", href: "/settings", icon: Settings },
];

export function DashboardSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="shrink-0">
            <defs>
              <linearGradient id="caveBg" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="oklch(0.62 0.21 259)" />
                <stop offset="100%" stopColor="oklch(0.55 0.25 280)" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="7" fill="url(#caveBg)" />
            <path d="M6 24L13 8l4 8 3-5 6 13H6z" fill="white" opacity="0.95" />
            <path d="M12 24c0-3 2-5.5 4.5-5.5S21 21 21 24H12z" fill="url(#caveBg)" />
          </svg>
          <span className="text-lg font-bold">Paincave</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Training</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href || pathname.startsWith(item.href + "/")}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin"}>
                    <Link href="/admin">
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
