// Production-ready toast notifications with Indonesian messages
import { toast } from 'sonner';
import { INDONESIAN_MESSAGES, mapErrorToIndonesian } from '@/utils/indonesianTranslations';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick: () => void;
  };
}

class ProductionToast {
  // Success messages
  success(message: string, options?: ToastOptions) {
    toast.success(message, {
      duration: options?.duration || 4000,
      action: options?.action,
      cancel: options?.cancel,
    });
  }

  // Error messages with automatic translation
  error(error: Error | string, options?: ToastOptions) {
    const message = mapErrorToIndonesian(error);
    toast.error(message, {
      duration: options?.duration || 6000,
      action: options?.action || {
        label: 'Tutup',
        onClick: () => toast.dismiss(),
      },
      cancel: options?.cancel,
    });
  }

  // Warning messages  
  warning(message: string, options?: ToastOptions) {
    toast.warning(message, {
      duration: options?.duration || 5000,
      action: options?.action,
      cancel: options?.cancel,
    });
  }

  // Info messages
  info(message: string, options?: ToastOptions) {
    toast.info(message, {
      duration: options?.duration || 4000,
      action: options?.action,
      cancel: options?.cancel,
    });
  }

  // Loading state
  loading(message: string = INDONESIAN_MESSAGES.SYSTEM.LOADING) {
    return toast.loading(message);
  }

  // Dismiss specific toast
  dismiss(toastId?: string | number) {
    toast.dismiss(toastId);
  }

  // Authentication specific toasts
  auth = {
    loginSuccess: () => this.success(INDONESIAN_MESSAGES.AUTH.LOGIN_SUCCESS),
    loginFailed: () => this.error(INDONESIAN_MESSAGES.AUTH.LOGIN_FAILED),
    logoutSuccess: () => this.success(INDONESIAN_MESSAGES.AUTH.LOGOUT_SUCCESS),
    sessionExpired: () => this.warning(INDONESIAN_MESSAGES.AUTH.SESSION_EXPIRED),
    unauthorized: () => this.error(INDONESIAN_MESSAGES.AUTH.UNAUTHORIZED),
  };

  // Data operation toasts
  data = {
    saveSuccess: () => this.success(INDONESIAN_MESSAGES.DATA.SAVE_SUCCESS),
    saveFailed: () => this.error(INDONESIAN_MESSAGES.DATA.SAVE_FAILED),
    deleteSuccess: () => this.success(INDONESIAN_MESSAGES.DATA.DELETE_SUCCESS),
    deleteFailed: () => this.error(INDONESIAN_MESSAGES.DATA.DELETE_FAILED),
    updateSuccess: () => this.success(INDONESIAN_MESSAGES.DATA.UPDATE_SUCCESS),
    updateFailed: () => this.error(INDONESIAN_MESSAGES.DATA.UPDATE_FAILED),
    loadFailed: () => this.error(INDONESIAN_MESSAGES.DATA.LOAD_FAILED),
  };

  // Network specific toasts
  network = {
    offline: () => this.warning(INDONESIAN_MESSAGES.SYSTEM.OFFLINE, {
      duration: 0, // Persistent until dismissed
      action: {
        label: 'Coba Lagi',
        onClick: () => window.location.reload(),
      },
    }),
    online: () => this.success(INDONESIAN_MESSAGES.SYSTEM.ONLINE),
    connectionError: () => this.error(INDONESIAN_MESSAGES.NETWORK.CONNECTION_ERROR),
    serverError: () => this.error(INDONESIAN_MESSAGES.NETWORK.SERVER_ERROR),
    timeout: () => this.error(INDONESIAN_MESSAGES.NETWORK.TIMEOUT),
  };

