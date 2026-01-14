import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Home, FileText, Clock, User, LogOut, Zap, AlertTriangle } from "lucide-react";

// Technician navigation items
const technicianMenuItems = [
  {
    title: "Dashboard Teknisi",
    url: "/technician",
    icon: Home,
    description: "Dashboard utama teknisi",
  },
  {
    title: "Data Aktivasi",
    url: "/technician/activation",
    icon: Zap,
    description: "Input data aktivasi layanan",
  },
  {
    title: "Generate Berita Acara",
    url: "/technician/reports",
    icon: FileText,
    description: "Buat berita acara instalasi",
  },
  {
    title: "Riwayat Pekerjaan",
    url: "/technician/history",
    icon: Clock,
    description: "Riwayat pekerjaan selesai",
  },
  {
    title: "Report Gangguan",
    url: "/interruption",
    icon: AlertTriangle,
    description: "Laporan gangguan pelanggan",
  },
];
const settingsItems = [
  {
    title: "Profil Teknisi",
    url: "/technician/profile",
    icon: User,
    description: "Kelola profil dan pengaturan",
  },
];
export function TechnicianSidebar() {
  const { user } = useAuth();
  const sidebar = useSidebar();
  const collapsed = sidebar?.state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.clear();
    
    // Clear sessionStorage as well
    sessionStorage.clear();
    
    // Clear any auth tokens and cache
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastLoginTime');
    localStorage.removeItem('auth-state');
    
    // Redirect to login immediately
    window.location.href = "/";
  };
  return (
    <Sidebar
      className={`${
        collapsed ? "w-16" : "w-60"
      } hidden md:flex border-r transition-all duration-300`}
    >
      <SidebarHeader className="border-b py-3 px-6">
        <motion.div
          className="flex items-center gap-3"
          initial={{
            opacity: 0,
            x: -20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.3,
          }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
            <User className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-md bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Teknisi PSB
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Field Management
              </p>
            </div>
          )}
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-2 flex-1 flex flex-col justify-between">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 mb-3">
            {!collapsed ? "MENU UTAMA" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-4">
              {technicianMenuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive =
                  item.url === "/technician"
                    ? currentPath === "/technician" 
                    : currentPath === item.url ||
                      currentPath.startsWith(item.url + "/");

                return (
                  <SidebarMenuItem key={item.title}>
                    <motion.div
                      initial={{
                        opacity: 0,
                        x: -20,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                      }}
                    >
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={`flex items-center gap-3 px-3 py-5 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                            isActive
                              ? "bg-gradient-to-r from-primary/5 to-primary/10 text-foreground shadow-md"
                              : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:shadow-md"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                              isActive
                                ? "text-primary scale-110"
                                : "group-hover:text-primary group-hover:scale-105"
                            }`}
                          />

                          {!collapsed && (
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-xs">
                                {item.title}
                              </span>
                            </div>
                          )}

                          {isActive && !collapsed && (
                            <motion.div
                              className="w-2 h-2 bg-primary rounded-full"
                              layoutId="activeIndicator"
                              initial={{
                                scale: 0,
                              }}
                              animate={{
                                scale: 1,
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                            />
                          )}

                          {/* Hover effect background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </NavLink>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Navigation */}

        {/* User Info with Logout */}
        {!collapsed && (
          <SidebarGroup className="mt-6">
            <Popover open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
              <PopoverTrigger asChild>
                <button className="w-full p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-full flex items-center justify-center shadow-lg">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.name || "Teknisi"}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-xs mt-1 border-primary/20 text-primary"
                      >
                        Teknisi
                      </Badge>
                    </div>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </PopoverContent>
            </Popover>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
