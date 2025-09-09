import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      {Icon && <Icon className="mx-auto h-12 w-12 text-gray-400" />}
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

export const EmptyStateCard = ({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) => (
  <div className={cn('bg-white shadow-sm rounded-lg p-8', className)}>
    <EmptyState 
      {...(icon && { icon })} 
      title={title} 
      {...(description && { description })} 
      {...(action && { action })} 
    />
  </div>
);
