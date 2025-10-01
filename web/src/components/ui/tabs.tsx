'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
  variant: 'default' | 'pills' | 'underline';
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

const useTabs = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within a Tabs component');
  }
  return context;
};

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  closable?: boolean;
  badge?: string | number;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onTabClose?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'pills' | 'underline';
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ 
    defaultValue, 
    value, 
    onValueChange, 
    onTabClose,
    children, 
    className,
    orientation = 'horizontal',
    variant = 'default'
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    
    const activeTab = value ?? internalValue;
    
    const setActiveTab = React.useCallback((newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    }, [value, onValueChange]);

    return (
      <TabsContext.Provider value={{ activeTab, setActiveTab, orientation, variant }}>
        <div 
          ref={ref} 
          className={cn(
            'w-full',
            orientation === 'vertical' && 'flex gap-4',
            className
          )}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation, variant } = useTabs();
  
  const variantClasses = {
    default: 'bg-gray-100 p-1 rounded-md',
    pills: 'bg-transparent gap-2',
    underline: 'bg-transparent border-b border-gray-200'
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center text-gray-500',
        orientation === 'horizontal' ? 'h-10 justify-center' : 'flex-col h-auto w-48 justify-start',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = 'TabsList';

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: React.ReactNode;
  badge?: string | number;
  closable?: boolean;
  onClose?: () => void;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, icon, badge, closable, onClose, ...props }, ref) => {
    const { activeTab, setActiveTab, orientation, variant } = useTabs();
    const isActive = activeTab === value;
    
    const baseClasses = 'inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variantClasses = {
      default: cn(
        'rounded-sm px-3 py-1.5',
        isActive
          ? 'bg-white text-gray-950 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      ),
      pills: cn(
        'rounded-full px-4 py-2',
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      ),
      underline: cn(
        'px-4 py-2 border-b-2 -mb-px',
        isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
      )
    };

    const orientationClasses = orientation === 'vertical' 
      ? 'justify-start w-full' 
      : 'justify-center';

    const handleClose = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose?.();
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          orientationClasses,
          className
        )}
        onClick={() => setActiveTab(value)}
        {...props}
      >
        {icon && <span className="w-4 h-4">{icon}</span>}
        <span className="truncate">{children}</span>
        {badge && (
          <span className={cn(
            'px-2 py-1 text-xs rounded-full',
            isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
          )}>
            {badge}
          </span>
        )}
        {closable && (
          <button
            onClick={handleClose}
            className="ml-1 p-0.5 rounded-sm hover:bg-gray-200 transition-colors"
            aria-label="Fermer l'onglet"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { activeTab, orientation } = useTabs();
    
    if (activeTab !== value) {
      return null;
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          orientation === 'horizontal' ? 'mt-4' : 'flex-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';

// Composant utilitaire pour créer des onglets dynamiques
interface DynamicTabsProps extends Omit<TabsProps, 'children'> {
  items: TabItem[];
  onTabClose?: (value: string) => void;
  renderContent: (item: TabItem) => React.ReactNode;
}

const DynamicTabs = React.forwardRef<HTMLDivElement, DynamicTabsProps>(
  ({ items, onTabClose, renderContent, ...tabsProps }, ref) => {
    return (
      <Tabs ref={ref} {...tabsProps}>
        <TabsList>
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              icon={item.icon}
              badge={item.badge}
              closable={item.closable}
              disabled={item.disabled}
              onClose={() => onTabClose?.(item.value)}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {items.map((item) => (
          <TabsContent key={item.value} value={item.value}>
            {renderContent(item)}
          </TabsContent>
        ))}
      </Tabs>
    );
  }
);
DynamicTabs.displayName = 'DynamicTabs';

export { Tabs, TabsList, TabsTrigger, TabsContent, DynamicTabs };
