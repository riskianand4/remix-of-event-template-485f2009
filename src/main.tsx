import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider } from './components/ui/theme-provider.tsx'
import { AppProvider } from './contexts/AppContext.tsx'
import App from './App.tsx'
import './index.css'
import { logger } from './utils/logger.ts'
import { replaceConsoleWithLogger } from './utils/productionLogger.ts'
import { validateProductionEnvironment } from './config/production.ts'
import { performanceOptimizer } from './utils/performanceOptimizer.ts'
import { productionSecurity } from './utils/productionSecurity.ts'

// Validate environment before starting
const envErrors = validateProductionEnvironment();
if (envErrors.length > 0) {
  console.error('Environment validation failed:', envErrors);
  if (import.meta.env.PROD) {
    // In production, log error and continue with fallbacks
    logger.error('Production environment validation failed', { errors: envErrors });
  }
}

// Initialize production optimizations (security disabled for compatibility)
if (!import.meta.env.DEV) {
  // replaceConsoleWithLogger(); // Disabled - allow console for debugging
  performanceOptimizer.initialize();
  // productionSecurity.initialize(); // Disabled - too strict, blocks inline styles
}

// Initialize error reporting
logger.info('Application starting', {
  mode: import.meta.env.MODE,
  timestamp: new Date().toISOString(),
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('401')) {
          return false; // Don't retry auth errors
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="inventory-theme">
        <AppProvider>
          <BrowserRouter>
            <App />
            <Toaster 
              position="bottom-right"
              expand={false}
              richColors
              closeButton
              duration={4000}
            />
          </BrowserRouter>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
