import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TechnicianSidebar } from './TechnicianSidebar';
import { TechnicianMobileBottomNav } from './TechnicianMobileBottomNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, LogOut } from 'lucide-react';
interface TechnicianLayoutProps {
  children: React.ReactNode;
}
export function TechnicianLayout({
  children
}: TechnicianLayoutProps) {
  const handleLogout = () => {
    window.location.href = '/';
  };
  return <SidebarProvider>
      <div className="flex min-h- w-[2000px]">
        <TechnicianSidebar />
        <main className="flex-1 bg-muted/5 pb-16 md:pb-0 sm:ml-60   ">
          {children}
        </main>
      </div>
      {/* Mobile Bottom Navigation */}
      <TechnicianMobileBottomNav />
    </SidebarProvider>;
}