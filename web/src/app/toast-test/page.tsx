'use client';

import React from 'react';
import { useSimpleToast } from '@/components/ui/simple-toast';
import { Button } from '@/components/ui/button';

export default function ToastTestPage() {
  const toast = useSimpleToast();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🍞 Test des Notifications Toast - V2
          </h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Types de Toast
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => toast.success('Succès !', 'Opération réussie')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Succès
                </Button>
                <Button
                  onClick={() => toast.error('Erreur !', 'Une erreur est survenue')}
                  variant="destructive"
                >
                  Erreur
                </Button>
                <Button
                  onClick={() => toast.warning('Attention !', 'Action requise')}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Avertissement
                </Button>
                <Button
                  onClick={() => toast.info('Info', 'Information importante')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Information
                </Button>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Tests Avancés
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => toast.success('Lead créé', 'Le nouveau lead a été ajouté au pipeline')}
                  variant="outline"
                >
                  Toast avec description
                </Button>
                <Button
                  onClick={() => {
                    for (let i = 1; i <= 3; i++) {
                      setTimeout(() => {
                        toast.info(`Toast ${i}`, `Message numéro ${i}`);
                      }, i * 500);
                    }
                  }}
                  variant="outline"
                >
                  Toasts multiples
                </Button>
                <Button
                  onClick={() => toast.warning('Toast longue durée', 'Ce toast reste 10 secondes', 10000)}
                  variant="outline"
                >
                  Toast 10s
                </Button>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Simulation d'Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => {
                    toast.info('Sauvegarde en cours...');
                    setTimeout(() => {
                      toast.success('Sauvegardé !', 'Données sauvegardées avec succès');
                    }, 2000);
                  }}
                  variant="outline"
                >
                  Simuler sauvegarde
                </Button>
                <Button
                  onClick={() => {
                    toast.error('Échec de connexion', 'Impossible de se connecter au serveur');
                  }}
                  variant="outline"
                >
                  Simuler erreur
                </Button>
              </div>
            </section>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Instructions :</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Cliquez sur les boutons pour tester les différents types de toasts</li>
                <li>• Les toasts apparaissent en haut à droite</li>
                <li>• Ils disparaissent automatiquement après quelques secondes</li>
                <li>• Vous pouvez les fermer manuellement avec le X</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
