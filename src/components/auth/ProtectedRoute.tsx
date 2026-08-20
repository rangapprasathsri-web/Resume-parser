import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, FileText } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-[8px] bg-accent text-white flex items-center justify-center">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-secondary">
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
          <span>Verifying authentication status...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
