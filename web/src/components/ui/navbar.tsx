import * as React from 'react';
import { Menu, Search, Bell, User, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface NavbarItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  active?: boolean;
  children?: NavbarItem[];
}

export interface NavbarProps {
  logo?: React.ReactNode;
  logoHref?: string;
  items?: NavbarItem[];
  rightItems?: React.ReactNode;
  onMenuClick?: () => void;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  className?: string;
  variant?: 'default' | 'transparent' | 'dark';
  sticky?: boolean;
  showMobileMenu?: boolean;
}

const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({ 
    logo,
    logoHref = '/',
    items = [],
    rightItems,
    onMenuClick,
    searchPlaceholder = 'Rechercher...',
    onSearch,
    showSearch = false,
    className,
    variant = 'default',
    sticky = true,
    showMobileMenu = false
  }, ref) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

    const variantClasses = {
      default: 'bg-white border-b border-gray-200 text-gray-900',
      transparent: 'bg-transparent text-white',
      dark: 'bg-gray-900 border-b border-gray-800 text-white'
    };

    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (onSearch) {
        onSearch(searchQuery);
      }
    };

    const toggleDropdown = (itemId: string) => {
      setOpenDropdown(openDropdown === itemId ? null : itemId);
    };

    const renderNavItem = (item: NavbarItem) => {
      const hasChildren = item.children && item.children.length > 0;

      if (hasChildren) {
        return (
          <div key={item.id} className="relative">
            <button
              onClick={() => toggleDropdown(item.id)}
              className={cn(
                'flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md',
                item.active 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
                variant === 'dark' && 'text-gray-300 hover:text-white hover:bg-gray-800'
              )}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              <span>{item.label}</span>
              <ChevronDown className={cn(
                'w-4 h-4 transition-transform',
                openDropdown === item.id && 'rotate-180'
              )} />
            </button>

            {openDropdown === item.id && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  {item.children!.map((child) => (
                    <Link
                      key={child.id}
                      href={child.href || '#'}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setOpenDropdown(null);
                        child.onClick?.();
                      }}
                    >
                      {child.icon && <span className="w-4 h-4">{child.icon}</span>}
                      <span>{child.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      return (
        <Link
          key={item.id}
          href={item.href || '#'}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md',
            item.active 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
            variant === 'dark' && 'text-gray-300 hover:text-white hover:bg-gray-800'
          )}
          {...(item.onClick && { onClick: item.onClick })}
        >
          {item.icon && <span className="w-4 h-4">{item.icon}</span>}
          <span>{item.label}</span>
        </Link>
      );
    };

    return (
      <nav
        ref={ref}
        className={cn(
          'w-full z-40',
          sticky && 'sticky top-0',
          variantClasses[variant],
          className
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left section */}
            <div className="flex items-center gap-4">
              {/* Menu button for mobile */}
              {onMenuClick && (
                <button
                  onClick={onMenuClick}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              {/* Logo */}
              {logo && (
                <Link href={logoHref} className="flex items-center">
                  {logo}
                </Link>
              )}

              {/* Navigation items (desktop) - only show if not showing mobile menu */}
              {!showMobileMenu && (
                <div className="hidden lg:flex items-center gap-2">
                  {items.map(renderNavItem)}
                </div>
              )}
            </div>

            {/* Center section - Search */}
            {showSearch && (
              <div className="flex-1 max-w-md mx-4">
                <form onSubmit={handleSearch} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      'block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      variant === 'dark' && 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                    )}
                    placeholder={searchPlaceholder}
                  />
                </form>
              </div>
            )}

            {/* Right section */}
            <div className="flex items-center gap-2">
              {rightItems}
            </div>
          </div>
        </div>

        {/* Mobile navigation menu - only show when explicitly requested */}
        {showMobileMenu && items.length > 0 && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {items.map(renderNavItem)}
            </div>
          </div>
        )}
      </nav>
    );
  }
);
Navbar.displayName = 'Navbar';

// Composants utilitaires pour les éléments de droite
export const NavbarNotifications = ({ count = 0 }: { count?: number }) => (
  <button className="relative p-2 rounded-md hover:bg-gray-100 transition-colors">
    <Bell className="w-5 h-5" />
    {count > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </button>
);

export const NavbarUserMenu = ({ 
  avatar, 
  name, 
  items = [] 
}: { 
  avatar?: React.ReactNode; 
  name?: string; 
  items?: { label: string; onClick: () => void }[];
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        {avatar || <User className="w-5 h-5" />}
        {name && <span className="hidden sm:block text-sm font-medium">{name}</span>}
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsOpen(false);
                  item.onClick();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { Navbar };
