import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingSpinner = ({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-b-2 border-brand-600',
        sizeClasses[size],
        className
      )}
    />
  );
};

export default function Loading({ size = 'md', text, className }: LoadingProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <LoadingSpinner size={size} />
      {text && <span className="ml-2 text-gray-600">{text}</span>}
    </div>
  );
}

export const LoadingPage = ({ text = 'Chargement...' }: { text?: string }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <Loading size="lg" text={text} />
  </div>
);

export const LoadingCard = ({ text = 'Chargement...', className }: { text?: string; className?: string }) => (
  <div className={cn('bg-white shadow-sm rounded-lg p-12', className)}>
    <Loading size="md" text={text} />
  </div>
);

export { LoadingSpinner };
