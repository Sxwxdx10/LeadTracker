'use client';

import React, { useState } from 'react';
import { useToast, useAsyncToast, useToastState } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToastPosition } from '@/components/ui/toast';

export default function ToastDemoPage() {
  const toast = useToast();
  const asyncToast = useAsyncToast();
  const { handleSubmit } = useToastState();
  
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [duration, setDuration] = useState(5000);

  // Simulation d'une opération asynchrone
  const simulateAsyncOperation = (shouldFail = false, delay = 2000): Promise<string> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error('Opération échouée'));
        } else {
          resolve('Opération réussie !');
        }
      }, delay);
    });
  };

  // Simulation d'une soumission de formulaire
  const simulateFormSubmit = async () => {
    await simulateAsyncOperation(false, 1500);
    return 'Formulaire soumis avec succès !';
  };

  const positions: ToastPosition[] = [
    'top-right', 'top-left', 'top-center',
    'bottom-right', 'bottom-left', 'bottom-center'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              🍞 Démonstration des Toasts
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Testez tous les types de notifications toast avec différentes options.
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* Toasts de base */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Toasts de base
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => toast.success('Opération réussie !')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Succès
                </Button>
                <Button
                  onClick={() => toast.error('Une erreur est survenue')}
                  variant="destructive"
                >
                  Erreur
                </Button>
                <Button
                  onClick={() => toast.warning('Attention requise')}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Avertissement
                </Button>
                <Button
                  onClick={() => toast.info('Information importante')}
                  className="bg-brand-600 hover:bg-brand-700"
                >
                  Information
                </Button>
              </div>
            </section>

            {/* Toasts avec descriptions */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Toasts avec descriptions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => toast.success(
                    'Lead créé avec succès',
                    'Le nouveau lead a été ajouté à votre pipeline'
                  )}
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  Succès avec description
                </Button>
                <Button
                  onClick={() => toast.error(
                    'Échec de la connexion',
                    'Vérifiez vos identifiants et réessayez'
                  )}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Erreur avec description
                </Button>
              </div>
            </section>

            {/* Toasts avec actions */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Toasts avec actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => toast.error(
                    'Échec de la sauvegarde',
                    'Connexion réseau perdue',
                    {
                      action: {
                        label: 'Réessayer',
                        onClick: () => toast.info('Nouvelle tentative...')
                      }
                    }
                  )}
                  variant="outline"
                >
                  Toast avec action
                </Button>
                <Button
                  onClick={() => toast.warning(
                    'Modifications non sauvegardées',
                    'Vous avez des modifications non sauvegardées',
                    {
                      duration: 10000,
                      action: {
                        label: 'Sauvegarder',
                        onClick: () => toast.success('Sauvegardé !')
                      }
                    }
                  )}
                  variant="outline"
                >
                  Toast longue durée
                </Button>
              </div>
            </section>

            {/* Toasts avec promesses */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Toasts avec promesses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => asyncToast.promise(
                    simulateAsyncOperation(false),
                    {
                      loading: 'Traitement en cours...',
                      success: 'Opération terminée !',
                      error: 'Échec de l\'opération'
                    }
                  )}
                  variant="outline"
                >
                  Promise (succès)
                </Button>
                <Button
                  onClick={() => asyncToast.promise(
                    simulateAsyncOperation(true),
                    {
                      loading: 'Tentative en cours...',
                      success: 'Succès inattendu !',
                      error: 'Échec comme prévu'
                    }
                  )}
                  variant="outline"
                >
                  Promise (échec)
                </Button>
                <Button
                  onClick={() => handleSubmit(simulateFormSubmit)}
                  variant="outline"
                >
                  Soumission formulaire
                </Button>
              </div>
            </section>

            {/* Toast personnalisé */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Toast personnalisé
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titre
                    </label>
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Titre du toast"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Input
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="Description du toast"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durée (ms)
                    </label>
                    <Input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min="1000"
                      max="30000"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <Button
                    onClick={() => toast.custom(
                      'success',
                      customTitle || 'Toast personnalisé',
                      customDescription || undefined,
                      { duration }
                    )}
                    className="w-full"
                  >
                    Créer toast personnalisé
                  </Button>
                  <Button
                    onClick={() => toast.dismissAll()}
                    variant="outline"
                    className="w-full"
                  >
                    Fermer tous les toasts
                  </Button>
                </div>
              </div>
            </section>

            {/* Positionnement */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Positionnement des toasts
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {positions.map((position) => (
                  <Button
                    key={position}
                    onClick={() => {
                      toast.setPosition(position);
                      toast.info(
                        'Position changée',
                        `Toasts maintenant en ${position}`
                      );
                    }}
                    variant="outline"
                    size="sm"
                  >
                    {position}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Position actuelle : <span className="font-medium">{toast.position}</span>
              </p>
            </section>

            {/* Tests de stress */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tests de performance
              </h2>
              <div className="flex space-x-4">
                <Button
                  onClick={() => {
                    for (let i = 1; i <= 5; i++) {
                      setTimeout(() => {
                        toast.info(`Toast ${i}/5`, `Test de performance`);
                      }, i * 200);
                    }
                  }}
                  variant="outline"
                >
                  5 toasts rapides
                </Button>
                <Button
                  onClick={() => {
                    toast.success('Toast persistant', 'Ce toast reste 30 secondes', {
                      duration: 30000
                    });
                  }}
                  variant="outline"
                >
                  Toast longue durée
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
