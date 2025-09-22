'use client';

import React, { useState } from 'react';
import { 
  Modal, 
  ConfirmationModal, 
  FormModal, 
  AlertModal 
} from '@/components/ui/modal';
import { 
  useModal, 
  useConfirmationModal, 
  useFormModal, 
  useAlertModal,
  useDeleteConfirmation,
  useModals
} from '@/hooks/useModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ModalTestPage() {
  const basicModal = useModal();
  const confirmationModal = useConfirmationModal();
  const formModal = useFormModal();
  const alertModal = useAlertModal();
  const deleteConfirmation = useDeleteConfirmation();
  const allModals = useModals();

  // État pour le formulaire de test
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  // Simulation d'opérations asynchrones
  const simulateAsyncOperation = (delay = 2000, shouldFail = false): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error('Opération échouée'));
        } else {
          resolve();
        }
      }, delay);
    });
  };

  const handleFormSubmit = async () => {
    await formModal.handleSubmit(async () => {
      await simulateAsyncOperation(1500);
      console.log('Formulaire soumis:', formData);
      setFormData({ name: '', email: '', message: '' });
    });
  };

  const handleDeleteAction = () => {
    deleteConfirmation.confirmDelete({
      itemName: 'Lead de démonstration',
      itemType: 'lead',
      onConfirm: async () => {
        await simulateAsyncOperation(1000);
        console.log('Lead supprimé !');
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              🪟 Test des Modales
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Testez tous les types de modales avec gestion des touches et focus.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">💡 Instructions :</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Ouvrez plusieurs modales</strong> puis cliquez "Fermer toutes"</li>
                <li>• <strong>Testez les touches :</strong> Escape (fermer), Enter (confirmer), Tab (navigation)</li>
                <li>• <strong>Cliquez à l'extérieur</strong> d'une modale pour la fermer</li>
                <li>• <strong>Testez les erreurs</strong> pour voir que les modales restent ouvertes en cas d'échec</li>
              </ul>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Modales de base */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Modales de base
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={basicModal.open}
                  variant="outline"
                >
                  Modal simple
                </Button>
                <Button 
                  onClick={() => allModals.modal.open()}
                  variant="outline"
                >
                  Modal avec hook combiné
                </Button>
                <Button 
                  onClick={() => {
                    allModals.closeAll();
                    console.log('Toutes les modales fermées !');
                  }}
                  variant="outline"
                >
                  Fermer toutes
                </Button>
              </div>
            </section>

            {/* Modales de confirmation */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Modales de confirmation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => confirmationModal.confirm({
                    title: 'Confirmer l\'action',
                    description: 'Êtes-vous sûr de vouloir continuer ?',
                    onConfirm: async () => {
                      await simulateAsyncOperation(1000);
                      console.log('Action confirmée !');
                    }
                  })}
                  variant="outline"
                >
                  Confirmation simple
                </Button>
                <Button
                  onClick={handleDeleteAction}
                  variant="outline"
                >
                  Suppression avec confirmation
                </Button>
                <Button
                  onClick={() => confirmationModal.confirm({
                    title: 'Action risquée',
                    description: 'Cette action peut avoir des conséquences importantes.',
                    confirmText: 'Continuer quand même',
                    cancelText: 'Abandonner',
                    variant: 'warning',
                    onConfirm: async () => {
                      await simulateAsyncOperation(2000);
                      console.log('Action risquée confirmée !');
                    }
                  })}
                  variant="outline"
                >
                  Confirmation d'avertissement
                </Button>
              </div>
            </section>

            {/* Modales de formulaire */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Modales de formulaire
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={formModal.open}
                  variant="outline"
                >
                  Formulaire simple
                </Button>
                <Button
                  onClick={() => alertModal.alert({
                    title: 'Information importante',
                    description: 'Ceci est une alerte d\'information avec un message plus long.',
                    variant: 'info',
                    buttonText: 'Compris'
                  })}
                  variant="outline"
                >
                  Modal d'alerte
                </Button>
              </div>
            </section>

            {/* Tests de gestion des touches */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tests de gestion des touches
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Touches supportées :
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <kbd className="bg-gray-200 px-1 rounded">Escape</kbd> : Fermer la modale</li>
                    <li>• <kbd className="bg-gray-200 px-1 rounded">Enter</kbd> : Confirmer l'action</li>
                    <li>• <kbd className="bg-gray-200 px-1 rounded">Tab</kbd> : Navigation dans la modale</li>
                    <li>• <kbd className="bg-gray-200 px-1 rounded">Shift+Tab</kbd> : Navigation inverse</li>
                  </ul>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Fonctionnalités d'accessibilité :
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Focus trap automatique</li>
                    <li>• Support des lecteurs d'écran</li>
                    <li>• ARIA labels et roles</li>
                    <li>• Blocage du scroll du body</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Tests d'erreur */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tests d'erreur et de chargement
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => confirmationModal.confirm({
                    title: 'Test d\'erreur',
                    description: 'Cette action va échouer pour tester la gestion d\'erreur.',
                    confirmText: 'Tester l\'erreur',
                    onConfirm: async () => {
                      await simulateAsyncOperation(1500, true);
                    }
                  })}
                  variant="outline"
                >
                  Test d'erreur
                </Button>
                <Button
                  onClick={() => confirmationModal.confirm({
                    title: 'Test de chargement long',
                    description: 'Cette action prendra 5 secondes pour tester l\'état de chargement.',
                    confirmText: 'Démarrer',
                    onConfirm: async () => {
                      await simulateAsyncOperation(5000);
                    }
                  })}
                  variant="outline"
                >
                  Test chargement long
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Modales */}
      
      {/* Modal de base */}
      <Modal
        isOpen={basicModal.isOpen}
        onClose={basicModal.close}
        title="Modal de base"
        description="Ceci est une modale de base avec titre et description."
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Cette modale peut contenir n'importe quel contenu. Elle supporte :
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Fermeture avec Escape</li>
            <li>Fermeture en cliquant sur l'overlay</li>
            <li>Focus trap automatique</li>
            <li>Différentes tailles</li>
          </ul>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={basicModal.close}>
              Fermer
            </Button>
            <Button 
              onClick={() => {
                console.log('Action effectuée !');
                basicModal.close();
              }}
              variant="outline"
            >
              Action
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal du hook combiné */}
      <Modal
        isOpen={allModals.modal.isOpen}
        onClose={allModals.modal.close}
        title="Modal via hook combiné"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Cette modale utilise le hook combiné <code className="bg-gray-100 px-1 rounded">useModals()</code>.
          </p>
          <div className="flex justify-end">
            <Button 
              onClick={allModals.modal.close}
              variant="outline"
            >
              Fermer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={confirmationModal.close}
        onConfirm={confirmationModal.handleConfirm}
        title={confirmationModal.config?.title || ''}
        description={confirmationModal.config?.description}
        confirmText={confirmationModal.config?.confirmText}
        cancelText={confirmationModal.config?.cancelText}
        variant={confirmationModal.config?.variant}
        isLoading={confirmationModal.isLoading}
      />

      {/* Modal de suppression */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={deleteConfirmation.close}
        onConfirm={deleteConfirmation.handleConfirm}
        title={deleteConfirmation.config?.title || ''}
        description={deleteConfirmation.config?.description}
        confirmText={deleteConfirmation.config?.confirmText}
        cancelText={deleteConfirmation.config?.cancelText}
        variant={deleteConfirmation.config?.variant}
        isLoading={deleteConfirmation.isLoading}
      />

      {/* Modal de formulaire */}
      <FormModal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        title="Formulaire de test"
        description="Testez la soumission de formulaire dans une modale."
        onSubmit={handleFormSubmit}
        isLoading={formModal.isLoading}
        submitText="Soumettre"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Votre nom"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="votre@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Votre message..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
              rows={4}
            />
          </div>
        </div>
      </FormModal>

      {/* Modal d'alerte */}
      {alertModal.config && (
        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={alertModal.close}
          title={alertModal.config.title}
          description={alertModal.config.description}
          buttonText={alertModal.config.buttonText}
          variant={alertModal.config.variant}
        />
      )}
    </div>
  );
}
