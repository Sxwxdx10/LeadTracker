import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  options: RadioOption[];
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ 
    className, 
    options, 
    name, 
    value, 
    onChange, 
    error, 
    orientation = 'vertical',
    ...props 
  }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event.target.value);
    };

    return (
      <div className={cn(
        'space-y-3',
        orientation === 'horizontal' && 'flex flex-wrap gap-6'
      )}>
        {options.map((option) => (
          <div key={option.value} className="flex items-start space-x-3">
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={handleChange}
              disabled={option.disabled}
              className={cn(
                'h-4 w-4 border border-gray-300 text-brand-500 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-red-500 focus:ring-red-500',
                className
              )}
              ref={ref}
              {...props}
            />
            <div className="space-y-1">
              <label
                htmlFor={`${name}-${option.value}`}
                className={cn(
                  'text-sm font-medium cursor-pointer',
                  option.disabled ? 'text-gray-400' : 'text-gray-900'
                )}
              >
                {option.label}
              </label>
              {option.description && (
                <p className={cn(
                  'text-sm',
                  option.disabled ? 'text-gray-400' : 'text-gray-500'
                )}>
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
);
Radio.displayName = 'Radio';

export { Radio };
