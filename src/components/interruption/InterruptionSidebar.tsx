import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Database, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const navigation = [
  {
    title: 'Dashboard',
    href: '/interruption',
    icon: BarChart3,
    description: 'Overview dan analytics gangguan'
  },
  {
    title: 'Data Management',
    href: '/interruption/data',
    icon: Database,
    description: 'Kelola tiket gangguan'
  }
];

export const InterruptionSidebar: React.FC = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/interruption') {
      return location.pathname === path || location.pathname === '/interruption/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className={`${collapsed ? 'w-16' : 'w-60'} hidden md:flex border-r transition-all duration-300`}>
      <SidebarHeader className="border-b py-3 px-6">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-destructive via-destructive/90 to-destructive/80 rounded-xl flex items-center justify-center shadow-lg">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-md bg-gradient-to-r from-destructive to-destructive/80 bg-clip-text text-transparent">
                Report Gangguan
              </h2>
              <p className="text-[10px] text-muted-foreground">Monitoring System</p>
            </div>
          )}
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-2 flex flex-col h-full">
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 mb-3">
            {!collapsed ? 'MENU UTAMA' : ''}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const itemIsActive = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.href}
                          end={item.href === '/interruption'}
                          className={`flex items-center gap-3 px-3 py-5 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                            itemIsActive
                              ? 'bg-gradient-to-r from-destructive/5 to-destructive/10 text-foreground shadow-md'
                              : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-destructive/5 hover:to-destructive/10 hover:shadow-md'
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                              itemIsActive
                                ? 'text-destructive scale-110'
                                : 'group-hover:text-destructive group-hover:scale-105'
                            }`}
                          />
                          
                          {!collapsed && (
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-sm">{item.title}</span>
                            </div>
                          )}
                          
                          {itemIsActive && !collapsed && (
                            <motion.div
                              className="w-2 h-2 bg-destructive rounded-full"
                              layoutId="activeIndicatorInterruption"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          )}
                          
                          {/* Hover effect background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-destructive/0 via-destructive/5 to-destructive/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </NavLink>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Back to Inventory Button */}
        <div className="mt-auto pt-4 px-2 border-t border-border/50">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
            onClick={() => window.location.href = '/'}
          >
            <ArrowLeft className="h-5 w-5" />
            {!collapsed && <span className="font-medium">Kembali ke Inventori</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};
