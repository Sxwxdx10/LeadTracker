'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  UserGroupIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  BuildingOfficeIcon,
  PlusIcon,
  PresentationChartLineIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/auth/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, description, actions }) => {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  // Ne pas afficher si non authentifié
  if (!isAuthenticated) {
    return null;
  }

  // Vérifier si l'utilisateur a le rôle admin
  const isAdmin = user?.roles?.includes('admin') || false;

  const navigation = [
    {
      name: 'Leads',
      href: '/leads',
      icon: ChartBarIcon,
      current: pathname.startsWith('/leads'),
    },
    {
      name: 'Kanban',
      href: '/kanban',
      icon: Squares2X2Icon,
      current: pathname.startsWith('/kanban'),
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: PresentationChartLineIcon,
      current: pathname.startsWith('/analytics'),
    },
    {
      name: 'Utilisateurs',
      href: '/users',
      icon: UserGroupIcon,
      current: pathname.startsWith('/users'),
      adminOnly: true,
    },
    {
      name: 'Paramètres',
      href: '/settings',
      icon: Cog6ToothIcon,
      current: pathname.startsWith('/settings'),
      adminOnly: true,
    },
  ];

  const visibleNavigation = navigation.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo et navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo/Brand */}
            <Link 
              href="/leads" 
              className="flex items-center space-x-2 font-bold text-xl text-gray-900"
            >
              <BuildingOfficeIcon className="h-8 w-8 text-brand-500" />
              <span>Lead Tracker</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-6">
              {visibleNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    item.current
                      ? 'text-brand-600 bg-brand-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-secondary-50'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Actions et menu utilisateur */}
          <div className="flex items-center space-x-4">
            {actions}
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Titre et description de la page */}
      {(title || description) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-100">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            )}
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Version mobile responsive avec drawer (optionnel pour l'avenir)
export const MobileNavigation: React.FC = () => {
  // Implémentation future pour la navigation mobile
  return null;
};
