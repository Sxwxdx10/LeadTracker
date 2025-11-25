import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  animated?: boolean;
}

export function Progress({
  value = 0,
  max = 100,
  className,
  size = 'md',
  variant = 'default',
  showValue = false,
  animated = false,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantClasses = {
    default: 'bg-brand-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        {showValue && (
          <span className="text-sm font-medium text-gray-700">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      <div
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            variantClasses[variant],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface LinearProgressProps {
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function LinearProgress({ 
  className, 
  variant = 'default' 
}: LinearProgressProps) {
  const variantClasses = {
    default: 'bg-brand-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
  };

  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-1 overflow-hidden', className)}>
      <div
        className={cn(
          'h-full rounded-full animate-pulse',
          variantClasses[variant]
        )}
        style={{
          background: `linear-gradient(90deg, transparent, currentColor, transparent)`,
          animation: 'progress 1.5s infinite',
        }}
      />
      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

interface CircularProgressProps {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showValue?: boolean;
}

export function CircularProgress({
  value = 0,
  max = 100,
  size = 40,
  strokeWidth = 4,
  className,
  variant = 'default',
  showValue = false,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const variantClasses = {
    default: 'stroke-blue-600',
    success: 'stroke-green-600',
    warning: 'stroke-yellow-600',
    error: 'stroke-red-600',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn('transition-all duration-300 ease-out', variantClasses[variant])}
        />
      </svg>
      {showValue && (
        <span className="absolute text-xs font-medium text-gray-700">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

// Hook pour gérer les états de progression
export function useProgress(initialValue = 0) {
  const [progress, setProgress] = React.useState(initialValue);
  const [isLoading, setIsLoading] = React.useState(false);

  const startProgress = () => {
    setIsLoading(true);
    setProgress(0);
  };

  const updateProgress = (value: number) => {
    setProgress(value);
  };

  const completeProgress = () => {
    setProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 500);
  };

  const resetProgress = () => {
    setProgress(0);
    setIsLoading(false);
  };

  return {
    progress,
    isLoading,
    startProgress,
    updateProgress,
    completeProgress,
    resetProgress,
  };
}
