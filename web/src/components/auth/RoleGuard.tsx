'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RoleGuardProps {
  children: ReactNode;
  requiredRoles: string[];
  fallback?: ReactNode;
}

export default function RoleGuard({ 
  children, 
  requiredRoles, 
  fallback = null 
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  // Si l'utilisateur n'est pas connecté, ne pas afficher
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Vérifier si l'utilisateur a au moins un des rôles requis
  const hasRequiredRole = requiredRoles.some(role => 
    user.roles.includes(role)
  );

  if (!hasRequiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
