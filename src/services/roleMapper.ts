/**
 * Role Mapping Utility
 * Standardizes role format between backend (super_admin) and frontend (superadmin)
 */

export type FrontendRole = 'user' | 'superadmin' | 'teknisi' | 'cs';
export type BackendRole = 'user' | 'super_admin' | 'teknisi' | 'cs';

/**
 * Convert backend role format to frontend format
 */
export const mapBackendToFrontendRole = (backendRole: string): FrontendRole => {
  switch (backendRole?.toLowerCase()) {
    case 'super_admin':
      return 'superadmin';
    case 'teknisi':
      return 'teknisi';
    case 'cs':
      return 'cs';
    case 'user':
    default:
      return 'user';
  }
};

/**
 * Convert frontend role format to backend format
 */
export const mapFrontendToBackendRole = (frontendRole: FrontendRole): BackendRole => {
  switch (frontendRole) {
    case 'superadmin':
      return 'super_admin';
    case 'teknisi':
      return 'teknisi';
    case 'cs':
      return 'cs';
    case 'user':
    default:
      return 'user';
  }
};

/**
 * Check if user has required permission level
 */
export const hasPermission = (userRole: FrontendRole, requiredRole: FrontendRole): boolean => {
  const roleHierarchy: Record<FrontendRole, number> = {
    user: 1,
    teknisi: 2,
    cs: 2, // Same level as teknisi, separate access
    superadmin: 3
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: FrontendRole): string => {
  switch (role) {
    case 'superadmin':
      return 'Super Admin';
    case 'teknisi':
      return 'Teknisi';
    case 'cs':
      return 'Customer Service';
    case 'user':
    default:
      return 'User';
  }
};

/**
 * Get role color class for badges
 */
export const getRoleColorClass = (role: FrontendRole): string => {
  switch (role) {
    case 'superadmin':
      return 'bg-destructive text-destructive-foreground';
    case 'teknisi':
      return 'bg-primary text-primary-foreground';
    case 'cs':
      return 'bg-blue-500 text-white';
    case 'user':
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};