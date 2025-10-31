import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  className?: string;
  error?: boolean;
  label?: string;
  id?: string;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ value, onChange, options, placeholder = "Sélectionner...", disabled = false, multiple = false, className, error = false, label, id }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedValues, setSelectedValues] = React.useState<string[]>(
      multiple 
        ? (Array.isArray(value) ? value : [])
        : (typeof value === 'string' ? [value] : [])
    );

    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLDivElement>(null);
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const listboxId = `${selectId}-listbox`;
    
    // Keyboard navigation
    const { focusedIndex, setFocusedIndex, focusItem, setItemRef, handleKeyDown: handleNavKeyDown } = 
      useKeyboardNavigation(options.length, {
        wrap: true,
        onSelect: (index) => {
          const option = options[index];
          if (option && !option.disabled) {
            handleOptionClick(option.value);
          }
        },
        enabled: isOpen,
      });

    // Fermer le dropdown quand on clique dehors
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
    
    // Handle keyboard events
    React.useEffect(() => {
      if (!isOpen) return;
      
      const handleKeyDown = (event: KeyboardEvent) => {
        handleNavKeyDown(event);
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleNavKeyDown]);

    // Synchroniser avec la prop value
    React.useEffect(() => {
      if (multiple) {
        setSelectedValues(Array.isArray(value) ? value : []);
      } else {
        setSelectedValues(typeof value === 'string' ? [value] : []);
      }
    }, [value, multiple]);

    const handleOptionClick = (optionValue: string) => {
      if (disabled) return;

      let newSelection: string[];

      if (multiple) {
        if (selectedValues.includes(optionValue)) {
          newSelection = selectedValues.filter(v => v !== optionValue);
        } else {
          newSelection = [...selectedValues, optionValue];
        }
        onChange(newSelection);
      } else {
        newSelection = [optionValue];
        onChange(optionValue);
        setIsOpen(false);
      }

      setSelectedValues(newSelection);
    };

    const getDisplayText = () => {
      if (selectedValues.length === 0) {
        return placeholder;
      }

      if (multiple) {
        if (selectedValues.length === 1) {
          const option = options.find(opt => opt.value === selectedValues[0]);
          return option?.label || selectedValues[0];
        }
        return `${selectedValues.length} sélectionné(s)`;
      } else {
        const option = options.find(opt => opt.value === selectedValues[0]);
        return option?.label || selectedValues[0];
      }
    };

    const isSelected = (optionValue: string) => selectedValues.includes(optionValue);

    return (
      <div ref={ref} className={cn("relative w-full", className)}>
        {label && (
          <label 
            htmlFor={selectId}
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <div
          ref={dropdownRef}
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-disabled={disabled}
          aria-invalid={error}
          tabIndex={disabled ? -1 : 0}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500",
            disabled && "bg-gray-50",
            "cursor-pointer"
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              !disabled && setIsOpen(!isOpen);
            }
          }}
        >
          <span className={cn(
            selectedValues.length === 0 && "text-gray-500"
          )}>
            {getDisplayText()}
          </span>
          <ChevronDown 
            className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-180"
            )}
            aria-hidden="true"
          />
        </div>

        {isOpen && !disabled && (
          <div 
            id={listboxId}
            role="listbox"
            aria-multiselectable={multiple}
            className="absolute top-full z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
          >
            <div className="max-h-60 overflow-auto py-1">
              {options.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Aucune option disponible
                </div>
              ) : (
                options.map((option, index) => (
                  <div
                    key={option.value}
                    ref={setItemRef(index)}
                    role="option"
                    aria-selected={isSelected(option.value)}
                    aria-disabled={option.disabled}
                    tabIndex={-1}
                    className={cn(
                      "relative flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                      option.disabled && "cursor-not-allowed opacity-50",
                      isSelected(option.value) && "bg-brand-50 text-brand-600 font-medium",
                      focusedIndex === index && "bg-gray-100"
                    )}
                    onClick={() => !option.disabled && handleOptionClick(option.value)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    {multiple && (
                      <div className="mr-2 flex h-4 w-4 items-center justify-center">
                        {isSelected(option.value) && (
                          <Check className="h-3 w-3" aria-hidden="true" />
                        )}
                      </div>
                    )}
                    <span className="truncate">{option.label}</span>
                    {!multiple && isSelected(option.value) && (
                      <Check className="ml-auto h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
