'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from './AppHeader';
import { usePathname } from 'next/navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  // Ne pas afficher le header sur les pages d'authentification
  const authPages = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPages.some(page => pathname?.startsWith(page));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Pendant l'hydratation, ne rien afficher de dynamique
  if (!isMounted) {
    return <>{children}</>;
  }

  if (isAuthPage || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <>
      <AppHeader />
      {children}
    </>
  );
};

