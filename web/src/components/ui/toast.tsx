'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

// Types pour les toasts
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string | undefined;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
  position: ToastPosition;
  setPosition: (position: ToastPosition) => void;
}

// Contexte des toasts
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook pour utiliser les toasts
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Composant Toast individuel
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
      toast.onClose?.();
    }, 300); // Durée de l'animation de sortie
  }, [toast.id, toast.onClose, onRemove]);

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-dismiss
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toast.duration, handleClose]);

  const getIcon = () => {
    const iconClass = "h-5 w-5 flex-shrink-0";
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon className={cn(iconClass, "text-green-500")} />;
      case 'error':
        return <XCircleIcon className={cn(iconClass, "text-red-500")} />;
      case 'warning':
        return <ExclamationTriangleIcon className={cn(iconClass, "text-yellow-500")} />;
      case 'info':
        return <InformationCircleIcon className={cn(iconClass, "text-brand-500")} />;
      default:
        return <InformationCircleIcon className={cn(iconClass, "text-gray-500")} />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-brand-50 border-brand-200';
    }
  };

  const getTitleColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-brand-800';
    }
  };

  const getDescriptionColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-brand-700';
    }
  };

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all duration-300 ease-in-out',
        getBackgroundColor(),
        isVisible && !isExiting 
          ? 'transform translate-x-0 opacity-100' 
          : 'transform translate-x-full opacity-0',
        isExiting && 'transform translate-x-full opacity-0'
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={cn("text-sm font-medium", getTitleColor())}>
              {toast.title}
            </p>
            {toast.description && (
              <p className={cn("mt-1 text-sm", getDescriptionColor())}>
                {toast.description}
              </p>
            )}
            {toast.action && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={toast.action.onClick}
                  className={cn(
                    "rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2",
                    toast.type === 'success' && "text-green-800 hover:text-green-900 focus:ring-green-500",
                    toast.type === 'error' && "text-red-800 hover:text-red-900 focus:ring-red-500",
                    toast.type === 'warning' && "text-yellow-800 hover:text-yellow-900 focus:ring-yellow-500",
                    toast.type === 'info' && "text-brand-800 hover:text-brand-900 focus:ring-brand-500"
                  )}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className={cn(
                "inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2",
                toast.type === 'success' && "text-green-400 hover:text-green-500 focus:ring-green-500",
                toast.type === 'error' && "text-red-400 hover:text-red-500 focus:ring-red-500",
                toast.type === 'warning' && "text-yellow-400 hover:text-yellow-500 focus:ring-yellow-500",
                toast.type === 'info' && "text-brand-400 hover:text-brand-500 focus:ring-brand-500"
              )}
              onClick={handleClose}
            >
              <span className="sr-only">Fermer</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Container des toasts
interface ToastContainerProps {
  toasts: Toast[];
  position: ToastPosition;
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, position, onRemove }: ToastContainerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const toastContainer = (
    <div
      className={cn(
        'fixed z-50 flex flex-col space-y-2 pointer-events-none',
        getPositionClasses()
      )}
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );

  return createPortal(toastContainer, document.body);
}

// Provider des toasts
interface ToastProviderProps {
  children: React.ReactNode;
  defaultPosition?: ToastPosition;
}

export function ToastProvider({ children, defaultPosition = 'top-right' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [position, setPosition] = useState<ToastPosition>(defaultPosition);

  const addToast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = {
      id,
      duration: 5000, // 5 secondes par défaut
      ...toastData,
    };

    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider 
      value={{
        toasts,
        addToast,
        removeToast,
        removeAllToasts,
        position,
        setPosition,
      }}
    >
      {children}
      <ToastContainer 
        toasts={toasts} 
        position={position}
        onRemove={removeToast}
      />
    </ToastContext.Provider>
  );
}
