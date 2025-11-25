import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Role, USER_ROLES, ROLE_DISPLAY_NAMES } from '@/types/user';

interface EditUserRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdateRoles: (userId: string, roles: string[]) => Promise<void>;
  roles: Role[];
  isLoading?: boolean;
}

export const EditUserRolesModal: React.FC<EditUserRolesModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateRoles,
  roles,
  isLoading = false
}) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiser les rôles sélectionnés quand l'utilisateur change
  useEffect(() => {
    if (user) {
      setSelectedRoles(user.roles || []);
    } else {
      setSelectedRoles([]);
    }
  }, [user]);

  // Réinitialiser quand la modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || selectedRoles.length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdateRoles(user.id, selectedRoles);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des rôles:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRolesChange = (roles: string | string[]) => {
    setSelectedRoles(Array.isArray(roles) ? roles : [roles]);
  };

  // Préparer les options de rôles pour le Select
  const roleOptions = Object.values(USER_ROLES).map(role => ({
    value: role,
    label: ROLE_DISPLAY_NAMES[role]
  }));

  if (!user) {
    return null;
  }

  // Calculer les changements
  const originalRoles = user.roles || [];
  const hasChanges = JSON.stringify(selectedRoles.sort()) !== JSON.stringify(originalRoles.sort());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gérer les rôles"
      size="md"
    >
      <div className="space-y-6">
        {/* Informations utilisateur */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-sm font-medium text-brand-600">
                {`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {user.fullName}
              </h3>
              <p className="text-sm text-gray-500">
                {user.email}
              </p>
              {user.jobTitle && (
                <p className="text-sm text-gray-500">
                  {user.jobTitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Rôles actuels */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rôles actuels
          </label>
          <div className="flex flex-wrap gap-2">
            {originalRoles.length > 0 ? (
              originalRoles.map((role) => (
                <Badge key={role} variant="secondary">
                  {ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES] || role}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-gray-500 italic">
                Aucun rôle assigné
              </span>
            )}
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-1">
              Nouveaux rôles *
            </label>
            <Select
              value={selectedRoles}
              onChange={handleRolesChange}
              options={roleOptions}
              placeholder="Sélectionner les rôles"
              multiple
              disabled={isSubmitting}
            />
            {selectedRoles.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Au moins un rôle doit être sélectionné
              </p>
            )}
          </div>

          {/* Aperçu des nouveaux rôles */}
          {selectedRoles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aperçu des nouveaux rôles
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedRoles.map((role) => (
                  <Badge key={role} variant="default">
                    {ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES] || role}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Avertissement si changements importants */}
          {hasChanges && selectedRoles.includes(USER_ROLES.ADMIN) && !originalRoles.includes(USER_ROLES.ADMIN) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Attention
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Vous êtes sur le point d'accorder des privilèges administrateur à cet utilisateur. 
                      Il aura accès à toutes les fonctionnalités de l'application.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              loadingText="Mise à jour..."
              disabled={!hasChanges || selectedRoles.length === 0}
            >
              Mettre à jour les rôles
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
