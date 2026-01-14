import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export const useErrorHandler = (component?: string) => {
  const { toast } = useToast();

  const logError = useCallback((
    error: Error | string,
    action?: string,
    showToast: boolean = true
  ) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const componentName = component || 'Unknown';
    
    logger.error(errorMessage, error, componentName);

    if (showToast) {
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }

    return error instanceof Error ? error : new Error(error);
  }, [component, toast]);

  const logApiError = useCallback((
    error: Error,
    endpoint: string,
    action: string,
    showToast: boolean = true
  ) => {
    const errorMessage = error.message;
    
    logger.error(`API Error: ${endpoint} - ${action}`, error, component);

    if (showToast) {
      toast({
        title: 'API Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }

    return error;
  }, [component, toast]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    action: string,
    fallback?: T
  ): Promise<T | undefined> => {
    try {
      return await asyncFn();
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), action);
      return fallback;
    }
  }, [logError]);

  return {
    logError,
    logApiError,
    handleAsyncError,
    getErrorStats: () => ({ totalErrors: 0, byLevel: {}, byComponent: {} }),
    clearErrors: () => {},
  };
};