  // Inventory specific toasts
  inventory = {
    stockLow: (productName: string) => 
      this.warning(`${INDONESIAN_MESSAGES.INVENTORY.STOCK_LOW}: ${productName}`),
    stockOut: (productName: string) => 
      this.error(`${INDONESIAN_MESSAGES.INVENTORY.STOCK_OUT}: ${productName}`),
    stockUpdated: () => this.success(INDONESIAN_MESSAGES.INVENTORY.STOCK_UPDATED),
    productAdded: () => this.success(INDONESIAN_MESSAGES.INVENTORY.PRODUCT_ADDED),
    productUpdated: () => this.success(INDONESIAN_MESSAGES.INVENTORY.PRODUCT_UPDATED),
    productDeleted: () => this.success(INDONESIAN_MESSAGES.INVENTORY.PRODUCT_DELETED),
    insufficientStock: () => this.error(INDONESIAN_MESSAGES.INVENTORY.INSUFFICIENT_STOCK),
  };

  // PSB specific toasts
  psb = {
    orderCreated: () => this.success(INDONESIAN_MESSAGES.PSB.ORDER_CREATED),
    orderUpdated: () => this.success(INDONESIAN_MESSAGES.PSB.ORDER_UPDATED),
    orderCancelled: () => this.success(INDONESIAN_MESSAGES.PSB.ORDER_CANCELLED),
    assignmentSuccess: () => this.success(INDONESIAN_MESSAGES.PSB.ASSIGNMENT_SUCCESS),
    activationSuccess: () => this.success(INDONESIAN_MESSAGES.PSB.ACTIVATION_SUCCESS),
    activationFailed: () => this.error(INDONESIAN_MESSAGES.PSB.ACTIVATION_FAILED),
    surveyCompleted: () => this.success(INDONESIAN_MESSAGES.PSB.SURVEY_COMPLETED),
    installationCompleted: () => this.success(INDONESIAN_MESSAGES.PSB.INSTALLATION_COMPLETED),
  };

  // Performance alerts
  performance = {
    slowConnection: () => this.warning(INDONESIAN_MESSAGES.PERFORMANCE.SLOW_CONNECTION),
    highMemoryUsage: () => this.warning(INDONESIAN_MESSAGES.PERFORMANCE.HIGH_MEMORY_USAGE),
    performanceDegraded: () => this.warning(INDONESIAN_MESSAGES.PERFORMANCE.PERFORMANCE_DEGRADED),
    reloadRecommended: () => this.warning(INDONESIAN_MESSAGES.PERFORMANCE.RELOAD_RECOMMENDED, {
      action: {
        label: 'Muat Ulang',
        onClick: () => window.location.reload(),
      },
    }),
  };

  // System maintenance
  system = {
    maintenance: () => this.info(INDONESIAN_MESSAGES.SYSTEM.MAINTENANCE, { duration: 0 }),
    updateAvailable: () => this.info(INDONESIAN_MESSAGES.SYSTEM.UPDATE_AVAILABLE, {
      action: {
        label: 'Perbarui',
        onClick: () => window.location.reload(),
      },
    }),
  };

  // Confirmation toasts with action buttons
  confirm = {
    delete: (onConfirm: () => void) => 
      toast(INDONESIAN_MESSAGES.CONFIRMATIONS.DELETE_CONFIRM, {
        action: {
          label: 'Hapus',
          onClick: onConfirm,
        },
        cancel: {
          label: 'Batal',
          onClick: () => toast.dismiss(),
        },
      }),
    
    logout: (onConfirm: () => void) =>
      toast(INDONESIAN_MESSAGES.CONFIRMATIONS.LOGOUT_CONFIRM, {
        action: {
          label: 'Logout',
          onClick: onConfirm,
        },
        cancel: {
          label: 'Batal',
          onClick: () => toast.dismiss(),
        },
      }),
  };

  // Batch operations
  batch = {
    start: (count: number) => 
      this.loading(`Memproses ${count} item...`),
    
    progress: (current: number, total: number) => 
      this.info(`Progres: ${current}/${total} selesai`),
    
    complete: (count: number) => 
      this.success(`${count} item berhasil diproses`),
    
    partialSuccess: (success: number, failed: number) =>
      this.warning(`${success} berhasil, ${failed} gagal`),
  };
}

export const productionToast = new ProductionToast();

// Export individual methods for convenience
export const {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  dismiss: dismissToast,
} = productionToast;