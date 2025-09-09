'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/components/ui/loading';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        router.push('/leads');
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // Afficher le loading pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Si on exige l'authentification et que l'utilisateur n'est pas connecté
  if (requireAuth && !isAuthenticated) {
    return null; // La redirection se fera via useEffect
  }

  // Si on n'exige pas l'authentification et que l'utilisateur est connecté
  if (!requireAuth && isAuthenticated) {
    return null; // La redirection se fera via useEffect
  }

  return <>{children}</>;
}
