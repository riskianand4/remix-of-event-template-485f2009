import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TechnicianSidebar } from './TechnicianSidebar';
import { TechnicianMobileBottomNav } from './TechnicianMobileBottomNav';
import { PSBNotificationCenter } from '@/components/technician/PSBNotificationCenter';

interface TechnicianLayoutProps {
  children: React.ReactNode;
}

export function TechnicianLayout({
  children
}: TechnicianLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TechnicianSidebar />
        <main className="flex-1 bg-muted/5 pb-16 md:pb-0 sm:ml-60">
          {/* Header with notification */}
          <div className="sticky top-0 z-40 flex items-center justify-end gap-2 p-2 bg-background/80 backdrop-blur-sm border-b md:hidden">
            <PSBNotificationCenter />
          </div>
          {children}
        </main>
      </div>
      {/* Mobile Bottom Navigation */}
      <TechnicianMobileBottomNav />
    </SidebarProvider>
  );
}