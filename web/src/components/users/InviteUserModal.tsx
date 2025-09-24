import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { InviteUserDto, Role, USER_ROLES, ROLE_DISPLAY_NAMES } from '@/types/user';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: InviteUserDto) => Promise<void>;
  roles: Role[];
  isLoading?: boolean;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  roles: string[];
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: string;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onInvite,
  roles,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    roles: []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Réinitialiser le formulaire quand la modal s'ouvre/ferme
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        jobTitle: '',
        roles: []
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (formData.roles.length === 0) {
      newErrors.roles = 'Au moins un rôle doit être sélectionné';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const inviteData: InviteUserDto = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        ...(formData.jobTitle.trim() && { jobTitle: formData.jobTitle.trim() }),
        roles: formData.roles
      };

      await onInvite(inviteData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'invitation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Effacer l'erreur du champ modifié
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Préparer les options de rôles pour le Select
  const roleOptions = Object.values(USER_ROLES).map(role => ({
    value: role,
    label: ROLE_DISPLAY_NAMES[role]
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inviter un utilisateur"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Prénom et Nom */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              Prénom *
            </label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="John"
              error={!!errors.firstName}
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Doe"
              error={!!errors.lastName}
              disabled={isSubmitting}
            />
            {errors.lastName && (
              <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Adresse email *
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="john.doe@example.com"
            error={!!errors.email}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Poste */}
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Poste (optionnel)
          </label>
          <Input
            id="jobTitle"
            type="text"
            value={formData.jobTitle}
            onChange={(e) => handleInputChange('jobTitle', e.target.value)}
            placeholder="Commercial Senior"
            disabled={isSubmitting}
          />
        </div>

        {/* Rôles */}
        <div>
          <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-1">
            Rôles *
          </label>
          <Select
            value={formData.roles}
            onChange={(value) => handleInputChange('roles', value)}
            options={roleOptions}
            placeholder="Sélectionner les rôles"
            multiple
            error={!!errors.roles}
            disabled={isSubmitting}
          />
          {errors.roles && (
            <p className="text-sm text-red-600 mt-1">{errors.roles}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            L'utilisateur recevra un email d'invitation avec un lien pour créer son mot de passe.
          </p>
        </div>

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
            loadingText="Invitation en cours..."
          >
            Envoyer l'invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
