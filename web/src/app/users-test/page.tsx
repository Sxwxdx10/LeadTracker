'use client';

import React from 'react';

export default function UsersTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test - Page de gestion des utilisateurs
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Statut du test</h2>
          <p className="text-green-600">✅ Page chargée avec succès !</p>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Prochaines étapes :</h3>
            <ul className="list-disc list-inside text-gray-700">
              <li>Vérifier l'authentification</li>
              <li>Tester les appels API</li>
              <li>Déboguer les erreurs JavaScript</li>
            </ul>
          </div>
          
          <div className="mt-6 p-4 bg-brand-50 rounded-md">
            <p className="text-brand-800">
              Si vous voyez cette page, cela signifie que Next.js fonctionne correctement.
              Le problème de la page /users vient probablement des appels API ou de l'authentification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
