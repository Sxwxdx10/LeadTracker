import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SimpleSelectProps {
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

const SimpleSelect = React.forwardRef<HTMLDivElement, SimpleSelectProps>(
  ({ 
    value, 
    onChange, 
    options, 
    placeholder = "Sélectionner...", 
    disabled = false, 
    multiple = false, 
    className, 
    error = false, 
    label, 
    id 
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValues, setSelectedValues] = useState<string[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Initialize selected values
    useEffect(() => {
      if (multiple) {
        setSelectedValues(Array.isArray(value) ? value : []);
      } else {
        setSelectedValues(typeof value === 'string' && value ? [value] : []);
      }
    }, [value, multiple]);

    // Close dropdown when clicking outside
    useEffect(() => {
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
            htmlFor={id}
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        
        <div ref={dropdownRef} className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500 focus:ring-red-500",
              "cursor-pointer hover:border-gray-300"
            )}
          >
            <span className={cn(
              "block truncate text-left",
              selectedValues.length === 0 && "text-gray-500"
            )}>
              {getDisplayText()}
            </span>
            <ChevronDownIcon 
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>

          {isOpen && !disabled && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
              <div className="max-h-60 overflow-auto py-1">
                {options.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Aucune option disponible
                  </div>
                ) : (
                  options.map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        "relative flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-gray-100",
                        option.disabled && "cursor-not-allowed opacity-50",
                        isSelected(option.value) && "bg-brand-50 text-brand-600 font-medium"
                      )}
                      onClick={() => !option.disabled && handleOptionClick(option.value)}
                    >
                      {multiple && (
                        <div className="mr-2 flex h-4 w-4 items-center justify-center">
                          {isSelected(option.value) && (
                            <CheckIcon className="h-3 w-3 text-brand-600" />
                          )}
                        </div>
                      )}
                      <span className="truncate">{option.label}</span>
                      {!multiple && isSelected(option.value) && (
                        <CheckIcon className="ml-auto h-4 w-4 text-brand-600" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

SimpleSelect.displayName = 'SimpleSelect';

export { SimpleSelect };

