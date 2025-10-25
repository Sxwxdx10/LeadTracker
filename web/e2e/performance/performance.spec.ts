import { test, expect } from '@playwright/test';
import { login } from '../utils/auth-helpers';
import { measurePageLoadTime } from '../utils/common-helpers';

/**
 * Performance tests to ensure application meets performance requirements
 */

test.describe('Performance - Page Load Times', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Login page should load in under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Login page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(2000);
  });

  test('Leads list should load in under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Leads list load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('Kanban board should load in under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/kanban');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Kanban board load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('Lead details should load in under 2 seconds', async ({ page }) => {
    // First create/find a lead
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');
    
    const firstLead = page.locator('tbody tr, [data-testid="lead-row"]').first();
    
    if (await firstLead.isVisible()) {
      const startTime = Date.now();
      await firstLead.click();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`Lead details load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(2000);
    }
  });
});

test.describe('Performance - API Response Times', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Leads API should respond in under 1 second', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/leads') && response.status() === 200,
      { timeout: 5000 }
    );
    
    await page.goto('/leads');
    
    const response = await responsePromise;
    const timing = response.timing();
    
    console.log(`Leads API response time: ${timing.responseEnd}ms`);
    expect(timing.responseEnd).toBeLessThan(1000);
  });

  test('Search should respond in under 500ms', async ({ page }) => {
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    
    if (await searchInput.isVisible()) {
      const startTime = Date.now();
      
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/leads'),
        { timeout: 2000 }
      );
      
      await searchInput.fill('test');
      await responsePromise;
      
      const responseTime = Date.now() - startTime;
      console.log(`Search response time: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(500);
    }
  });
});

test.describe('Performance - Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Table should render 100 rows without lag', async ({ page }) => {
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    
    // Scroll through table
    const table = page.locator('table, [role="table"]');
    
    if (await table.isVisible()) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await page.waitForTimeout(500);
      
      const renderTime = Date.now() - startTime;
      console.log(`Table render time: ${renderTime}ms`);
      expect(renderTime).toBeLessThan(1000);
    }
  });

  test('Kanban board should render without lag', async ({ page }) => {
    await page.goto('/kanban');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    
    // Count cards
    const cards = await page.locator('[data-testid="kanban-card"], .kanban-card').count();
    
    const renderTime = Date.now() - startTime;
    console.log(`Kanban rendered ${cards} cards in ${renderTime}ms`);
    expect(renderTime).toBeLessThan(2000);
  });
});

test.describe('Performance - Memory', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('No memory leaks after navigation', async ({ page }) => {
    // Navigate between pages multiple times
    const pages = ['/leads', '/kanban', '/tasks', '/analytics'];
    
    for (let i = 0; i < 3; i++) {
      for (const url of pages) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
      }
    }
    
    // Get memory metrics
    const metrics = await page.evaluate(() => ({
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : null,
    }));
    
    if (metrics.memory) {
      console.log('Memory usage:', metrics.memory);
      
      // Heap size should not exceed 80% of limit
      const heapUsagePercent = (metrics.memory.usedJSHeapSize / metrics.memory.jsHeapSizeLimit) * 100;
      expect(heapUsagePercent).toBeLessThan(80);
    }
  });
});

test.describe('Performance - Bundle Size', () => {
  test('Initial JS bundle should be under 500KB', async ({ page }) => {
    const resources: { name: string; size: number }[] = [];
    
    page.on('response', async (response) => {
      if (response.url().includes('.js') && response.status() === 200) {
        const buffer = await response.body();
        resources.push({
          name: response.url().split('/').pop() || 'unknown',
          size: buffer.length,
        });
      }
    });
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Calculate total JS size
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    const totalSizeKB = totalSize / 1024;
    
    console.log(`Total JS bundle size: ${totalSizeKB.toFixed(2)}KB`);
    console.log('Resources:', resources.map(r => ({
      name: r.name,
      size: `${(r.size / 1024).toFixed(2)}KB`
    })));
    
    expect(totalSizeKB).toBeLessThan(500);
  });
});

test.describe('Performance - Network', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Page should load with 3G connection', async ({ page, context }) => {
    // Throttle network to 3G speeds
    await context.route('**/*', route => {
      setTimeout(() => route.continue(), 100); // Add 100ms delay
    });
    
    const startTime = Date.now();
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time on 3G: ${loadTime}ms`);
    // Should load in under 5 seconds even on 3G
    expect(loadTime).toBeLessThan(5000);
  });

  test('Critical content should load first (above the fold)', async ({ page }) => {
    await page.goto('/leads', { waitUntil: 'domcontentloaded' });
    
    // Check that critical content is visible before full page load
    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 2000 });
    
    // Navigation should be visible
    const nav = page.locator('nav, [role="navigation"]').first();
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible({ timeout: 2000 });
    }
  });
});

test.describe('Performance - Core Web Vitals', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Measure Core Web Vitals', async ({ page }) => {
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');
    
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        let lcp = 0;
        let fid = 0;
        let cls = 0;
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          lcp = lastEntry.renderTime || lastEntry.loadTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Give it some time to collect metrics
        setTimeout(() => {
          resolve({ lcp, fid, cls });
        }, 2000);
      });
    });
    
    console.log('Core Web Vitals:', vitals);
    
    // LCP should be under 2.5s (good)
    if (vitals.lcp > 0) {
      expect(vitals.lcp).toBeLessThan(2500);
    }
    
    // CLS should be under 0.1 (good)
    expect(vitals.cls).toBeLessThan(0.1);
  });
});

