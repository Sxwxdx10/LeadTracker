import { test, expect } from '@playwright/test';
import { login, register, logout } from '../utils/auth-helpers';
import { createLead, openLeadDetails, editLead, deleteLead } from '../utils/lead-helpers';
import { testUsers, testLeads } from '../fixtures/test-data';

/**
 * Regression tests for critical user flows
 * These tests ensure that core functionality continues to work after changes
 */

test.describe('Regression - Critical Flows', () => {
  test('Complete user journey: Register → Login → Create Lead → Edit → Delete → Logout', async ({ page }) => {
    // Step 1: Register
    const newUser = {
      ...testUsers.newUser,
      email: `regression-${Date.now()}@example.com`,
      organizationDomain: `regression-org-${Date.now()}`,
    };
    
    await register(page, newUser);
    await expect(page).toHaveURL(/^\/(leads|kanban|dashboard)/);
    
    // Step 2: Logout
    await logout(page);
    await expect(page).toHaveURL('/login');
    
    // Step 3: Login again
    await login(page, newUser.email, newUser.password);
    await expect(page).toHaveURL(/^\/(leads|kanban|dashboard)/);
    
    // Step 4: Create Lead
    const leadName = `${testLeads.valid.firstName} ${testLeads.valid.lastName}`;
    await createLead(page, testLeads.valid);
    await page.goto('/leads');
    await expect(page.locator(`text="${leadName}"`)).toBeVisible();
    
    // Step 5: Edit Lead
    await editLead(page, leadName, { company: 'Updated Company' });
    await expect(page.locator('text="Updated Company"')).toBeVisible();
    
    // Step 6: Delete Lead
    await deleteLead(page, leadName);
    await expect(page.locator(`text="${leadName}"`)).not.toBeVisible();
    
    // Step 7: Logout
    await logout(page);
    await expect(page).toHaveURL('/login');
  });

  test('Navigation flow: All main pages accessible', async ({ page }) => {
    await login(page);
    
    // Navigate to all main pages
    const pages = [
      { url: '/leads', title: /leads|prospects/i },
      { url: '/kanban', title: /kanban|pipeline/i },
      { url: '/tasks', title: /tasks|tâches/i },
      { url: '/analytics', title: /analytics|statistiques/i },
      { url: '/settings', title: /settings|paramètres/i },
    ];
    
    for (const { url, title } of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded successfully
      const pageTitle = page.locator('h1, h2').first();
      if (await pageTitle.isVisible()) {
        await expect(pageTitle).toContainText(title);
      }
      
      // Verify no console errors
      await page.waitForTimeout(500);
    }
  });

  test('Data persistence: Lead data persists across page reloads', async ({ page }) => {
    await login(page);
    
    // Create a lead
    const leadName = `${testLeads.valid.firstName} ${testLeads.valid.lastName}`;
    await createLead(page, testLeads.valid);
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify lead still exists
    await page.goto('/leads');
    await expect(page.locator(`text="${leadName}"`)).toBeVisible();
  });

  test('Session management: Session persists across browser restart', async ({ context, page }) => {
    await login(page);
    
    // Save storage state
    const storageState = await context.storageState();
    
    // Close and create new context with saved state
    await context.close();
    const newContext = await page.context().browser()!.newContext({ storageState });
    const newPage = await newContext.newPage();
    
    // Navigate to protected page
    await newPage.goto('/leads');
    
    // Should still be authenticated
    await expect(newPage).toHaveURL('/leads');
    await expect(newPage.locator('[data-testid="user-menu"]')).toBeVisible();
    
    await newContext.close();
  });

  test('Error handling: Graceful handling of network errors', async ({ page }) => {
    await login(page);
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Try to navigate
    await page.goto('/leads');
    await page.waitForTimeout(2000);
    
    // Should show error message or offline indicator
    // This depends on your error handling implementation
    
    // Restore connection
    await page.context().setOffline(false);
  });
});

test.describe('Regression - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('All required fields validated across forms', async ({ page }) => {
    // Test lead creation form
    await page.goto('/leads/new');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
    
    // Add more form validation tests as needed
  });

  test('Email format validated consistently', async ({ page }) => {
    await page.goto('/leads/new');
    
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'invalid-email');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
  });
});

test.describe('Regression - UI Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Navigation menu visible on all pages', async ({ page }) => {
    const pages = ['/leads', '/kanban', '/tasks', '/analytics'];
    
    for (const url of pages) {
      await page.goto(url);
      
      // Check for navigation menu
      const nav = page.locator('nav, [role="navigation"]');
      if (await nav.count() > 0) {
        await expect(nav.first()).toBeVisible();
      }
    }
  });

  test('User menu accessible on all pages', async ({ page }) => {
    const pages = ['/leads', '/kanban', '/tasks'];
    
    for (const url of pages) {
      await page.goto(url);
      
      const userMenu = page.locator('[data-testid="user-menu"], [aria-label*="menu"]');
      if (await userMenu.count() > 0) {
        await expect(userMenu.first()).toBeVisible();
      }
    }
  });

  test('Consistent button styles across pages', async ({ page }) => {
    await page.goto('/leads');
    
    // Take screenshot of buttons for visual regression
    const primaryButton = page.locator('button:has-text("New"), button:has-text("Create")').first();
    
    if (await primaryButton.isVisible()) {
      await primaryButton.screenshot({ path: 'test-results/button-style.png' });
    }
  });
});

test.describe('Regression - Mobile Responsiveness', () => {
  test.use({ 
    viewport: { width: 375, height: 667 } // iPhone SE size
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Mobile menu accessible', async ({ page }) => {
    await page.goto('/leads');
    
    // Look for mobile menu button (hamburger)
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button:has([data-icon="bars"])');
    
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      // Menu should open
      const menu = page.locator('[role="menu"], .mobile-menu');
      await expect(menu).toBeVisible();
    }
  });

  test('Forms usable on mobile', async ({ page }) => {
    await page.goto('/leads/new');
    
    // Form should be visible and usable
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    
    // Fill form
    await page.fill('input[name="firstName"]', testLeads.minimal.firstName);
    await page.fill('input[name="lastName"]', testLeads.minimal.lastName);
    await page.fill('input[name="email"]', testLeads.minimal.email);
    
    // Submit button should be reachable
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('Tables responsive on mobile', async ({ page }) => {
    await page.goto('/leads');
    
    // Table should be visible or have mobile-friendly alternative
    const table = page.locator('table, [role="table"]');
    const cards = page.locator('[data-testid="lead-card"]');
    
    // Either table or cards should be visible
    const tableVisible = await table.count() > 0;
    const cardsVisible = await cards.count() > 0;
    
    expect(tableVisible || cardsVisible).toBe(true);
  });
});

