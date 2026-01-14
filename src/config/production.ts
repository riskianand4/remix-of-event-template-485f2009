// Production configuration settings
interface ProductionConfig {
  // Performance settings
  PERFORMANCE: {
    BUNDLE_SIZE_LIMIT: number;
    MEMORY_LIMIT: number;
    LOAD_TIME_LIMIT: number;
    ERROR_RATE_LIMIT: number;
  };
  
  // Security settings
  SECURITY: {
    ENABLE_CSP: boolean;
    STRICT_CORS: boolean;
    DISABLE_CONSOLE_LOGS: boolean;
    ENABLE_ERROR_REPORTING: boolean;
  };
  
  // API settings
  API: {
    TIMEOUT: number;
    RETRY_ATTEMPTS: number;
    RATE_LIMIT_PER_MINUTE: number;
  };
  
  // Cache settings
  CACHE: {
    STATIC_CACHE_DURATION: number;
    API_CACHE_DURATION: number;
    ENABLE_SERVICE_WORKER: boolean;
  };
}

export const PRODUCTION_CONFIG: ProductionConfig = {
  PERFORMANCE: {
    BUNDLE_SIZE_LIMIT: 5 * 1024 * 1024, // 5MB
    MEMORY_LIMIT: 100 * 1024 * 1024, // 100MB  
    LOAD_TIME_LIMIT: 3000, // 3 seconds
    ERROR_RATE_LIMIT: 0.05, // 5%
  },
  
  SECURITY: {
    ENABLE_CSP: false,
    STRICT_CORS: false,
    DISABLE_CONSOLE_LOGS: false,
    ENABLE_ERROR_REPORTING: false,
  },
  
  API: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RATE_LIMIT_PER_MINUTE: 60,
  },
  
  CACHE: {
    STATIC_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    API_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    ENABLE_SERVICE_WORKER: true,
  },
};

// Security headers configuration
export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://api.* wss://*; font-src 'self' data:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

// Environment validation
export const validateProductionEnvironment = (): string[] => {
  const errors: string[] = [];
  
  // Check critical environment variables
  const requiredEnvVars = ['NODE_ENV', 'VITE_API_BASE_URL'];
  
  requiredEnvVars.forEach(envVar => {
    if (!import.meta.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  });
  
  // Validate API URL format
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiUrl && !apiUrl.match(/^https?:\/\/.+/)) {
    errors.push('API_BASE_URL must be a valid HTTP(S) URL');
  }
  
  // Check for development values in production
  if (import.meta.env.PROD) {
    if (apiUrl?.includes('localhost') || apiUrl?.includes('127.0.0.1')) {
      errors.push('Production build should not use localhost API URL');
    }
  }
  
  return errors;
};