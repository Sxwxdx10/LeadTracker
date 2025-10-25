import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { useFocusTrap } from '@/hooks/useKeyboardNavigation';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, title, children, size = 'md', closable = true, className, ariaLabel, ariaDescribedBy }, ref) => {
    const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);
    const titleId = React.useId();
    
    // Gérer l'événement Escape
    React.useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && closable) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        // Empêcher le scroll du body
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, onClose, closable]);

    if (!isOpen) return null;

    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-4xl'
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={closable ? onClose : undefined}
          aria-hidden="true"
        />
        
        {/* Modal */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-label={!title ? ariaLabel : undefined}
          aria-describedby={ariaDescribedBy}
          className={cn(
            "relative mx-4 w-full rounded-lg bg-white shadow-xl transition-all",
            sizeClasses[size],
            className
          )}
        >
          {/* Header */}
          {(title || closable) && (
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              {title && (
                <h2 id={titleId} className="text-lg font-semibold text-gray-900">
                  {title}
                </h2>
              )}
              {closable && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                  ariaLabel="Fermer la boîte de dialogue"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Modal.displayName = 'Modal';

export { Modal };

// Composant Modal.Header pour plus de flexibilité
export const ModalHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("border-b border-gray-200 px-6 py-4", className)}>
    {children}
  </div>
);

// Composant Modal.Body pour plus de flexibilité
export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("px-6 py-4", className)}>
    {children}
  </div>
);

// Composant Modal.Footer pour plus de flexibilité
export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("border-t border-gray-200 px-6 py-4", className)}>
    {children}
  </div>
);