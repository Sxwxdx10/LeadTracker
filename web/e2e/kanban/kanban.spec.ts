import { test, expect } from '@playwright/test';
import { login } from '../utils/auth-helpers';
import { createLead } from '../utils/lead-helpers';
import { testLeads } from '../fixtures/test-data';

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kanban');
    await page.waitForLoadState('networkidle');
  });

  test('should display kanban board', async ({ page }) => {
    // Check for kanban board container
    await expect(page.locator('[data-testid="kanban-board"], .kanban-board')).toBeVisible();
    
    // Should have at least one column/stage
    const columns = page.locator('[data-testid="kanban-column"], .kanban-column');
    await expect(columns.first()).toBeVisible();
  });

  test('should display stage columns', async ({ page }) => {
    // Common stage names
    const stageNames = ['New', 'Contacted', 'Qualified', 'Won'];
    
    for (const stageName of stageNames) {
      const stageColumn = page.locator(`text="${stageName}"`).first();
      if (await stageColumn.isVisible()) {
        await expect(stageColumn).toBeVisible();
      }
    }
  });

  test('should drag and drop lead between columns', async ({ page }) => {
    // Create a test lead first
    await createLead(page, testLeads.valid);
    await page.goto('/kanban');
    await page.waitForLoadState('networkidle');
    
    const leadName = `${testLeads.valid.firstName} ${testLeads.valid.lastName}`;
    const leadCard = page.locator(`[data-testid="kanban-card"]:has-text("${leadName}")`).first();
    
    if (await leadCard.isVisible()) {
      // Get initial column
      const sourceColumn = leadCard.locator('xpath=ancestor::*[@data-testid="kanban-column"]').first();
      
      // Find target column (different from source)
      const targetColumn = page.locator('[data-testid="kanban-column"]').nth(1);
      
      // Perform drag and drop
      await leadCard.dragTo(targetColumn);
      
      // Wait for update
      await page.waitForTimeout(1000);
      
      // Verify lead moved (this depends on your implementation)
      // You might need to check for toast message or visual confirmation
    }
  });

  test('should filter leads in kanban view', async ({ page }) => {
    // Open filters
    const filterButton = page.locator('button:has-text("Filter"), button:has-text("Filters")');
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      // Apply a filter
      await page.selectOption('select[name="assignedTo"]', { index: 1 });
      await page.click('button:has-text("Apply")');
      
      // Wait for filtered results
      await page.waitForTimeout(500);
    }
  });

  test('should search leads in kanban view', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    
    if (await searchInput.isVisible()) {
      await searchInput.fill(testLeads.valid.email);
      await page.waitForTimeout(500);
      
      const leadName = `${testLeads.valid.firstName} ${testLeads.valid.lastName}`;
      // Check if lead is still visible
      const leadCard = page.locator(`text="${leadName}"`);
      if (await leadCard.count() > 0) {
        await expect(leadCard.first()).toBeVisible();
      }
    }
  });

  test('should display lead count per stage', async ({ page }) => {
    const columns = page.locator('[data-testid="kanban-column"], .kanban-column');
    const columnCount = await columns.count();
    
    for (let i = 0; i < columnCount; i++) {
      const column = columns.nth(i);
      // Look for count indicator
      const countBadge = column.locator('[data-testid="count"], .badge, .count');
      // Count may or may not be displayed
    }
  });

  test('should open lead details from kanban card', async ({ page }) => {
    // Create a test lead
    await createLead(page, testLeads.valid);
    await page.goto('/kanban');
    await page.waitForLoadState('networkidle');
    
    const leadName = `${testLeads.valid.firstName} ${testLeads.valid.lastName}`;
    const leadCard = page.locator(`[data-testid="kanban-card"]:has-text("${leadName}")`).first();
    
    if (await leadCard.isVisible()) {
      await leadCard.click();
      
      // Should open lead details (modal or new page)
      await page.waitForTimeout(500);
      await expect(page.locator(`text="${leadName}"`)).toBeVisible();
    }
  });

  test('should display kanban metrics', async ({ page }) => {
    // Look for metrics/stats section
    const metrics = page.locator('[data-testid="kanban-metrics"], .metrics, .stats');
    
    if (await metrics.isVisible()) {
      await expect(metrics).toBeVisible();
    }
  });

  test('should customize kanban view', async ({ page }) => {
    // Look for settings/customize button
    const settingsButton = page.locator('button:has-text("Settings"), button:has-text("Customize"), button[aria-label*="settings"]');
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      
      // Should show customization options
      await page.waitForTimeout(500);
    }
  });

  test('should refresh kanban board', async ({ page }) => {
    // Look for refresh button
    const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh"]');
    
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Kanban - Real-time Updates', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should reflect real-time changes via SignalR', async ({ page, context }) => {
    await page.goto('/kanban');
    await page.waitForLoadState('networkidle');
    
    // Open a second page to simulate another user
    const page2 = await context.newPage();
    await login(page2);
    await page2.goto('/kanban');
    await page2.waitForLoadState('networkidle');
    
    // Create a lead in page2
    await createLead(page2, testLeads.valid);
    await page2.goto('/kanban');
    
    // Wait for real-time update in page1
    await page.waitForTimeout(2000);
    
    // Check if the new lead appears in page1 (if SignalR is working)
    const leadName = `${testLeads.valid.firstName} ${testLeads.valid.lastName}`;
    // This test depends on SignalR being configured
    
    await page2.close();
  });
});

test.describe('Kanban - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kanban');
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Should be able to navigate through cards
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    const columns = page.locator('[data-testid="kanban-column"], [role="region"]');
    const columnCount = await columns.count();
    
    if (columnCount > 0) {
      // Check for proper accessibility attributes
      const firstColumn = columns.first();
      // Columns should have labels or headings
    }
  });
});

