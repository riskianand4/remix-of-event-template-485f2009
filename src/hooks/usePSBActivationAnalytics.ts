import { useState, useEffect, useCallback, useRef } from 'react';
import { psbActivationApi } from '@/services/psbActivationApi';
import { PSBActivationAnalytics } from '@/types/psb';

class ActivationAnalyticsManager {
  private static instance: ActivationAnalyticsManager;
  private analytics: PSBActivationAnalytics | null = null;
  private loading = false;
  private error: string | null = null;
  private lastFetch = 0;
  private cacheDuration = 300000; // 5 minutes
  private subscribers = new Set<() => void>();
  private activeRequest: Promise<any> | null = null;

  static getInstance(): ActivationAnalyticsManager {
    if (!ActivationAnalyticsManager.instance) {
      ActivationAnalyticsManager.instance = new ActivationAnalyticsManager();
    }
    return ActivationAnalyticsManager.instance;
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  async fetchAnalytics(force = false): Promise<{ success: boolean; data: PSBActivationAnalytics | null }> {
    const now = Date.now();
    
    if (!force && this.analytics && (now - this.lastFetch) < this.cacheDuration) {
      return { success: true, data: this.analytics };
    }

    if (this.activeRequest) {
      return this.activeRequest;
    }

    this.loading = true;
    this.error = null;
    this.notifySubscribers();

    this.activeRequest = this.performFetch();
    const result = await this.activeRequest;
    this.activeRequest = null;

    return result;
  }

  private async performFetch(): Promise<{ success: boolean; data: PSBActivationAnalytics | null }> {
    try {
      const response = await psbActivationApi.getAnalytics();
      
      if (response.success && response.data) {
        this.analytics = response.data;
        this.lastFetch = Date.now();
        this.error = null;
        this.loading = false;
        this.notifySubscribers();
        return { success: true, data: this.analytics };
      }
      
      this.analytics = {
        summary: {
          totalActivations: 0,
          configuredONT: 0,
          pendingONT: 0,
          failedONT: 0,
          averageSignalLevel: 0,
          configurationRate: '0'
        },
        clusterStats: [],
        oltStats: [],
        monthlyTrends: []
      };
      
    } catch (error: any) {
      console.error('Error fetching PSB activation analytics:', error);
      this.error = error.message || 'Failed to fetch activation analytics';
      
      this.analytics = {
        summary: {
          totalActivations: 0,
          configuredONT: 0,
          pendingONT: 0,
          failedONT: 0,
          averageSignalLevel: 0,
          configurationRate: '0'
        },
        clusterStats: [],
        oltStats: [],
        monthlyTrends: []
      };
    } finally {
      this.loading = false;
      this.notifySubscribers();
    }
    
    return { success: false, data: this.analytics };
  }

  getState() {
    return {
      analytics: this.analytics,
      loading: this.loading,
      error: this.error
    };
  }

  clearCache() {
    this.analytics = null;
    this.lastFetch = 0;
    this.error = null;
    this.notifySubscribers();
  }
}

export const usePSBActivationAnalytics = () => {
  const manager = ActivationAnalyticsManager.getInstance();
  const [state, setState] = useState(manager.getState());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = manager.subscribe(() => {
      if (mountedRef.current) {
        setState(manager.getState());
      }
    });
    return unsubscribe;
  }, []);

  const fetchAnalytics = useCallback(async (force = false) => {
    if (!mountedRef.current) return;
    return manager.fetchAnalytics(force);
  }, [manager]);

  const refreshAnalytics = useCallback(() => {
    return fetchAnalytics(true);
  }, [fetchAnalytics]);

  const clearCache = useCallback(() => {
    manager.clearCache();
  }, [manager]);

  useEffect(() => {
    if (!state.analytics && !state.loading) {
      fetchAnalytics();
    }
  }, []);

  return {
    activationAnalytics: state.analytics,
    loading: state.loading,
    error: state.error,
    fetchAnalytics,
    refreshAnalytics,
    clearCache,
  };
};
