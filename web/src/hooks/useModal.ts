import { useState, useCallback } from 'react';

// Hook de base pour gérer l'état d'une modale
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
}

// Hook pour les modales de confirmation
export function useConfirmationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    description?: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'warning';
  } | null>(null);

  const confirm = useCallback((options: {
    title: string;
    description?: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'warning';
  }) => {
    setConfig(options);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!config) return;

    setIsLoading(true);
    try {
      await config.onConfirm();
      setIsOpen(false);
      setConfig(null);
    } catch (error) {
      console.error('Confirmation action failed:', error);
      // Ne pas fermer la modale en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const handleClose = useCallback(() => {
    if (isLoading) return; // Empêcher la fermeture pendant le chargement
    setIsOpen(false);
    setConfig(null);
    setIsLoading(false);
  }, [isLoading]);

  return {
    isOpen,
    isLoading,
    config,
    confirm,
    handleConfirm,
    close: handleClose,
  };
}

// Hook pour les modales de formulaire
export function useFormModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  
  const close = useCallback(() => {
    if (isLoading) return; // Empêcher la fermeture pendant le chargement
    setIsOpen(false);
    setIsLoading(false);
  }, [isLoading]);

  const handleSubmit = useCallback(async (submitFunction: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await submitFunction();
      setIsOpen(false);
    } catch (error) {
      console.error('Form submission failed:', error);
      // Ne pas fermer la modale en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isOpen,
    isLoading,
    open,
    close,
    handleSubmit,
    setIsLoading,
  };
}

// Hook pour les modales d'alerte
export function useAlertModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    description?: string;
    buttonText?: string;
    variant?: 'default' | 'error' | 'warning' | 'info';
  } | null>(null);

  const alert = useCallback((options: {
    title: string;
    description?: string;
    buttonText?: string;
    variant?: 'default' | 'error' | 'warning' | 'info';
  }) => {
    setConfig(options);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setConfig(null);
  }, []);

  return {
    isOpen,
    config,
    alert,
    close,
  };
}

// Hook combiné pour tous les types de modales
export function useModals() {
  const modal = useModal();
  const confirmation = useConfirmationModal();
  const form = useFormModal();
  const alert = useAlertModal();

  return {
    // Modal de base
    modal,
    
    // Modal de confirmation
    confirmation,
    
    // Modal de formulaire
    form,
    
    // Modal d'alerte
    alert,
    
    // Fermer toutes les modales
    closeAll: () => {
      modal.close();
      confirmation.close();
      form.close();
      alert.close();
    },
  };
}

// Hook pour les actions de suppression avec confirmation
export function useDeleteConfirmation() {
  const { confirmation } = useModals();

  const confirmDelete = useCallback((options: {
    itemName: string;
    itemType?: string;
    onConfirm: () => Promise<void>;
    customTitle?: string;
    customDescription?: string;
  }) => {
    const {
      itemName,
      itemType = 'élément',
      onConfirm,
      customTitle,
      customDescription,
    } = options;

    confirmation.confirm({
      title: customTitle || `Supprimer ${itemType}`,
      description: customDescription || `Êtes-vous sûr de vouloir supprimer "${itemName}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive',
      onConfirm,
    });
  }, [confirmation]);

  return {
    confirmDelete,
    isOpen: confirmation.isOpen,
    isLoading: confirmation.isLoading,
    config: confirmation.config,
    handleConfirm: confirmation.handleConfirm,
    close: confirmation.close,
  };
}
