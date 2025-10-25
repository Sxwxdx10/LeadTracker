import { useEffect, useRef, useCallback, useState } from 'react';
import { handleListNavigation, KeyboardKeys } from '@/lib/accessibility';

/**
 * Hook for managing keyboard navigation in lists and menus
 */
export function useKeyboardNavigation<T extends HTMLElement = HTMLElement>(
  itemCount: number,
  options: {
    initialIndex?: number;
    wrap?: boolean;
    orientation?: 'vertical' | 'horizontal';
    onSelect?: (index: number) => void;
    enabled?: boolean;
  } = {}
) {
  const {
    initialIndex = -1,
    wrap = true,
    orientation = 'vertical',
    onSelect,
    enabled = true,
  } = options;

  const [focusedIndex, setFocusedIndex] = useState(initialIndex);
  const itemRefs = useRef<(T | null)[]>([]);

  // Update refs array size when itemCount changes
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, itemCount);
  }, [itemCount]);

  const setItemRef = useCallback((index: number) => (ref: T | null) => {
    itemRefs.current[index] = ref;
  }, []);

  const focusItem = useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      itemRefs.current[index]?.focus();
      setFocusedIndex(index);
    }
  }, [itemCount]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || itemCount === 0) return;

      // Handle selection with Enter or Space
      if (event.key === KeyboardKeys.ENTER || event.key === KeyboardKeys.SPACE) {
        if (focusedIndex >= 0 && focusedIndex < itemCount) {
          event.preventDefault();
          onSelect?.(focusedIndex);
        }
        return;
      }

      // Handle navigation
      const handled = handleListNavigation(
        event,
        focusedIndex,
        itemCount,
        (newIndex) => {
          focusItem(newIndex);
        },
        { wrap, orientation }
      );

      if (handled) {
        event.preventDefault();
      }
    },
    [enabled, itemCount, focusedIndex, focusItem, onSelect, wrap, orientation]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    focusItem,
    setItemRef,
    handleKeyDown,
    itemRefs: itemRefs.current,
  };
}

/**
 * Hook for managing focus trap in modals and dialogs
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isActive: boolean = true
) {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Save currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    
    // Get all focusable elements
    const getFocusableElements = () => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        )
      );
    };

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleTab);
      
      // Restore focus to previous element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook to handle Escape key press
 */
export function useEscapeKey(
  onEscape: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === KeyboardKeys.ESCAPE) {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onEscape, enabled]);
}

/**
 * Hook for managing roving tabindex (for better keyboard navigation)
 * Useful for toolbars, menubar, tablist, etc.
 */
export function useRovingTabIndex<T extends HTMLElement = HTMLElement>(
  itemCount: number,
  options: {
    defaultIndex?: number;
    orientation?: 'vertical' | 'horizontal';
    loop?: boolean;
  } = {}
) {
  const {
    defaultIndex = 0,
    orientation = 'horizontal',
    loop = true,
  } = options;

  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const itemRefs = useRef<(T | null)[]>([]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, itemCount);
  }, [itemCount]);

  const setItemRef = useCallback((index: number) => (ref: T | null) => {
    itemRefs.current[index] = ref;
  }, []);

  const getTabIndex = useCallback((index: number) => {
    return index === activeIndex ? 0 : -1;
  }, [activeIndex]);

  const handleKeyDown = useCallback(
    (index: number) => (event: React.KeyboardEvent) => {
      const isHorizontal = orientation === 'horizontal';
      const prevKey = isHorizontal ? KeyboardKeys.ARROW_LEFT : KeyboardKeys.ARROW_UP;
      const nextKey = isHorizontal ? KeyboardKeys.ARROW_RIGHT : KeyboardKeys.ARROW_DOWN;

      let newIndex = index;

      if (event.key === prevKey) {
        event.preventDefault();
        newIndex = index > 0 ? index - 1 : (loop ? itemCount - 1 : index);
      } else if (event.key === nextKey) {
        event.preventDefault();
        newIndex = index < itemCount - 1 ? index + 1 : (loop ? 0 : index);
      } else if (event.key === KeyboardKeys.HOME) {
        event.preventDefault();
        newIndex = 0;
      } else if (event.key === KeyboardKeys.END) {
        event.preventDefault();
        newIndex = itemCount - 1;
      }

      if (newIndex !== index) {
        setActiveIndex(newIndex);
        itemRefs.current[newIndex]?.focus();
      }
    },
    [itemCount, loop, orientation]
  );

  return {
    activeIndex,
    setActiveIndex,
    getTabIndex,
    setItemRef,
    handleKeyDown,
  };
}

/**
 * Hook to announce messages to screen readers
 */
export function useAriaLive() {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announce = useCallback((msg: string, prio: 'polite' | 'assertive' = 'polite') => {
    setMessage(''); // Clear first to ensure announcement
    setTimeout(() => {
      setMessage(msg);
      setPriority(prio);
    }, 100);
  }, []);

  const LiveRegion = useCallback(() => {
    if (!message) return null;

    return (
      <div
        role="status"
        aria-live={priority}
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>
    );
  }, [message, priority]);

  return { announce, LiveRegion };
}

/**
 * Hook to manage focus on mount
 */
export function useAutoFocus<T extends HTMLElement = HTMLElement>(
  shouldFocus: boolean = true,
  delay: number = 0
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!shouldFocus || !ref.current) return;

    const timeoutId = setTimeout(() => {
      ref.current?.focus();
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [shouldFocus, delay]);

  return ref;
}

/**
 * Hook to detect if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

