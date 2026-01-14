import { createComponentLogger } from '@/utils/logger';
import { secureStorageManager } from './secureStorage';
import { apiClient } from '@/services/apiClient';

interface SessionInfo {
  id: string;
  deviceId: string;
  ipAddress?: string;
  userAgent: string;
  createdAt: number;
  lastActivity: number;
  isActive: boolean;
}

interface SessionValidationResult {
  isValid: boolean;
  shouldRefresh: boolean;
  reason?: string;
  remainingTime?: number;
}

class SessionManager {
  private logger = createComponentLogger('SessionManager');
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
  private readonly REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour before expiry
  private readonly ACTIVITY_TRACKING_INTERVAL = 2 * 60 * 1000; // 2 minutes

  // Start session monitoring
  startSessionMonitoring(): void {
    this.stopSessionMonitoring(); // Clear any existing interval
    
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionValidity();
    }, this.ACTIVITY_TRACKING_INTERVAL);

    // Track user activity
    this.setupActivityTracking();
    
    this.logger.info('Session monitoring started');
  }

  // Stop session monitoring
  stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    
    this.logger.info('Session monitoring stopped');
  }

  // Setup activity tracking (mouse, keyboard, scroll events)
  private setupActivityTracking(): void {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    let lastActivity = Date.now();

    const updateActivity = () => {
      const now = Date.now();
      // Only update if more than 1 minute since last update (reduce localStorage writes)
      if (now - lastActivity > 60000) {
        lastActivity = now;
        localStorage.setItem('lastActivity', now.toString());
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Initial activity timestamp
    localStorage.setItem('lastActivity', Date.now().toString());
  }

  // Check if current session is valid
  async validateSession(): Promise<SessionValidationResult> {
    try {
      const tokenResult = await secureStorageManager.getSecureToken();
      
      if (!tokenResult || !tokenResult.isValid) {
        return {
          isValid: false,
          shouldRefresh: false,
          reason: tokenResult?.reason || 'No valid token'
        };
      }

      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
      const timeSinceActivity = Date.now() - lastActivity;

      // Check if session expired due to inactivity
      if (timeSinceActivity > this.SESSION_DURATION) {
        this.logger.warn('Session expired due to inactivity', { 
          timeSinceActivity: Math.round(timeSinceActivity / 60000) + ' minutes' 
        });
        
        return {
          isValid: false,
          shouldRefresh: false,
          reason: 'Session expired due to inactivity'
        };
      }

      // Check if we should refresh the token soon
      const shouldRefresh = timeSinceActivity > (this.SESSION_DURATION - this.REFRESH_THRESHOLD);
      const remainingTime = this.SESSION_DURATION - timeSinceActivity;

      return {
        isValid: true,
        shouldRefresh,
        remainingTime
      };
    } catch (error) {
      this.logger.error('Session validation failed', error);
      return {
        isValid: false,
        shouldRefresh: false,
        reason: 'Validation error'
      };
    }
  }

  // Check session validity periodically
  private async checkSessionValidity(): Promise<void> {
    try {
      const validation = await this.validateSession();
      
      if (!validation.isValid) {
        this.logger.warn('Session invalid, logging out', { reason: validation.reason });
        await this.invalidateSession();
        
        // Trigger logout event
        window.dispatchEvent(new CustomEvent('session-expired', { 
          detail: { reason: validation.reason } 
        }));
        return;
      }

      if (validation.shouldRefresh) {
        this.logger.info('Attempting token refresh');
        await this.refreshSession();
      }

      // Log remaining time for debugging
      if (validation.remainingTime) {
        this.logger.debug('Session time remaining', { 
          minutes: Math.round(validation.remainingTime / 60000) 
        });
      }
    } catch (error) {
      this.logger.error('Session check failed', error);
    }
  }

  // Refresh session token
  private async refreshSession(): Promise<boolean> {
    try {
      const response = await apiClient.refreshToken();
      
      if (response.success && response.data) {
        const tokenData = response.data as { token?: string; user?: any };
        
        if (tokenData.token) {
          // Store new token securely  
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          await secureStorageManager.storeSecureToken(tokenData.token, user);
          
          // Update API client token
          apiClient.setToken(tokenData.token);
          
          // Update activity timestamp
          localStorage.setItem('lastActivity', Date.now().toString());
          
          this.logger.info('Session refreshed successfully');
          return true;
        }
      }
      
      this.logger.warn('Token refresh failed');
      return false;
    } catch (error) {
      this.logger.error('Session refresh error', error);
      return false;
    }
  }

  // Invalidate current session
  async invalidateSession(): Promise<void> {
    try {
      // Clear secure storage
      await secureStorageManager.clearSecureToken();
      
      // Clear API client token
      apiClient.setToken(null);
      
      // Stop monitoring
      this.stopSessionMonitoring();
      
      this.logger.info('Session invalidated');
    } catch (error) {
      this.logger.error('Session invalidation failed', error);
    }
  }

  // Get session info for display
  getSessionInfo(): SessionInfo | null {
    try {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
      const lastLoginTime = parseInt(localStorage.getItem('lastLoginTime') || '0');
      const deviceFingerprint = localStorage.getItem('device-fingerprint');
      
      if (!deviceFingerprint || !lastLoginTime) {
        return null;
      }

      const fingerprint = JSON.parse(deviceFingerprint);
      
      return {
        id: fingerprint.id.substring(0, 8),
        deviceId: fingerprint.id,
        userAgent: navigator.userAgent,
        createdAt: lastLoginTime,
        lastActivity,
        isActive: Date.now() - lastActivity < this.SESSION_DURATION
      };
    } catch (error) {
      this.logger.error('Failed to get session info', error);
      return null;
    }
  }

  // Force session refresh
  async forceRefresh(): Promise<boolean> {
    this.logger.info('Force refreshing session');
    return await this.refreshSession();
  }
}

export const sessionManager = new SessionManager();
export type { SessionInfo, SessionValidationResult };