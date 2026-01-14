import { TechnicianLayout } from '@/components/layout/TechnicianLayout';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import React, { Suspense, lazy } from "react";

import { ScrollRestoration } from "./components/ScrollRestoration";
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import OptimizedAlertMonitor from '@/components/alerts/OptimizedAlertMonitor';
import { LayoutSkeleton } from "@/components/ui/layout-skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { InterruptionLayout } from '@/components/interruption/InterruptionLayout';
import { PSBLayout } from './components/psb/PSBLayout';

// Lazy load all page components for better performance
import {
  LazyIndex,
  LazyAuditLogPage,
  LazyProductsPage,
  LazyInventoryPage,
  LazyAssetsPage,
  LazyOrdersPage,
  LazyAlertsPage,
  LazyUsersPage,
  LazySettingsPage,
  LazyDatabasePage,
  LazySecurityPage,
  LazyStockReportPage,
  LazyStockMovementPage,
  LazyApiManagementPage,
  LazyMorePage,
  LazyNotFound,
  LazyTechnicianPage,
  LazyTechnicianReports,
  LazySupervisorDashboard
} from "./components/optimized/LazyRoutes";


// Lazily load additional technician subpages
const LazyTechnicianHistoryPage = lazy(() => import('@/pages/technician/TechnicianHistoryPage'));
const LazyTechnicianProfilePage = lazy(() => import('@/pages/technician/TechnicianProfilePage'));
const LazyTechnicianActivationPage = lazy(() => import('@/pages/technician/TechnicianActivationPage'));
const LazyTechnicianSignatureReport = lazy(() => import('@/pages/technician/TechnicianSignatureReport'));

const App = () => {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <ScrollRestoration />
        <Suspense fallback={<AppLoadingSkeleton />}>
          <Routes>
            {/* PSB Report Routes - Separate App */}
            <Route path="/psb-report/*" element={
              <ProtectedRoute allowedRoles={['superadmin', 'cs']}>
                <PSBLayout />
              </ProtectedRoute>
            } />
            
            {/* Interruption Report Routes */}
            <Route path="/interruption/*" element={
              <ProtectedRoute>
                <InterruptionLayout />
              </ProtectedRoute>
            } />
            
            {/* User accessible routes */}
            <Route path="/" element={<LazyIndex />} />
            <Route path="/audit-log" element={<LazyAuditLogPage />} />
            <Route path="/products" element={<LazyProductsPage />} />
            <Route path="/aset" element={<LazyAssetsPage />} />
            <Route path="/inventory" element={<LazyInventoryPage />} />
            <Route path="/orders" element={<LazyOrdersPage />} />
            <Route path="/more" element={<LazyMorePage />} />
            {/* Technician routes - separate layout */}
            <Route path="/technician" element={
              <ProtectedRoute requiredRole="teknisi">
                <LazyTechnicianPage />
              </ProtectedRoute>
            } />
            <Route path="/technician/*" element={
              <ProtectedRoute requiredRole="teknisi">
                <TechnicianLayout>
                  <Routes>
                    <Route path="/" element={<LazyTechnicianPage />} />
                    <Route path="/activation" element={<LazyTechnicianActivationPage />} />
                    <Route path="/activation/:id/signature" element={<LazyTechnicianSignatureReport />} />
                    <Route path="/reports" element={<LazyTechnicianReports />} />
                    <Route path="/history" element={<LazyTechnicianHistoryPage />} />
                    <Route path="/profile" element={<LazyTechnicianProfilePage />} />
                  </Routes>
                </TechnicianLayout>
              </ProtectedRoute>
            } />

            {/* Supervisor Dashboard - Superadmin only */}
            <Route path="/supervisor" element={
              <ProtectedRoute requiredRole="superadmin">
                <LazySupervisorDashboard />
              </ProtectedRoute>
            } />

            {/* Superadmin-only routes */}
            <Route path="/alerts" element={
              <ProtectedRoute requiredRole="superadmin">
                <LazyAlertsPage />
              </ProtectedRoute>
            } />

            {/* Settings - All users */}
            <Route path="/settings" element={<LazySettingsPage />} />
            

          {/* Admin and Super Admin routes */}
          <Route path="/users" element={
            <ProtectedRoute requiredRole="superadmin">
              <LazyUsersPage />
            </ProtectedRoute>
          } />
          <Route path="/stock-movement" element={
            <ProtectedRoute requiredRole="superadmin">
              <LazyStockMovementPage />
            </ProtectedRoute>
          } />
          <Route path="/security" element={
            <ProtectedRoute requiredRole="superadmin">
              <LazySecurityPage />
            </ProtectedRoute>
          } />
          <Route path="/stock-report" element={
            <ProtectedRoute requiredRole="superadmin">
              <LazyStockReportPage />
            </ProtectedRoute>
          } />

          {/* Super admin-only routes */}
          <Route path="/database" element={
            <ProtectedRoute requiredRole="superadmin">
              <LazyDatabasePage />
            </ProtectedRoute>
          } />
          <Route path="/api-management" element={
            <ProtectedRoute requiredRole="superadmin">
              <LazyApiManagementPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<LazyNotFound />} />
        </Routes>
      </Suspense>
      <OptimizedAlertMonitor />
    </TooltipProvider>
  </ErrorBoundary>
  );
};

// Loading skeleton component that adapts to mobile/desktop
const AppLoadingSkeleton = () => {
  const isMobile = useIsMobile();
  return <LayoutSkeleton isMobile={isMobile} />;
};

export default App;