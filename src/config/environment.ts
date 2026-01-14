// Environment configuration for frontend
interface EnvironmentConfig {
  API_BASE_URL: string;
  IS_DEVELOPMENT: boolean;
  VERSION: string;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  const isDevelopment = import.meta.env.MODE === 'development';
  
  // Dynamic API base URL configuration
  let baseURL: string;
  
  if (import.meta.env.VITE_API_BASE_URL) {
    // Use configured URL from environment
    baseURL = import.meta.env.VITE_API_BASE_URL;
  } else if (import.meta.env.PROD) {
    // Production fallback
    baseURL = 'https://api.inventori.telnet.id';
  } else {
    // Development fallback
    baseURL = 'http://localhost:3001';
  }
  
  // Remove trailing slash if present
  baseURL = baseURL.replace(/\/$/, '');
  
  return {
    API_BASE_URL: baseURL,
    IS_DEVELOPMENT: isDevelopment,
    VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  };
};

export const ENV = getEnvironmentConfig();

export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    VERIFY: '/api/auth/verify',
  },
  PRODUCTS: '/api/products',
  ANALYTICS: '/api/analytics',
  STOCK: '/api/stock',
  ASSETS: '/api/assets',
  USERS: '/api/users',
  REPORTS: '/api/reports',
  AI: '/api/ai',
  PSB: {
    ORDERS: '/api/psb-orders',
    ANALYTICS: '/api/psb-orders/analytics',
    ACTIVATIONS: '/api/psb-activations',
    ACTIVATION_ANALYTICS: '/api/psb-activations/analytics',
  },
  EXTERNAL: {
    PRODUCTS: '/api/external/products',
    ANALYTICS: '/api/external/analytics',
    HEALTH: '/api/external/health',
    DOCS: '/api/external/docs',
  },
} as const;

export default ENV;
