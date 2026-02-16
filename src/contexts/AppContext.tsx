import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuthManager } from "@/hooks/useAuthManager";
import { toast } from "sonner";
import { createComponentLogger } from "@/utils/logger";
import { ENV } from "@/config/environment";
import type { User } from "@/types/auth";

interface AppConfig {
  apiEnabled: boolean;
  baseURL: string;
  version: string;
}

interface ConnectionStatus {
  isOnline: boolean;
  lastCheck: Date | null;
  error: string | null;
}

interface ConnectionMetrics {
  latency: number | null;
  lastSuccessfulRequest: Date | null;
  consecutiveFailures: number;
  isHealthy: boolean;
}

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean | { requiresEmailVerification: boolean; email: string; userName?: string }>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  config: AppConfig;
  setConfig: (config: Partial<AppConfig>) => void;
  connectionStatus: ConnectionStatus;
  connectionMetrics: ConnectionMetrics;
  testConnection: () => Promise<boolean>;
  isConfigured: boolean;
  isOnline: boolean;
  clearConfig: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

const getDefaultConfig = (): AppConfig => ({
  apiEnabled: true,
  baseURL: ENV.API_BASE_URL,
  version: ENV.VERSION,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authManager = useAuthManager();
  const logger = createComponentLogger('AppContext');

  const [config, setConfigState] = useState<AppConfig>(() => {
    const saved = localStorage.getItem("app-config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...getDefaultConfig(), 
          ...parsed,
          baseURL: parsed.baseURL && parsed.baseURL !== 'http://103.169.41.9:3001' 
            ? parsed.baseURL 
            : ENV.API_BASE_URL
        };
      } catch (error) {}
    }
    return getDefaultConfig();
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: false,
    lastCheck: null,
    error: null,
  });

  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>({
    latency: null,
    lastSuccessfulRequest: null,
    consecutiveFailures: 0,
    isHealthy: false,
  });

  const setConfig = (newConfig: Partial<AppConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfigState(updatedConfig);
    localStorage.setItem("app-config", JSON.stringify(updatedConfig));
  };

  const testConnection = async (): Promise<boolean> => {
    return true;
  };

  const clearConfig = () => {
    setConfigState(getDefaultConfig());
    localStorage.removeItem("app-config");
  };

  useEffect(() => {
    if (authManager.isAuthenticated) {
      setConnectionStatus(prev => ({
        ...prev,
        isOnline: true,
        error: null,
        lastCheck: new Date()
      }));
    }
  }, [authManager.isAuthenticated]);

  const value: AppContextType = {
    ...authManager,
    config,
    setConfig,
    connectionStatus,
    connectionMetrics,
    testConnection,
    isConfigured: config.apiEnabled,
    isOnline: connectionStatus.isOnline,
    clearConfig,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
