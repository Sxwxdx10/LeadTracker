'use client';

import React, { useState } from 'react';
import { Plus, Users, UserCheck, UserX, Clock } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';

export default function UsersSimplePage() {
  console.log('Page Users Simple - début de rendu');

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Données statiques pour le test
  const stats = {
    totalUsers: 5,
    activeUsers: 4,
    inactiveUsers: 1,
    pendingInvitations: 2
  };

  const headerActions = (
    <Button
      onClick={() => setIsInviteModalOpen(true)}
      className="flex items-center space-x-2"
    >
      <Plus className="h-4 w-4" />
      <span>Inviter un utilisateur</span>
    </Button>
  );

  console.log('Page Users Simple - rendu du JSX');

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AppHeader
          title="Gestion des utilisateurs"
          description="Gérez les utilisateurs de votre organisation"
          actions={headerActions}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalUsers}
                  </p>
                </div>
                <Users className="h-8 w-8 text-brand-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Actifs</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {stats.activeUsers}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactifs</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {stats.inactiveUsers}
                  </p>
                </div>
                <UserX className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-semibold text-yellow-600">
                    {stats.pendingInvitations}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Message de test */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Page de test fonctionnelle !
            </h3>
            <p className="text-gray-500 mb-4">
              Cette version simplifiée démontre que la page peut se charger correctement.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✅ React et Next.js fonctionnent</p>
              <p>✅ AppHeader se charge correctement</p>
              <p>✅ ProtectedRoute fonctionne</p>
              <p>✅ Composants UI disponibles</p>
            </div>
            
            <div className="mt-6">
              <Button onClick={() => alert('Test - Modal ouverte!')}>
                Tester l'ouverture de modal
              </Button>
            </div>
          </div>

          {/* Modal simple */}
          {isInviteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-lg font-semibold mb-4">Test Modal</h2>
                <p className="text-gray-600 mb-4">
                  Ceci est un test pour vérifier que les modales fonctionnent.
                </p>
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsInviteModalOpen(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
