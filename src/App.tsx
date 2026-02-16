import { TechnicianLayout } from '@/components/layout/TechnicianLayout';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, lazy } from "react";

import { ScrollRestoration } from "./components/ScrollRestoration";
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { LayoutSkeleton } from "@/components/ui/layout-skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { InterruptionLayout } from '@/components/interruption/InterruptionLayout';
import { PSBLayout } from './components/psb/PSBLayout';

const LazyIndex = lazy(() => import('@/pages/Index'));
const LazyNotFound = lazy(() => import('@/pages/NotFound'));
const LazyTechnicianPage = lazy(() => import('@/pages/TechnicianPage'));
const LazyTechnicianReports = lazy(() => import('@/pages/technician/TechnicianReportsPage'));
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
            {/* Login / redirect */}
            <Route path="/" element={<LazyIndex />} />

            {/* PSB Report Routes */}
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
            
            {/* Technician routes */}
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

            <Route path="*" element={<LazyNotFound />} />
          </Routes>
        </Suspense>
      </TooltipProvider>
    </ErrorBoundary>
  );
};

const AppLoadingSkeleton = () => {
  const isMobile = useIsMobile();
  return <LayoutSkeleton isMobile={isMobile} />;
};

export default App;
