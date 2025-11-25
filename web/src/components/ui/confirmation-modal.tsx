import React from 'react';
import { AlertTriangle, Trash2, UserX, UserCheck } from 'lucide-react';
import { Modal } from './modal';
import { Button } from './button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "default",
  isLoading = false,
  icon
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          buttonVariant: 'destructive' as const
        };
      case 'warning':
        return {
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          buttonVariant: 'outline' as const
        };
      default:
        return {
          iconColor: 'text-brand-600',
          bgColor: 'bg-brand-50',
          buttonVariant: 'default' as const
        };
    }
  };

  const styles = getVariantStyles();

  const defaultIcon = () => {
    switch (variant) {
      case 'destructive':
        return <Trash2 className="h-6 w-6" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6" />;
      default:
        return <AlertTriangle className="h-6 w-6" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${styles.bgColor} mb-4`}>
          <div className={styles.iconColor}>
            {icon || defaultIcon()}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-500 mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex space-x-3 justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={styles.buttonVariant}
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Composants spécialisés pour des actions communes
export const DeleteConfirmationModal: React.FC<Omit<ConfirmationModalProps, 'variant' | 'icon'>> = (props) => (
  <ConfirmationModal
    {...props}
    variant="destructive"
    icon={<Trash2 className="h-6 w-6" />}
  />
);

export const DeactivateUserModal: React.FC<Omit<ConfirmationModalProps, 'variant' | 'icon'>> = (props) => (
  <ConfirmationModal
    {...props}
    variant="warning"
    icon={<UserX className="h-6 w-6" />}
  />
);

export const ActivateUserModal: React.FC<Omit<ConfirmationModalProps, 'variant' | 'icon'>> = (props) => (
  <ConfirmationModal
    {...props}
    variant="default"
    icon={<UserCheck className="h-6 w-6" />}
  />
);
