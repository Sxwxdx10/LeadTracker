import { useToast as useToastContext } from '@/components/ui/toast';
import { ToastType } from '@/components/ui/toast';

// Hook avec méthodes utilitaires pour faciliter l'utilisation
export function useToast() {
  const context = useToastContext();

  // Méthodes utilitaires pour chaque type de toast
  const toast = {
    // Toast de succès
    success: (title: string, description?: string, options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
      onClose?: () => void;
    }) => {
      return context.addToast({
        type: 'success',
        title,
        ...(description && { description }),
        ...options,
      });
    },

    // Toast d'erreur
    error: (title: string, description?: string, options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
      onClose?: () => void;
    }) => {
      return context.addToast({
        type: 'error',
        title,
        ...(description && { description }),
        duration: options?.duration || 7000, // Plus long pour les erreurs
        ...options,
      });
    },

    // Toast d'avertissement
    warning: (title: string, description?: string, options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
      onClose?: () => void;
    }) => {
      return context.addToast({
        type: 'warning',
        title,
        ...(description && { description }),
        duration: options?.duration || 6000,
        ...options,
      });
    },

    // Toast d'information
    info: (title: string, description?: string, options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
      onClose?: () => void;
    }) => {
      return context.addToast({
        type: 'info',
        title,
        ...(description && { description }),
        ...options,
      });
    },

    // Toast personnalisé
    custom: (type: ToastType, title: string, description?: string, options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
      onClose?: () => void;
    }) => {
      return context.addToast({
        type,
        title,
        ...(description && { description }),
        ...options,
      });
    },

    // Méthodes de gestion
    dismiss: (id: string) => context.removeToast(id),
    dismissAll: () => context.removeAllToasts(),
    
    // Gestion de la position
    setPosition: context.setPosition,
    position: context.position,
  };

  return toast;
}

// Hook pour les toasts avec promesses (utile pour les opérations async)
export function useAsyncToast() {
  const toast = useToast();

  const promise = async <T,>(
    promiseOrFunction: Promise<T> | (() => Promise<T>),
    options: {
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((error: any) => string);
      duration?: number;
    }
  ): Promise<T> => {
    const actualPromise = typeof promiseOrFunction === 'function' 
      ? promiseOrFunction() 
      : promiseOrFunction;

    let toastId: string | undefined;

    // Toast de chargement
    if (options.loading) {
      toastId = toast.info(options.loading, undefined, { duration: 0 });
    }

    try {
      const result = await actualPromise;
      
      // Supprimer le toast de chargement
      if (toastId) {
        toast.dismiss(toastId);
      }

      // Toast de succès
      if (options.success) {
        const message = typeof options.success === 'function' 
          ? options.success(result) 
          : options.success;
        toast.success(message, undefined, options.duration ? { duration: options.duration } : {});
      }

      return result;
    } catch (error) {
      // Supprimer le toast de chargement
      if (toastId) {
        toast.dismiss(toastId);
      }

      // Toast d'erreur
      if (options.error) {
        const message = typeof options.error === 'function' 
          ? options.error(error) 
          : options.error;
        toast.error(message, undefined, options.duration ? { duration: options.duration } : {});
      }

      throw error;
    }
  };

  return {
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    custom: toast.custom,
    dismiss: toast.dismiss,
    dismissAll: toast.dismissAll,
    setPosition: toast.setPosition,
    position: toast.position,
    promise,
  };
}

// Hook pour les toasts avec état (utile pour les formulaires)
export function useToastState() {
  const toast = useToast();

  const handleSubmit = async <T,>(
    submitFunction: () => Promise<T>,
    options: {
      loadingMessage?: string;
      successMessage?: string | ((data: T) => string);
      errorMessage?: string | ((error: any) => string);
    } = {}
  ) => {
    const {
      loadingMessage = 'Traitement en cours...',
      successMessage = 'Opération réussie !',
      errorMessage = 'Une erreur est survenue'
    } = options;

    try {
      const result = await submitFunction();
      
      const message = typeof successMessage === 'function' 
        ? successMessage(result) 
        : successMessage;
      toast.success(message);
      
      return result;
    } catch (error) {
      const message = typeof errorMessage === 'function' 
        ? errorMessage(error) 
        : errorMessage;
      toast.error(message);
      throw error;
    }
  };

  return {
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    custom: toast.custom,
    dismiss: toast.dismiss,
    dismissAll: toast.dismissAll,
    setPosition: toast.setPosition,
    position: toast.position,
    handleSubmit,
  };
}

// Exemples d'utilisation dans les commentaires
/*
// Utilisation basique
const toast = useToast();

toast.success('Opération réussie !');
toast.error('Une erreur est survenue', 'Veuillez réessayer plus tard');
toast.warning('Attention', 'Cette action est irréversible');
toast.info('Information', 'Nouvelle fonctionnalité disponible');

// Avec action
toast.error('Échec de la sauvegarde', 'Connexion perdue', {
  action: {
    label: 'Réessayer',
    onClick: () => saveData()
  }
});

// Utilisation avec promesses
const asyncToast = useAsyncToast();

await asyncToast.promise(
  () => api.saveUser(userData),
  {
    loading: 'Sauvegarde en cours...',
    success: 'Utilisateur sauvegardé !',
    error: 'Erreur lors de la sauvegarde'
  }
);

// Utilisation dans un formulaire
const { handleSubmit } = useToastState();

const onSubmit = async (data) => {
  await handleSubmit(
    () => api.createLead(data),
    {
      loadingMessage: 'Création du lead...',
      successMessage: 'Lead créé avec succès !',
      errorMessage: 'Erreur lors de la création'
    }
  );
};
*/
