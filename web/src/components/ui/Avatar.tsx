'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/cardUtils';

interface AvatarProps {
  name?: string;
  avatar?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'circle' | 'square';
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
  xl: 'h-12 w-12 text-lg'
};

export function Avatar({ 
  name, 
  avatar, 
  initials, 
  size = 'md', 
  className,
  variant = 'circle' 
}: AvatarProps) {
  const displayInitials = initials || getInitials(name);
  
  if (avatar) {
    return (
      <img 
        src={avatar} 
        alt={name} 
        className={cn(
          sizeClasses[size],
          variant === 'circle' ? 'rounded-full' : 'rounded-md',
          'object-cover',
          className
        )}
      />
    );
  }
  
  return (
    <div
      className={cn(
        sizeClasses[size],
        variant === 'circle' ? 'rounded-full' : 'rounded-md',
        'bg-gradient-to-br from-blue-400 to-blue-600',
        'flex items-center justify-center',
        'text-white font-semibold',
        'border-2 border-white shadow-sm',
        className
      )}
    >
      {displayInitials}
    </div>
  );
}

