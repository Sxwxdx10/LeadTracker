'use client';

import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from './UserMenu';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showUserMenu?: boolean;
}

export function AppHeader({ title, subtitle, showUserMenu = true }: AppHeaderProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Logo/Brand */}
            <Link href="/leads" className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">LT</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Lead Tracker</span>
            </Link>
            
            {/* Navigation principale */}
            <nav className="ml-8 hidden md:flex space-x-6">
              <Link 
                href="/leads" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Leads
              </Link>
              <Link 
                href="/kanban" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Kanban
              </Link>
              <Link 
                href="/analytics" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Analytics
              </Link>
            </nav>
          </div>

          {/* Titre de la page */}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>

          {/* Menu utilisateur */}
          <div className="flex items-center">
            {showUserMenu && <UserMenu />}
          </div>
        </div>
      </div>
    </div>
  );
}
