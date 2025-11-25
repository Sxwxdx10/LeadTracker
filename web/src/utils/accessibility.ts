// /** Accessibility utilities for the Kanban application
 

export interface ARIAAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
}

/**
 * Live region for screen reader announcements
 */
class LiveRegion {
  private element: HTMLElement | null = null;

  init() {
    if (typeof window === 'undefined') return;

    this.element = document.createElement('div');
    this.element.setAttribute('role', 'status');
    this.element.setAttribute('aria-live', 'polite');
    this.element.setAttribute('aria-atomic', 'true');
    this.element.className = 'sr-only';
    this.element.style.position = 'absolute';
    this.element.style.left = '-10000px';
    this.element.style.width = '1px';
    this.element.style.height = '1px';
    this.element.style.overflow = 'hidden';

    document.body.appendChild(this.element);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.element) this.init();

    if (this.element) {
      this.element.setAttribute('aria-live', priority);
      this.element.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (this.element) {
          this.element.textContent = '';
        }
      }, 1000);
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }
}

export const liveRegion = new LiveRegion();

/**
 * Keyboard navigation helper
 */
export class KeyboardNavigator {
  private elements: HTMLElement[] = [];
  private currentIndex = -1;
  private onNavigate: ((index: number) => void) | undefined;

  constructor(elements: HTMLElement[] = [], onNavigate?: (index: number) => void) {
    this.elements = elements;
    this.onNavigate = onNavigate;
  }

  setElements(elements: HTMLElement[]) {
    this.elements = elements;
    this.currentIndex = -1;
  }

  navigate(direction: 'next' | 'prev' | 'first' | 'last') {
    const newIndex = this.getNewIndex(direction);
    
    if (newIndex !== this.currentIndex) {
      this.currentIndex = newIndex;
      const element = this.elements[this.currentIndex];
      
      if (element) {
        element.focus();
        this.onNavigate?.(this.currentIndex);
      }
    }
  }

  private getNewIndex(direction: 'next' | 'prev' | 'first' | 'last'): number {
    switch (direction) {
      case 'next':
        return this.currentIndex < this.elements.length - 1 ? this.currentIndex + 1 : 0;
      case 'prev':
        return this.currentIndex > 0 ? this.currentIndex - 1 : this.elements.length - 1;
      case 'first':
        return 0;
      case 'last':
        return Math.max(0, this.elements.length - 1);
      default:
        return this.currentIndex;
    }
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }
}

/**
 * Trap focus within a container
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Get accessible label for an action
 */
export function getAccessibleLabel(action: string, context?: string): string {
  const labels: Record<string, string> = {
    'edit': 'Modifier',
    'delete': 'Supprimer',
    'view': 'Voir',
    'create': 'Créer',
    'save': 'Enregistrer',
    'cancel': 'Annuler',
    'close': 'Fermer',
    'expand': 'Développer',
    'collapse': 'Réduire',
    'filter': 'Filtrer',
    'sort': 'Trier',
    'search': 'Rechercher',
    'drag': 'Glisser',
    'drop': 'Déposer'
  };

  const baseLabel = labels[action.toLowerCase()] || action;
  return context ? `${baseLabel} ${context}` : baseLabel;
}

/**
 * Format date for screen readers
 */
export function formatDateForScreenReader(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

/**
 * Check if element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0
  );
}

/**
 * Set focus with announcement
 */
export function setFocusWithAnnouncement(
  element: HTMLElement,
  announcement: string
): void {
  element.focus();
  liveRegion.announce(announcement);
}

/**
 * ARIA attributes helper
 */
export const aria = {
  label: (label: string) => ({ 'aria-label': label }),
  labelledBy: (id: string) => ({ 'aria-labelledby': id }),
  describedBy: (id: string) => ({ 'aria-describedby': id }),
  live: (region: 'polite' | 'assertive') => ({ 'aria-live': region }),
  atomic: (atomic: boolean = true) => ({ 'aria-atomic': atomic }),
  busy: (busy: boolean = true) => ({ 'aria-busy': busy }),
  expanded: (expanded: boolean) => ({ 'aria-expanded': expanded }),
  hidden: (hidden: boolean = true) => ({ 'aria-hidden': hidden }),
  selected: (selected: boolean) => ({ 'aria-selected': selected }),
  checked: (checked: boolean) => ({ 'aria-checked': checked }),
  disabled: (disabled: boolean = true) => ({ 'aria-disabled': disabled }),
  required: (required: boolean = true) => ({ 'aria-required': required }),
  invalid: (invalid: boolean = true) => ({ 'aria-invalid': invalid }),
  role: (role: string) => ({ role }),
  tabIndex: (index: number) => ({ tabIndex: index === -1 ? -1 : index })
};

/**
 * Initialize accessibility features
 */
export function initAccessibility() {
  if (typeof window === 'undefined') return;
  
  liveRegion.init();
  
  // Add skip to content link
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-md';
  skipLink.textContent = 'Aller au contenu principal';
  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Check keyboard navigation preferences
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get appropriate animation duration based on preferences
 */
export function getAnimationDuration(baseDuration: number = 200): number {
  return prefersReducedMotion() ? 0 : baseDuration;
}

/**
 * Safe focus management
 */
export function safeFocus(element: HTMLElement | null) {
  if (!element) return;
  
  try {
    element.focus({ preventScroll: true });
  } catch (e) {
    console.warn('Failed to focus element:', e);
  }
}

