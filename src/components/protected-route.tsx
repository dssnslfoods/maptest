import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
