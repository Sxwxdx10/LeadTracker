import * as React from 'react';
import { X, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  children?: SidebarItem[];
  badge?: string | number;
}

export interface SidebarProps {
  items: SidebarItem[];
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  title?: string;
  className?: string;
  width?: 'sm' | 'md' | 'lg';
  position?: 'left' | 'right';
  overlay?: boolean;
  collapsible?: boolean;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ 
    items,
    isOpen = true,
    onToggle,
    onClose,
    title,
    className,
    width = 'md',
    position = 'left',
    overlay = true,
    collapsible = true
  }, ref) => {
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

    const widthClasses = {
      sm: 'w-48',
      md: 'w-64',
      lg: 'w-80'
    };

    const toggleExpanded = (itemId: string) => {
      const newExpanded = new Set(expandedItems);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      setExpandedItems(newExpanded);
    };

    const renderItem = (item: SidebarItem, level = 0) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedItems.has(item.id);
      const paddingLeft = level > 0 ? `pl-${4 + level * 4}` : 'pl-4';

      return (
        <div key={item.id}>
          <div
            className={cn(
              'flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-colors',
              item.active ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700 hover:bg-gray-50',
              paddingLeft
            )}
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(item.id);
              } else if (item.onClick) {
                item.onClick();
              }
            }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {item.icon && (
                <span className="flex-shrink-0">
                  {item.icon}
                </span>
              )}
              <span className="truncate">{item.label}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {item.badge && (
                <span className={cn(
                  'px-2 py-1 text-xs rounded-full',
                  item.active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                )}>
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <span className={cn(
                  'transition-transform',
                  isExpanded ? 'rotate-90' : 'rotate-0'
                )}>
                  ▶
                </span>
              )}
            </div>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="border-l border-gray-200 ml-4">
              {item.children!.map(child => renderItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    };

    if (!isOpen && overlay) {
      return null;
    }

    return (
      <>
        {/* Overlay pour mobile */}
        {overlay && isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        
        {/* Sidebar */}
        <div
          ref={ref}
          className={cn(
            'fixed top-0 h-full bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out',
            widthClasses[width],
            position === 'left' ? 'left-0' : 'right-0',
            isOpen ? 'translate-x-0' : (position === 'left' ? '-translate-x-full' : 'translate-x-full'),
            'lg:relative lg:translate-x-0',
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {title}
              </h2>
            )}
            
            <div className="flex items-center gap-2">
              {collapsible && onToggle && (
                <button
                  onClick={onToggle}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors lg:hidden"
                  aria-label="Toggle sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors lg:hidden"
                  aria-label="Close sidebar"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto">
            <div className="py-2">
              {items.map(item => renderItem(item))}
            </div>
          </nav>
        </div>
      </>
    );
  }
);
Sidebar.displayName = 'Sidebar';

export { Sidebar };
