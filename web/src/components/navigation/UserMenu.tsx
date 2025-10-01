'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const { user, organization, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu quand on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Bouton du menu utilisateur */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-10 px-3 text-gray-700 hover:bg-gray-100"
      >
        <UserCircleIcon className="h-6 w-6 text-gray-500" />
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {user.fullName || `${user.firstName} ${user.lastName}`.trim()}
          </div>
          <div className="text-xs text-gray-500">
            {organization?.name || 'Organisation'}
          </div>
        </div>
      </Button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {/* Informations utilisateur */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center">
                <UserCircleIcon className="h-10 w-10 text-gray-400" />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {user.fullName || `${user.firstName} ${user.lastName}`.trim()}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  {user.jobTitle && (
                    <div className="text-xs text-gray-400">{user.jobTitle}</div>
                  )}
                </div>
              </div>
              {organization && (
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                  {organization.name}
                </div>
              )}
            </div>

            {/* Options du menu */}
            <div className="py-1">
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Implémenter la navigation vers les paramètres
                }}
              >
                <Cog6ToothIcon className="h-4 w-4 mr-3" />
                Paramètres
              </button>
              
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
