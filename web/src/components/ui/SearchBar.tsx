import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Rechercher des leads...",
  className,
  showClearButton = true,
}: SearchBarProps) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "pl-10 pr-10 h-12 text-base rounded-xl border-gray-200",
            "focus:border-brand-500 focus:ring-brand-500 focus:ring-2",
            "transition-all duration-200 ease-out",
            "shadow-sm hover:shadow-md focus:shadow-lg"
          )}
        />
        {showClearButton && value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full hover:bg-gray-100"
          >
            <XMarkIcon className="h-4 w-4 text-gray-400" />
          </Button>
        )}
      </div>
    </div>
  );
}

