import { Page, expect } from '@playwright/test';
import { testLeads } from '../fixtures/test-data';

/**
 * Helper functions for lead management in E2E tests
 */

/**
 * Navigate to leads page
 */
export async function goToLeadsPage(page: Page) {
  await page.goto('/leads');
  await page.waitForLoadState('networkidle');
}

/**
 * Create a new lead
 */
export async function createLead(page: Page, leadData = testLeads.valid) {
  await goToLeadsPage(page);
  
  // Click "New Lead" or "Create Lead" button
  await page.click('button:has-text("New Lead"), button:has-text("Create"), button:has-text("Add Lead")');
  
  // Fill lead form
  await page.fill('input[name="firstName"]', leadData.firstName);
  await page.fill('input[name="lastName"]', leadData.lastName);
  await page.fill('input[name="email"]', leadData.email);
  
  if (leadData.phone) {
    await page.fill('input[name="phone"]', leadData.phone);
  }
  
  if (leadData.company) {
    await page.fill('input[name="company"]', leadData.company);
  }
  
  if (leadData.position) {
    await page.fill('input[name="position"]', leadData.position);
  }
  
  if (leadData.source) {
    await page.selectOption('select[name="source"]', leadData.source);
  }
  
  // Submit form
  await page.click('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Save")');
  
  // Wait for success message or redirect
  await page.waitForTimeout(1000);
}

/**
 * Search for a lead
 */
export async function searchLead(page: Page, searchTerm: string) {
  await goToLeadsPage(page);
  
  // Find and fill search input
  const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"]');
  await searchInput.fill(searchTerm);
  
  // Wait for results
  await page.waitForTimeout(500);
}

/**
 * Open lead details
 */
export async function openLeadDetails(page: Page, leadName: string) {
  await goToLeadsPage(page);
  
  // Click on the lead row or name
  await page.click(`text="${leadName}"`);
  
  // Wait for details page to load
  await page.waitForURL(/\/leads\/[\w-]+/);
}

/**
 * Edit lead
 */
export async function editLead(page: Page, leadName: string, updates: Partial<typeof testLeads.valid>) {
  await openLeadDetails(page, leadName);
  
  // Click edit button
  await page.click('button:has-text("Edit")');
  
  // Update fields
  if (updates.firstName) {
    await page.fill('input[name="firstName"]', updates.firstName);
  }
  if (updates.lastName) {
    await page.fill('input[name="lastName"]', updates.lastName);
  }
  if (updates.email) {
    await page.fill('input[name="email"]', updates.email);
  }
  if (updates.phone) {
    await page.fill('input[name="phone"]', updates.phone);
  }
  if (updates.company) {
    await page.fill('input[name="company"]', updates.company);
  }
  
  // Save changes
  await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Update")');
  
  // Wait for success
  await page.waitForTimeout(1000);
}

/**
 * Delete lead
 */
export async function deleteLead(page: Page, leadName: string) {
  await openLeadDetails(page, leadName);
  
  // Click delete button
  await page.click('button:has-text("Delete")');
  
  // Confirm deletion in modal
  await page.click('button:has-text("Confirm"), button:has-text("Delete"):visible');
  
  // Wait for redirect to leads list
  await page.waitForURL('/leads');
}

/**
 * Filter leads
 */
export async function filterLeads(page: Page, filterOptions: {
  status?: string;
  stage?: string;
  source?: string;
  assignedTo?: string;
}) {
  await goToLeadsPage(page);
  
  // Open filters
  await page.click('button:has-text("Filter"), button:has-text("Filters")');
  
  if (filterOptions.status) {
    await page.selectOption('select[name="status"]', filterOptions.status);
  }
  
  if (filterOptions.stage) {
    await page.selectOption('select[name="stage"]', filterOptions.stage);
  }
  
  if (filterOptions.source) {
    await page.selectOption('select[name="source"]', filterOptions.source);
  }
  
  // Apply filters
  await page.click('button:has-text("Apply")');
  
  await page.waitForTimeout(500);
}

/**
 * Verify lead exists in list
 */
export async function verifyLeadExists(page: Page, leadName: string) {
  await goToLeadsPage(page);
  await expect(page.locator(`text="${leadName}"`)).toBeVisible();
}

/**
 * Verify lead does not exist in list
 */
export async function verifyLeadNotExists(page: Page, leadName: string) {
  await goToLeadsPage(page);
  await expect(page.locator(`text="${leadName}"`)).not.toBeVisible();
}

/**
 * Get leads count
 */
export async function getLeadsCount(page: Page): Promise<number> {
  await goToLeadsPage(page);
  
  // Look for pagination info or count indicator
  const countText = await page.locator('[data-testid="leads-count"], .pagination-info').textContent();
  
  if (countText) {
    const match = countText.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }
  
  // Fallback: count table rows
  const rows = await page.locator('tbody tr, [data-testid="lead-row"]').count();
  return rows;
}

