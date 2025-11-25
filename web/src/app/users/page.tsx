'use client';

import React from 'react';
import { Plus, Users, UserCheck, UserX, Clock } from 'lucide-react';

export default function UsersPage() {
  const stats = {
    totalUsers: 5,
    activeUsers: 4,
    inactiveUsers: 1,
    pendingInvitations: 2
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-600">
            Gérez les utilisateurs de votre organisation
          </p>
        </div>

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

        {/* Message de statut */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <UserCheck className="mx-auto h-12 w-12 text-brand-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            🎉 Page des utilisateurs fonctionnelle !
          </h3>
          <p className="text-gray-500 mb-4">
            La page se charge maintenant correctement avec des données statiques.
          </p>
          
          <div className="bg-brand-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-brand-900 mb-2">Statut du développement :</h4>
            <div className="text-sm text-brand-800 space-y-1">
              <p>✅ Page créée et accessible</p>
              <p>✅ Interface utilisateur fonctionnelle</p>
              <p>✅ Composants de base intégrés</p>
              <p>🔄 API et authentification à connecter</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              <strong>Prochaines étapes :</strong> Connecter l'API backend pour la gestion complète des utilisateurs.
            </p>
            
            <button className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 transition-colors">
              Inviter un utilisateur (Demo)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}