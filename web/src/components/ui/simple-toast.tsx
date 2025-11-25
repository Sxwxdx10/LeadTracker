'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface SimpleToast {
  id: string;
  type: ToastType;
  title: string;
  description?: string | undefined;
  duration?: number;
}

// Toast global state (simple)
let toasts: SimpleToast[] = [];
let listeners: (() => void)[] = [];

function emitChange() {
  listeners.forEach(listener => listener());
}

function addToast(toast: Omit<SimpleToast, 'id'>): string {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast: SimpleToast = {
    id,
    duration: 5000,
    ...toast,
  };
  toasts = [...toasts, newToast];
  emitChange();
  return id;
}

function removeToast(id: string) {
  toasts = toasts.filter(toast => toast.id !== id);
  emitChange();
}

// Hook simple pour les toasts
export function useSimpleToast() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => forceUpdate({});
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return {
    toasts,
    success: (title: string, description?: string, duration?: number) =>
      addToast({ type: 'success', title, ...(description && { description }), ...(duration && { duration }) }),
    error: (title: string, description?: string, duration?: number) =>
      addToast({ type: 'error', title, ...(description && { description }), duration: duration || 7000 }),
    warning: (title: string, description?: string, duration?: number) =>
      addToast({ type: 'warning', title, ...(description && { description }), duration: duration || 6000 }),
    info: (title: string, description?: string, duration?: number) =>
      addToast({ type: 'info', title, ...(description && { description }), ...(duration && { duration }) }),
    dismiss: removeToast,
  };
}

// Composant Toast simple
interface SimpleToastItemProps {
  toast: SimpleToast;
  onRemove: (id: string) => void;
}

function SimpleToastItem({ toast, onRemove }: SimpleToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onRemove(toast.id), 300);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toast.duration, toast.id, onRemove]);

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

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all duration-300',
        getBackgroundColor(),
        isVisible 
          ? 'transform translate-x-0 opacity-100' 
          : 'transform translate-x-full opacity-0'
      )}
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
              <p className={cn("mt-1 text-sm", getTitleColor().replace('800', '700'))}>
                {toast.description}
              </p>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md text-gray-400 hover:text-gray-500"
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onRemove(toast.id), 300);
              }}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Container simple des toasts
export function SimpleToastContainer() {
  const { toasts } = useSimpleToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || toasts.length === 0) return null;

  const toastContainer = (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <SimpleToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );

  return createPortal(toastContainer, document.body);
}
