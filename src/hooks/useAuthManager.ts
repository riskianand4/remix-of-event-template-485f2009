import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/auth';
import { apiClient, ApiClientError, LoginResponse } from '@/services/apiClient';
import { toast } from 'sonner';
import { createComponentLogger } from '@/utils/logger';
import { secureStorageManager } from '@/utils/secureStorage';
import { sessionManager } from '@/utils/sessionManager';
import { deviceFingerprintManager } from '@/utils/deviceFingerprint';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export const useAuthManager = () => {
  const logger = createComponentLogger('AuthManager');
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Initialize auth state with enhanced security
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        // Priority 1: Check plain auth-token first (most reliable)
        const plainToken = localStorage.getItem('auth-token');
        const savedUser = localStorage.getItem('user');

        if (!plainToken || !savedUser) {
          if (isMounted) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
          return;
        }

        // Set token immediately for subsequent requests
        apiClient.setToken(plainToken);

        // Parse user data
        const userData = JSON.parse(savedUser);

        // Set authenticated state FIRST (don't block user)
        if (isMounted) {
          setAuthState({
            user: userData,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        }

        // Start session monitoring
        sessionManager.startSessionMonitoring();
        logger.info('Auth initialized successfully');

        // Skip verification if user just logged in (within last 5 minutes)
        const shouldSkipVerification = secureStorageManager.isRecentLogin(300000);

        if (shouldSkipVerification) {
          logger.info('Skipping token verification - recent login');
          return;
        }

        // Optional: Verify token in background (non-blocking)
        apiClient.verifyToken().then(response => {
          if (!response || !response.success) {
            logger.warn('Background token verification failed');
          } else {
            logger.info('Background token verification successful');
          }
        }).catch(error => {
          // Only logout on explicit 401 errors
          if (error && error.status === 401) {
            logger.warn('Token invalid (401), logging out');
            if (isMounted) {
              setAuthState({
                user: null,
                isLoading: false,
                isAuthenticated: false,
                error: 'Session expired',
              });
            }
            secureStorageManager.clearSecureToken();
            apiClient.setToken(null);
            sessionManager.stopSessionMonitoring();
          } else {
            // Network error - keep user logged in
            logger.warn('Background verification error (keeping session)', error);
          }
        });
      } catch (error) {
        logger.error('Auth initialization error', error);
        if (isMounted) {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Auth initialization failed',
          }));
        }
      }
    };

    // Initialize auth
    const timer = setTimeout(initializeAuth, 200);
    
    // Listen for session expiry events
    const handleSessionExpired = (event: CustomEvent) => {
      logger.warn('Session expired event received', event.detail);
      toast.error(`Session expired: ${event.detail.reason}`);
      
      if (isMounted) {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: event.detail.reason,
        });
      }
    };

    window.addEventListener('session-expired', handleSessionExpired as EventListener);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
      sessionManager.stopSessionMonitoring();
      window.removeEventListener('session-expired', handleSessionExpired as EventListener);
    };
  }, []); // No dependencies to prevent re-runs

  const login = useCallback(async (email: string, password: string): Promise<boolean | { requiresEmailVerification: boolean; email: string; userName?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      logger.info('Attempting login', { email });
      // Get device fingerprint for secure login
      const deviceFingerprint = await deviceFingerprintManager.getFingerprint();
      
      // Send login request with device fingerprint
      const loginResponse = await apiClient.login(email, password, deviceFingerprint);
      logger.info('Login response received', { success: loginResponse.success });

      if (loginResponse.success && loginResponse.token && loginResponse.user) {
        // Standardize role format - backend uses 'super_admin', frontend uses 'superadmin'
        const normalizeRole = (role: string): 'user' | 'superadmin' | 'teknisi' | 'cs' => {
          if (role === 'super_admin') return 'superadmin';
          if (['user', 'superadmin', 'teknisi', 'cs'].includes(role)) return role as 'user' | 'superadmin' | 'teknisi' | 'cs';
          return 'user'; // default fallback
        };

        const userData: User = {
          id: loginResponse.user.id,
          username: loginResponse.user.email,
          email: loginResponse.user.email,
          role: normalizeRole(loginResponse.user.role),
          name: loginResponse.user.name || loginResponse.user.email,
        };

        // Save token securely with device binding
        await secureStorageManager.storeSecureToken(loginResponse.token, userData);
        
        // Set token in API client IMMEDIATELY
        apiClient.setToken(loginResponse.token);
        logger.info('Token set in apiClient', { tokenPreview: loginResponse.token.substring(0, 20) + '...' });

        setAuthState({
          user: userData,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });

        // Start session monitoring
        sessionManager.startSessionMonitoring();
        
        toast.success(`Welcome back, ${userData.name}!`);

        return true;
      } else {
        throw new Error(loginResponse.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof ApiClientError 
        ? error.message 
        : error instanceof Error 
          ? error.message 
          : 'Login failed';

      // Check if error is due to unverified email
      if (error instanceof ApiClientError && error.details?.requiresEmailVerification) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        toast.error(errorMessage);

        return {
          requiresEmailVerification: true,
          email: error.details.email || email,
          userName: error.details.userName
        };
      }

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      toast.error(`Login Failed: ${errorMessage}`);

      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    // Clear state
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });

    // Stop session monitoring
    sessionManager.stopSessionMonitoring();

    // Clear secure storage
    await secureStorageManager.clearSecureToken();
    
    // Clear API client token
    apiClient.setToken(null);

    toast.success('You have been successfully logged out.');
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await apiClient.refreshToken();
      
      if (response.success && response.data) {
        const tokenData = response.data as { token?: string };
        if (tokenData.token) {
          localStorage.setItem('auth-token', tokenData.token);
          apiClient.setToken(tokenData.token);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      logger.error('Token refresh failed', error);
      logout();
      return false;
    }
  }, [logout]);

  // Auto refresh token before expiry
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    // Refresh token every 6 hours (token valid for 7 days)
    const interval = setInterval(() => {
      refreshAuth();
    }, 6 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, refreshAuth]);

  return {
    ...authState,
    login,
    logout,
    refreshAuth,
  };
};