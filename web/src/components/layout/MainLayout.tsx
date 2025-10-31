'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from './AppHeader';
import { usePathname } from 'next/navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  // Ne pas afficher le header sur les pages d'authentification
  const authPages = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPages.some(page => pathname?.startsWith(page));

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

