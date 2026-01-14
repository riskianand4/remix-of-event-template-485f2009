import React from 'react';
import { useApp } from '@/contexts/AppContext';
import ModernLoginPage from '@/components/auth/ModernLoginPage';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'superadmin' | 'teknisi' | 'cs';
  allowedRoles?: ('user' | 'superadmin' | 'teknisi' | 'cs')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  allowedRoles = [] 
}) => {
  const { user, isAuthenticated, isLoading } = useApp();

  // Show loading during auth check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <ModernLoginPage />;
  }

  // Check role permissions
  const hasRequiredRole = () => {
    if (!requiredRole && allowedRoles.length === 0) return true;
    
    // Check specific required role (exact match, no hierarchy for teknisi)
    if (requiredRole) {
      // Teknisi is a separate role - no cross-access with other roles
      if (requiredRole === 'teknisi') {
        return user.role === 'teknisi';
      }
      
      // For other roles, use hierarchy: superadmin > user
      const roleHierarchy = { user: 1, superadmin: 2 };
      const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 999;
      return userRoleLevel >= requiredRoleLevel;
    }
    
    // Check allowed roles list
    if (allowedRoles.length > 0) {
      return allowedRoles.includes(user.role as 'user' | 'superadmin' | 'teknisi' | 'cs');
    }
    
    return true;
  };

  // Show access denied if insufficient permissions
  if (!hasRequiredRole()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
            <p className="text-muted-foreground mb-4">
              Anda tidak memiliki izin untuk mengakses halaman ini.
            </p>
            <p className="text-sm text-muted-foreground">
              Role Anda: <span className="font-medium capitalize">{user.role}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Role yang diperlukan: <span className="font-medium capitalize">
                {requiredRole || allowedRoles.join(', ')}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;