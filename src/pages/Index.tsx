import React, { useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import ModernLoginPage from '@/components/auth/ModernLoginPage';

const Index = () => {
  const { user, isLoading, isAuthenticated } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'teknisi') {
        navigate('/technician', { replace: true });
      } else {
        navigate('/psb-report', { replace: true });
      }
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <ModernLoginPage />;
  }

  return null;
};

export default Index;
