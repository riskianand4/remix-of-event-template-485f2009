import { useState, useCallback } from 'react';
import { StockAlert } from '@/types/stock-movement';

export const useStockAlerts = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const addAlert = useCallback((alert: Omit<StockAlert, 'id' | 'createdAt'>) => {
    const newAlert: StockAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random()}`,
      createdAt: new Date(),
    };
    
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const checkStockLevels = useCallback((products: any[]) => {
    // Mock stock checking - disabled for now
  }, []);

  return {
    alerts,
    criticalAlerts: alerts.filter(alert => alert.severity === 'critical'),
    loading,
    addAlert,
    dismissAlert,
    checkStockLevels,
    getAlertsByProduct: () => [],
    acknowledgeAlert: (id: string, userId?: string) => dismissAlert(id),
    getAlertStats: () => ({ total: 0, critical: 0, high: 0, medium: 0, low: 0, unacknowledged: 0 }),
    autoAlerts: [],
    acknowledgeAutoAlert: (id: string, userId?: string) => dismissAlert(id),
  };
};