'use client';

import React, { useEffect, useRef, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './button';

// Types pour les modales
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string | undefined;
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string | undefined;
  confirmText?: string | undefined;
  cancelText?: string | undefined;
  variant?: 'default' | 'destructive' | 'warning' | undefined;
  isLoading?: boolean;
}

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Hook pour gérer le focus trap
function useFocusTrap(isOpen: boolean, containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, containerRef]);
}

// Composant Modal de base
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  overlayClassName,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  // Focus trap
  useFocusTrap(isOpen, modalRef);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Gestion des touches
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Bloquer le scroll du body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-lg';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'full':
        return 'max-w-full mx-4';
      default:
        return 'max-w-lg';
    }
  };

  if (!isMounted || !isOpen) return null;

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        overlayClassName
      )}
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full bg-white rounded-lg shadow-xl transform transition-all',
          getSizeClasses(),
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              {title && (
                <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-gray-600">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <span className="sr-only">Fermer</span>
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Modal de confirmation
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
  isLoading = false,
}: ConfirmationModalProps) {
  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleConfirm();
    }
  }, [handleConfirm, isLoading]);

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'destructive':
        return 'destructive';
      case 'warning':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getConfirmButtonClass = () => {
    if (variant === 'warning') {
      return 'border-yellow-300 text-yellow-700 hover:bg-yellow-50';
    }
    return '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="flex flex-col space-y-4" onKeyDown={handleKeyDown}>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            onClick={handleConfirm}
            loading={isLoading}
            disabled={isLoading}
            className={getConfirmButtonClass()}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Modal de formulaire
export function FormModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSubmit,
  submitText = 'Sauvegarder',
  cancelText = 'Annuler',
  isLoading = false,
  size = 'md',
}: FormModalProps) {
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  }, [onSubmit]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {children}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          {onSubmit && (
            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
            >
              {submitText}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

// Modal d'alerte simple
export function AlertModal({
  isOpen,
  onClose,
  title,
  description,
  buttonText = 'OK',
  variant = 'default',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string | undefined;
  buttonText?: string | undefined;
  variant?: 'default' | 'error' | 'warning' | 'info' | undefined;
}) {
  const getButtonVariant = () => {
    switch (variant) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getButtonClass = () => {
    if (variant === 'warning') {
      return 'border-yellow-300 text-yellow-700 hover:bg-yellow-50';
    }
    return '';
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
    >
      <div onKeyDown={handleKeyDown}>
        <div className="flex justify-end">
          <Button
            variant={getButtonVariant()}
            onClick={onClose}
            className={getButtonClass()}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
