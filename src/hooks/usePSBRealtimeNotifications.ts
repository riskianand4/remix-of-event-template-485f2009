import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { psbActivationApi } from '@/services/psbActivationApi';
import { PSBActivation } from '@/types/psb';

interface PSBNotification {
  id: string;
  type: 'new_activation' | 'status_change' | 'assignment';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  activationId: string;
  customerName: string;
}

const POLL_INTERVAL = 30000; // 30 seconds
const STORAGE_KEY = 'psb-notifications';
const LAST_CHECK_KEY = 'psb-last-notification-check';

export const usePSBRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<PSBNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();
  const lastCheckRef = useRef<string | null>(null);
  const previousActivationsRef = useRef<string[]>([]);

  // Load saved notifications from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed.map((n: PSBNotification) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        })));
      } catch (error) {
        console.error('Failed to parse saved notifications:', error);
      }
    }
    
    if (lastCheck) {
      lastCheckRef.current = lastCheck;
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, body: string, onClick?: () => void) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/logo/Logo.png',
        badge: '/logo/Logo.png',
        tag: 'psb-notification',
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        onClick?.();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  }, []);

  // Add new notification
  const addNotification = useCallback((
    type: PSBNotification['type'],
    title: string,
    message: string,
    activationId: string,
    customerName: string
  ) => {
    const notification: PSBNotification = {
      id: `psb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      activationId,
      customerName,
    };

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep max 50 notifications

    // Show toast
    toast({
      title,
      description: message,
      duration: 5000,
    });

    // Show browser notification
    showBrowserNotification(title, message, () => {
      window.location.href = `/technician/activation/${activationId}/signature`;
    });

    return notification.id;
  }, [toast, showBrowserNotification]);

  // Check for new activations
  const checkForNewActivations = useCallback(async () => {
    try {
      setIsPolling(true);
      
      // Get user data to check if technician
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      if (user.role !== 'teknisi') return;

      const response = await psbActivationApi.getActivations({
        ontStatus: 'pending',
        limit: 10,
      });

      if (response.success && response.data) {
        const activations = Array.isArray(response.data) ? response.data : [response.data];
        
        // Filter activations assigned to this technician or unassigned
        const relevantActivations = activations.filter((a: PSBActivation) => 
          !a.technician || a.technician === user.id || a.technician === user.name
        );

        const currentIds = relevantActivations.map((a: PSBActivation) => a._id);
        
        // Find new activations (not in previous list)
        if (previousActivationsRef.current.length > 0) {
          const newActivations = relevantActivations.filter((a: PSBActivation) => {
            return !previousActivationsRef.current.includes(a._id);
          });

          // Notify for each new activation
          newActivations.forEach((activation: PSBActivation) => {
            addNotification(
              'new_activation',
              '🆕 Aktivasi PSB Baru!',
              `Pelanggan: ${activation.customerName} - ${activation.cluster}`,
              activation._id,
              activation.customerName
            );
          });
        }

        // Update previous activations reference
        previousActivationsRef.current = currentIds;
        
        // Update last check timestamp
        const now = new Date().toISOString();
        lastCheckRef.current = now;
        localStorage.setItem(LAST_CHECK_KEY, now);
      }
    } catch (error) {
      console.error('Error checking for new activations:', error);
    } finally {
      setIsPolling(false);
    }
  }, [addNotification]);

  // Start polling for new activations
  useEffect(() => {
    // Request notification permission on mount
    requestNotificationPermission();

    // Initial check
    checkForNewActivations();

    // Set up polling interval
    const intervalId = setInterval(checkForNewActivations, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [checkForNewActivations, requestNotificationPermission]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    checkForNewActivations();
  }, [checkForNewActivations]);

  return {
    notifications,
    unreadCount,
    isPolling,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    refresh,
    requestNotificationPermission,
  };
};

export default usePSBRealtimeNotifications;
