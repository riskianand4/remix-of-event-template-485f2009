import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PSBDashboard } from '@/pages/psb/PSBDashboard';
import { PSBInputData } from '@/pages/psb/PSBInputData';
import { PSBDistribution } from '@/pages/psb/PSBDistribution';
import { PSBActivationPage as PSBActivation } from '@/pages/psb/PSBActivation';
import { PSBReports } from '@/pages/psb/PSBReports';
import { PSBAnalytics } from '@/pages/psb/PSBAnalytics';
import { PSBDataManagement } from '@/pages/psb/PSBDataManagement';

const PSBProfilePage = lazy(() => import('@/pages/psb/PSBProfilePage'));

export const PSBRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<PSBDashboard />} />
      <Route path="input" element={<PSBInputData />} />
      <Route path="distribution" element={<PSBDistribution />} />
      <Route path="activation" element={<PSBActivation />} />
      <Route path="reports" element={<PSBReports />} />
      <Route path="analytics" element={<PSBAnalytics />} />
      <Route path="data" element={<PSBDataManagement />} />
      <Route path="profile" element={<PSBProfilePage />} />
    </Routes>
  );
};