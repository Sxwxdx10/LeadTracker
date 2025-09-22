import React from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './loading';
import { Progress } from './progress';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  showProgress?: boolean;
  className?: string;
}

export function LoadingOverlay({
  isVisible,
  message = 'Chargement...',
  progress,
  showProgress = false,
  className,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
        className
      )}
    >
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 shadow-xl">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
          
          {showProgress && progress !== undefined && (
            <div className="mt-4">
              <Progress 
                value={progress} 
                className="w-full" 
                showValue 
                animated 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface InlineLoadingProps {
  isVisible: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InlineLoading({
  isVisible,
  message = 'Chargement...',
  size = 'md',
  className,
}: InlineLoadingProps) {
  if (!isVisible) return null;

  return (
    <div className={cn('flex items-center justify-center py-4', className)}>
      <LoadingSpinner size={size} className="mr-2" />
      <span className="text-gray-600 text-sm">{message}</span>
    </div>
  );
}

interface LoadingCardProps {
  isVisible: boolean;
  message?: string;
  description?: string;
  className?: string;
}

export function LoadingCard({
  isVisible,
  message = 'Chargement...',
  description,
  className,
}: LoadingCardProps) {
  if (!isVisible) return null;

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-6', className)}>
      <div className="text-center">
        <LoadingSpinner size="md" className="mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-1">{message}</h3>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
}

// Hook pour gérer l'état des overlays de chargement
export function useLoadingOverlay() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [message, setMessage] = React.useState('Chargement...');
  const [progress, setProgress] = React.useState<number | undefined>(undefined);

  const show = React.useCallback((msg?: string, showProgress = false) => {
    setMessage(msg || 'Chargement...');
    setProgress(showProgress ? 0 : undefined);
    setIsVisible(true);
  }, []);

  const hide = React.useCallback(() => {
    setIsVisible(false);
    setProgress(undefined);
  }, []);

  const updateProgress = React.useCallback((value: number) => {
    setProgress(value);
  }, []);

  const updateMessage = React.useCallback((msg: string) => {
    setMessage(msg);
  }, []);

  return {
    isVisible,
    message,
    progress,
    show,
    hide,
    updateProgress,
    updateMessage,
  };
}
