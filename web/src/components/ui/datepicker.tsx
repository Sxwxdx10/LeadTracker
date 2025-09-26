import * as React from 'react';
import { Calendar, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: Date | string | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  error?: boolean;
  showTime?: boolean;
  format?: 'date' | 'datetime-local';
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ 
    className, 
    value, 
    onChange, 
    placeholder, 
    error, 
    showTime = false,
    format = 'date',
    ...props 
  }, ref) => {
    const [inputValue, setInputValue] = React.useState<string>('');

    React.useEffect(() => {
      if (value) {
        const date = typeof value === 'string' ? new Date(value) : value;
        if (!isNaN(date.getTime())) {
          if (showTime) {
            setInputValue(date.toISOString().slice(0, 16));
          } else {
            setInputValue(date.toISOString().slice(0, 10));
          }
        }
      } else {
        setInputValue('');
      }
    }, [value, showTime]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      setInputValue(inputValue);
      
      if (inputValue) {
        const date = new Date(inputValue);
        if (!isNaN(date.getTime())) {
          onChange?.(date);
        } else {
          onChange?.(null);
        }
      } else {
        onChange?.(null);
      }
    };

    const inputType = showTime ? 'datetime-local' : 'date';

    return (
      <div className="relative">
        <input
          type={inputType}
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 pl-10 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
          {...props}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {showTime ? (
            <CalendarDays className="h-4 w-4" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
        </div>
      </div>
    );
  }
);
DatePicker.displayName = 'DatePicker';

export { DatePicker };
