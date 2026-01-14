import { useState, useEffect, useCallback } from 'react';
import { StockAlert } from '@/types/stock-movement';

export const useOptimizedStockAlerts = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      // Mock alerts for now - will be replaced with actual API
      const mockAlerts: StockAlert[] = [];
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissAlert = useCallback(async (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    criticalAlerts: alerts.filter(alert => alert.severity === 'critical'),
    loading,
    fetchAlerts,
    dismissAlert,
    acknowledgeAlert: (id: string, userId?: string) => dismissAlert(id),
    getAlertStats: () => ({ total: 0, critical: 0, high: 0, medium: 0, low: 0, unacknowledged: 0 }),
  };
};