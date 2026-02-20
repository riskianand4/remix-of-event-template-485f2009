import React, { useState } from 'react';
import { Skeleton, StatsCardSkeleton } from '@/components/ui/loading-skeleton';
import { usePSBAnalytics } from '@/hooks/usePSBAnalytics';
import { usePSBActivationAnalytics } from '@/hooks/usePSBActivationAnalytics';
import { useTechnicianData } from '@/hooks/useTechnicianData';
import { PSBReportsHeader } from '@/components/psb/reports/PSBReportsHeader';
import { PSBMetricsCards } from '@/components/psb/reports/PSBMetricsCards';
import { PSBPerformanceCharts } from '@/components/psb/reports/PSBPerformanceCharts';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';
import { 
  calculatePerformanceMetrics, getClusterPerformanceData, 
  getMonthlyTrendData, exportReportData 
} from '@/utils/psbReportUtils';
import { logger } from '@/utils/logger';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from 'date-fns';
import { motion } from 'framer-motion';

const quickFilters = [
  { id: 'all', label: 'Semua' },
  { id: 'today', label: 'Hari Ini' },
  { id: 'week', label: 'Minggu Ini' },
  { id: 'month', label: 'Bulan Ini' },
  { id: 'year', label: 'Tahun Ini' },
  { id: 'last5years', label: '5 Tahun' },
];

export const PSBReports: React.FC = () => {
  const { analytics, loading: orderLoading, refreshAnalytics } = usePSBAnalytics();
  const { activationAnalytics, loading: activationLoading, refreshAnalytics: refreshActivationAnalytics } = usePSBActivationAnalytics();
  const { technicians, loading: technicianLoading, refetch: refetchTechnicians } = useTechnicianData();
  const [selectedReport, setSelectedReport] = useState('summary');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const handleQuickFilter = (filter: string) => {
    setActiveFilter(filter);
    const now = new Date();
    const rangeMap: Record<string, DateRange | undefined> = {
      today: { from: startOfDay(now), to: endOfDay(now) },
      week: { from: startOfWeek(now), to: endOfWeek(now) },
      month: { from: startOfMonth(now), to: endOfMonth(now) },
      year: { from: startOfYear(now), to: endOfYear(now) },
      last5years: { from: subYears(now, 5), to: now },
      all: undefined,
    };
    setDateRange(rangeMap[filter]);
  };

  const metrics = calculatePerformanceMetrics(analytics, activationAnalytics);
  const clusterData = getClusterPerformanceData(analytics, activationAnalytics);
  const trendData = getMonthlyTrendData(analytics);
  const loading = orderLoading || activationLoading || technicianLoading;

  const handleExportReport = () => {
    try {
      exportReportData(selectedReport, analytics, activationAnalytics, technicians);
      toast.success(`Report ${selectedReport} exported successfully`);
    } catch { toast.error('Failed to export report'); }
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([refreshAnalytics(), refreshActivationAnalytics(), refetchTechnicians()]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh PSB data', error, 'PSBReports');
      toast.error('Failed to refresh data');
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (<StatsCardSkeleton key={i} />))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-0">
      <PSBReportsHeader
        dateRange={dateRange}
        onDateChange={(range) => { setDateRange(range); setActiveFilter('custom'); }}
        onRefresh={handleRefresh}
        onExport={handleExportReport}
      />

      {/* Pill-style Quick Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex gap-1.5 p-1 bg-muted/50 rounded-lg w-fit">
          {quickFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => handleQuickFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeFilter === f.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      <PSBMetricsCards
        overallEfficiency={metrics.overallEfficiency}
        installationEfficiency={metrics.installationEfficiency}
        activationEfficiency={metrics.activationEfficiency}
        avgSignalLevel={metrics.avgSignalLevel}
      />

      <PSBPerformanceCharts
        trendData={trendData}
        clusterData={clusterData}
        technicianData={technicians}
        activationAnalytics={activationAnalytics}
        bottleneckPhase={metrics.bottleneckPhase}
      />
    </div>
  );
};
