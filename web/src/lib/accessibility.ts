/**
 * Accessibility utilities for improved WCAG compliance
 * Following WCAG 2.1 Level AA standards
 */

/**
 * Generate a unique ID for accessibility attributes
 */
export function generateA11yId(prefix: string = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if an element meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const [rs, gs, bs] = [r, g, b].map(c => 
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    ) as [number, number, number];
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsContrastRequirements(
  foreground: string, 
  background: string, 
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Get accessible label from various sources
 */
export function getAccessibleLabel(
  label?: string,
  ariaLabel?: string,
  ariaLabelledBy?: string
): Record<string, string> {
  if (ariaLabel) {
    return { 'aria-label': ariaLabel };
  }
  
  if (ariaLabelledBy) {
    return { 'aria-labelledby': ariaLabelledBy };
  }
  
  return {};
}

/**
 * Create ARIA describedby attributes for error messages
 */
export function getErrorAriaAttributes(
  error?: string | boolean,
  errorId?: string
): Record<string, string | boolean> {
  if (!error) return {};
  
  return {
    'aria-invalid': true,
    ...(errorId && typeof error === 'string' ? { 'aria-describedby': errorId } : {})
  };
}

/**
 * Trap focus within a container (useful for modals)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        e.preventDefault();
      }
    }
  };
  
  container.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  firstElement?.focus();
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    )
  );
}

/**
 * Check if an element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return !(
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === 'true'
  );
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

export type KeyboardKey = typeof KeyboardKeys[keyof typeof KeyboardKeys];

/**
 * Handle keyboard navigation for a list of items
 */
export function handleListNavigation(
  event: KeyboardEvent,
  currentIndex: number,
  itemCount: number,
  onNavigate: (index: number) => void,
  options: {
    wrap?: boolean;
    orientation?: 'vertical' | 'horizontal';
  } = {}
): boolean {
  const { wrap = true, orientation = 'vertical' } = options;
  
  const isVertical = orientation === 'vertical';
  const upKey = isVertical ? KeyboardKeys.ARROW_UP : KeyboardKeys.ARROW_LEFT;
  const downKey = isVertical ? KeyboardKeys.ARROW_DOWN : KeyboardKeys.ARROW_RIGHT;
  
  let handled = false;
  
  switch (event.key) {
    case upKey:
      event.preventDefault();
      if (currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (wrap) {
        onNavigate(itemCount - 1);
      }
      handled = true;
      break;
      
    case downKey:
      event.preventDefault();
      if (currentIndex < itemCount - 1) {
        onNavigate(currentIndex + 1);
      } else if (wrap) {
        onNavigate(0);
      }
      handled = true;
      break;
      
    case KeyboardKeys.HOME:
      event.preventDefault();
      onNavigate(0);
      handled = true;
      break;
      
    case KeyboardKeys.END:
      event.preventDefault();
      onNavigate(itemCount - 1);
      handled = true;
      break;
  }
  
  return handled;
}

/**
 * Create screen reader only CSS class
 */
export const srOnlyStyles = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
} as const;

/**
 * Debounce announcements to avoid overwhelming screen readers
 */
let announcementTimeout: NodeJS.Timeout | null = null;

export function debouncedAnnounce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
  delay: number = 150
): void {
  if (announcementTimeout) {
    clearTimeout(announcementTimeout);
  }
  
  announcementTimeout = setTimeout(() => {
    announceToScreenReader(message, priority);
  }, delay);
}

