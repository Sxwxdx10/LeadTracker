/**
 * Performance utilities for the Kanban application
 */

/**
 * Debounce function to limit the rate of function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit the rate of function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Check if code is running in browser
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Request Animation Frame wrapper
 */
export function requestAnimationFrame(callback: () => void): void {
  if (isBrowser && window.requestAnimationFrame) {
    window.requestAnimationFrame(callback);
  } else {
    setTimeout(callback, 16); // ~60fps fallback
  }
}

/**
 * Idle callback wrapper
 */
export function requestIdleCallback(callback: () => void): void {
  if (isBrowser && (window as any).requestIdleCallback) {
    (window as any).requestIdleCallback(callback);
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Batch DOM updates
 */
export function batchUpdates<T>(updates: (() => T)[]): T[] {
  if (isBrowser && (window as any).requestIdleCallback) {
    const results: T[] = [];
    (window as any).requestIdleCallback(() => {
      results.push(...updates.map(update => update()));
    });
    return results;
  }
  
  return updates.map(update => update());
}

/**
 * Lazy load component
 */
export function lazyLoad<T>(
  importFn: () => Promise<{ default: T }>
): () => Promise<T> {
  return () => importFn().then(module => module.default);
}

/**
 * Prefetch image
 */
export function prefetchImage(src: string): void {
  if (!isBrowser) return;
  
  const img = new Image();
  img.src = src;
}

/**
 * Prefetch multiple images
 */
export function prefetchImages(srcs: string[]): void {
  srcs.forEach(src => prefetchImage(src));
}

/**
 * Performance measurement
 */
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  start(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.measurements.has(label)) {
        this.measurements.set(label, []);
      }
      
      this.measurements.get(label)!.push(duration);
    };
  }

  getAverage(label: string): number {
    const measurements = this.measurements.get(label);
    if (!measurements || measurements.length === 0) return 0;
    
    const sum = measurements.reduce((acc, val) => acc + val, 0);
    return sum / measurements.length;
  }

  clear(label?: string): void {
    if (label) {
      this.measurements.delete(label);
    } else {
      this.measurements.clear();
    }
  }

  getAllAverages(): Record<string, number> {
    const averages: Record<string, number> = {};
    
    this.measurements.forEach((_, label) => {
      averages[label] = this.getAverage(label);
    });
    
    return averages;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

