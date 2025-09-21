import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
      {...props}
    />
  );
}

// Skeleton components for common layouts
export function SkeletonText({ 
  lines = 1, 
  className 
}: { 
  lines?: number; 
  className?: string; 
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )} 
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <SkeletonText lines={3} />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number; 
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg overflow-hidden', className)}>
      {/* Table header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      </div>
      
      {/* Table rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className={cn(
                    'h-4',
                    colIndex === 0 ? 'w-32' : 'w-24'
                  )} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonProfile({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center space-x-4', className)}>
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function SkeletonList({ 
  items = 5,
  showAvatar = false,
  className 
}: { 
  items?: number;
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-6', className)}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="ml-4 flex-1">
              <Skeleton className="h-6 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
