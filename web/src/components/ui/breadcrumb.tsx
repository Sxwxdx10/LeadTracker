import * as React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHome?: boolean;
  homeHref?: string;
  className?: string;
  maxItems?: number;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ 
    items, 
    separator = <ChevronRight className="h-4 w-4" />, 
    showHome = true,
    homeHref = '/',
    className,
    maxItems = 5
  }, ref) => {
    const displayItems = React.useMemo(() => {
      if (items.length <= maxItems) {
        return items;
      }
      
      // Si trop d'éléments, garder le premier, ajouter "...", et garder les 2 derniers
      const firstItem = items[0];
      const lastItems = items.slice(-2);
      
      return [
        firstItem,
        { label: '...', href: undefined },
        ...lastItems
      ];
    }, [items, maxItems]);

    const renderItem = (item: BreadcrumbItem, index: number, isLast: boolean) => {
      const content = (
        <span className={cn(
          "flex items-center gap-1 text-sm",
          isLast ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"
        )}>
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
          <span className="truncate">{item.label}</span>
        </span>
      );

      if (item.href && !isLast) {
        return (
          <Link 
            href={item.href}
            className="transition-colors hover:text-gray-700"
          >
            {content}
          </Link>
        );
      }

      return content;
    };

    return (
      <nav
        ref={ref}
        className={cn("flex items-center space-x-1", className)}
        aria-label="Fil d'Ariane"
      >
        {showHome && (
          <>
            <Link 
              href={homeHref}
              className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Accueil"
            >
              <Home className="h-4 w-4" />
            </Link>
            {displayItems.length > 0 && (
              <span className="text-gray-400 mx-1">
                {separator}
              </span>
            )}
          </>
        )}
        
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          
          return (
            <React.Fragment key={`${item.label}-${index}`}>
              {renderItem(item, index, isLast)}
              {!isLast && (
                <span className="text-gray-400 mx-1">
                  {separator}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    );
  }
);
Breadcrumb.displayName = 'Breadcrumb';

export { Breadcrumb };
