import React, { useState, useMemo } from 'react';
import { Skeleton, StatsCardSkeleton } from '@/components/ui/loading-skeleton';
import { usePSBAnalytics } from '@/hooks/usePSBAnalytics';
import { usePSBActivationAnalytics } from '@/hooks/usePSBActivationAnalytics';
import { useTechnicianData } from '@/hooks/useTechnicianData';
import { PSBReportsHeader } from '@/components/psb/reports/PSBReportsHeader';
import { PSBReportTypeSelector } from '@/components/psb/reports/PSBReportTypeSelector';
import { PSBMetricsCards } from '@/components/psb/reports/PSBMetricsCards';
import { PSBPerformanceCharts } from '@/components/psb/reports/PSBPerformanceCharts';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';
import { 
  calculatePerformanceMetrics, 
  getClusterPerformanceData, 
  getMonthlyTrendData, 
  exportReportData 
} from '@/utils/psbReportUtils';
import { logger } from '@/utils/logger';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears, isWithinInterval, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';

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
    
    switch (filter) {
      case 'today':
        setDateRange({ from: startOfDay(now), to: endOfDay(now) });
        break;
      case 'week':
        setDateRange({ from: startOfWeek(now), to: endOfWeek(now) });
        break;
      case 'month':
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case 'year':
        setDateRange({ from: startOfYear(now), to: endOfYear(now) });
        break;
      case 'last5years':
        setDateRange({ from: subYears(now, 5), to: now });
        break;
      case 'all':
      default:
        setDateRange(undefined);
        break;
    }
  };

  // Calculate derived data (filtering will be implemented in backend later)
  const metrics = calculatePerformanceMetrics(analytics, activationAnalytics);
  const clusterData = getClusterPerformanceData(analytics, activationAnalytics);
  const trendData = getMonthlyTrendData(analytics);

  const loading = orderLoading || activationLoading || technicianLoading;

  const handleExportReport = () => {
    try {
      exportReportData(selectedReport, analytics, activationAnalytics, technicians);
      toast.success(`Report ${selectedReport} exported successfully`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refreshAnalytics(), 
        refreshActivationAnalytics(),
        refetchTechnicians()
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh PSB data', error, 'PSBReports');
      toast.error('Failed to refresh data');
    }
  };


  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 sm:h-8 w-40 sm:w-48" />
            <Skeleton className="h-3 sm:h-4 w-80 sm:w-96" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Skeleton className="h-8 sm:h-9 w-full sm:w-32" />
            <Skeleton className="h-8 sm:h-9 w-full sm:w-32" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        {/* Report Type Selector Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-0">
      {/* Header */}
      <PSBReportsHeader
        dateRange={dateRange}
        onDateChange={(range) => {
          setDateRange(range);
          setActiveFilter('custom');
        }}
        onRefresh={handleRefresh}
        onExport={handleExportReport}
      />

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('all')}
        >
          Semua
        </Button>
        <Button
          variant={activeFilter === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('today')}
        >
          Hari Ini
        </Button>
        <Button
          variant={activeFilter === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('week')}
        >
          Minggu Ini
        </Button>
        <Button
          variant={activeFilter === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('month')}
        >
          Bulan Ini
        </Button>
        <Button
          variant={activeFilter === 'year' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('year')}
        >
          Tahun Ini
        </Button>
        <Button
          variant={activeFilter === 'last5years' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('last5years')}
        >
          5 Tahun Terakhir
        </Button>
      </div>

      {/* Report Type Selection */}
      {/* <PSBReportTypeSelector
        selectedReport={selectedReport}
        onReportChange={setSelectedReport}
      /> */}

      {/* Performance Metrics Cards */}
      <PSBMetricsCards
        overallEfficiency={metrics.overallEfficiency}
        installationEfficiency={metrics.installationEfficiency}
        activationEfficiency={metrics.activationEfficiency}
        avgSignalLevel={metrics.avgSignalLevel}
      />

      {/* Performance Charts */}
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