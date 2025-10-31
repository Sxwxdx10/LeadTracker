import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface FilterPillProps {
  label: string;
  count?: number;
  onRemove?: () => void;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const FilterPill = React.forwardRef<HTMLDivElement, FilterPillProps>(
  ({ 
    label, 
    count, 
    onRemove, 
    onClick, 
    variant = 'primary', 
    size = 'md',
    disabled = false,
    className,
    icon,
    ...props 
  }, ref) => {
    const isClickable = Boolean(onClick);
    const isRemovable = Boolean(onRemove);

    const baseClasses = cn(
      'inline-flex items-center gap-2 rounded-full font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      {
        // Size variants
        'px-3 py-1.5 text-sm': size === 'sm',
        'px-4 py-2 text-sm': size === 'md',
        'px-5 py-2.5 text-base': size === 'lg',
        
        // Variant styles
        'bg-brand-100 text-brand-800 border border-brand-200 hover:bg-brand-200 focus:ring-brand-500': 
          variant === 'primary',
        'bg-secondary-100 text-secondary-800 border border-secondary-200 hover:bg-secondary-200 focus:ring-secondary-500': 
          variant === 'secondary',
        'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500': 
          variant === 'outline',
        
        // Interactive states
        'cursor-pointer hover:scale-105 active:scale-95': isClickable && !disabled,
        'cursor-default': !isClickable || disabled,
        'opacity-50 cursor-not-allowed': disabled,
      }
    );

    const removeButtonClasses = cn(
      'ml-1 rounded-full p-0.5 transition-colors duration-150',
      'hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-black/20',
      {
        'text-brand-600 hover:text-brand-800': variant === 'primary',
        'text-secondary-600 hover:text-secondary-800': variant === 'secondary',
        'text-gray-500 hover:text-gray-700': variant === 'outline',
      }
    );

    return (
      <div
        ref={ref}
        className={cn(baseClasses, className)}
        onClick={isClickable && !disabled ? onClick : undefined}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable && !disabled ? 0 : undefined}
        onKeyDown={(e) => {
          if (isClickable && !disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick?.();
          }
        }}
        {...props}
      >
        {icon && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
        
        <span className="flex-shrink-0 truncate">
          {label}
        </span>
        
        {count !== undefined && (
          <span className={cn(
            'flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
            {
              'bg-brand-200 text-brand-800': variant === 'primary',
              'bg-secondary-200 text-secondary-800': variant === 'secondary',
              'bg-gray-100 text-gray-700': variant === 'outline',
            }
          )}>
            {count}
          </span>
        )}
        
        {isRemovable && !disabled && (
          <button
            type="button"
            className={removeButtonClasses}
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            aria-label={`Supprimer le filtre ${label}`}
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);

FilterPill.displayName = 'FilterPill';

export { FilterPill };

