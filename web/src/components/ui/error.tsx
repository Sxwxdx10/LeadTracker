import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorDisplay({ 
  title = 'Une erreur s\'est produite', 
  message, 
  onRetry,
  className 
}: ErrorProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      {message && (
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">{message}</p>
      )}
      {onRetry && (
        <div className="mt-6">
          <Button onClick={onRetry} variant="outline" className="flex items-center gap-2 mx-auto">
            <ArrowPathIcon className="h-4 w-4" />
            Réessayer
          </Button>
        </div>
      )}
    </div>
  );
}

export const ErrorPage = ({ 
  title = 'Erreur de chargement', 
  message = 'Une erreur inattendue s\'est produite.',
  onRetry 
}: ErrorProps) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="max-w-md mx-auto">
      <ErrorDisplay title={title} message={message} onRetry={onRetry} />
    </div>
  </div>
);

export const ErrorCard = ({ 
  title = 'Erreur de chargement', 
  message,
  onRetry,
  className 
}: ErrorProps) => (
  <div className={cn('bg-white shadow-sm rounded-lg p-8', className)}>
    <ErrorDisplay title={title} message={message} onRetry={onRetry} />
  </div>
);
