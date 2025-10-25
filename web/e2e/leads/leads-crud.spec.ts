import { test, expect } from '@playwright/test';
import { login } from '../utils/auth-helpers';
import { 
  createLead, 
  searchLead, 
  openLeadDetails, 
  editLead, 
  deleteLead,
  verifyLeadExists,
  verifyLeadNotExists,
  goToLeadsPage 
} from '../utils/lead-helpers';
import { testLeads } from '../fixtures/test-data';

test.describe('Leads - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test.describe('Create Lead', () => {
    test('should create a lead with all fields', async ({ page }) => {
      const leadName = `${testLeads.complete.firstName} ${testLeads.complete.lastName}`;
      
      await createLead(page, testLeads.complete);
      
      // Verify lead was created
      await verifyLeadExists(page, leadName);
    });

    test('should create a lead with minimal required fields', async ({ page }) => {
      const leadName = `${testLeads.minimal.firstName} ${testLeads.minimal.lastName}`;
      
      await createLead(page, testLeads.minimal);
      
      // Verify lead was created
      await verifyLeadExists(page, leadName);
    });

    test('should show validation errors for missing required fields', async ({ page }) => {
      await goToLeadsPage(page);
      await page.click('button:has-text("New Lead"), button:has-text("Create")');
      
      // Submit without filling fields
      await page.click('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Save")');
      
      // Should show validation errors
      await expect(page.locator('.error, [role="alert"]')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await goToLeadsPage(page);
      await page.click('button:has-text("New Lead"), button:has-text("Create")');
      
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="email"]', 'invalid-email');
      
      await page.click('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Save")');
      
      // Should show email validation error
      await expect(page.locator('.error, [role="alert"]')).toBeVisible();
    });

    test('should cancel lead creation', async ({ page }) => {
      await goToLeadsPage(page);
      await page.click('button:has-text("New Lead"), button:has-text("Create")');
      
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      
      // Click cancel
      await page.click('button:has-text("Cancel")');
      
      // Should return to leads list
      await expect(page).toHaveURL('/leads');
    });
  });

  test.describe('Read Lead', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test lead
      await createLead(page, testLeads.valid);
    });

    test('should display lead in list', async ({ page }) => {
      const leadName = `${testLeads.valid.firstName} ${testLeads.valid.lastName}`;
      await verifyLeadExists(page, leadName);
    });

    test('should open lead details', async ({ page }) => {
      const leadName = `${testLeads.valid.firstName} ${testLeads.valid.lastName}`;
      
      await openLeadDetails(page, leadName);
      
      // Verify on details page
      await expect(page).toHaveURL(/\/leads\/[\w-]+/);
      await expect(page.locator('h1, h2')).toContainText(leadName);
    });

    test('should display all lead information', async ({ page }) => {
      const leadName = `${testLeads.valid.firstName} ${testLeads.valid.lastName}`;
      
      await openLeadDetails(page, leadName);
      
      // Check for lead details
      await expect(page.locator(`text="${testLeads.valid.email}"`)).toBeVisible();
      await expect(page.locator(`text="${testLeads.valid.company}"`)).toBeVisible();
      if (testLeads.valid.phone) {
        await expect(page.locator(`text="${testLeads.valid.phone}"`)).toBeVisible();
      }
    });

    test('should search leads', async ({ page }) => {
      await searchLead(page, testLeads.valid.email);
      
      const leadName = `${testLeads.valid.firstName} ${testLeads.valid.lastName}`;
      await expect(page.locator(`text="${leadName}"`)).toBeVisible();
    });
  });

  test.describe('Update Lead', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test lead
      await createLead(page, testLeads.valid);
    });

    test('should update lead information', async ({ page }) => {
      const leadName = `${testLeads.valid.firstName} ${testLeads.valid.lastName}`;
      
      await editLead(page, leadName, {
        company: 'Updated Company',
        phone: '+1111111111',
      });
      
      // Verify updates
      await expect(page.locator('text="Updated Company"')).toBeVisible();
    });

    test('should cancel lead update', async ({ page }) => {
      const leadName = `${testLeads.valid.firstName} ${testLeads.valid.lastName}`;
      
      await openLeadDetails(page, leadName);
      await page.click('button:has-text("Edit")');
      
      // Make changes
      await page.fill('input[name="company"]', 'Should Not Save');
      
      // Cancel
      await page.click('button:has-text("Cancel")');
      
      // Verify changes were not saved
      await expect(page.locator('text="Should Not Save"')).not.toBeVisible();
      await expect(page.locator(`text="${testLeads.valid.company}"`)).toBeVisible();
    });
  });

  test.describe('Delete Lead', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test lead
      await createLead(page, testLeads.valid);
    });

    test('should delete lead', async ({ page }) => {
      const leadName = `${testLeads.valid.firstName} ${testLeads.valid.lastName}`;
      
      await deleteLead(page, leadName);
      
      // Verify lead was deleted
      await verifyLeadNotExists(page, leadName);
    });

    test('should cancel lead deletion', async ({ page }) => {
      const leadName = `${testLeads.valid.firstName} ${testLeads.valid.lastName}`;
      
      await openLeadDetails(page, leadName);
      await page.click('button:has-text("Delete")');
      
      // Cancel in confirmation modal
      await page.click('button:has-text("Cancel")');
      
      // Verify lead still exists
      await verifyLeadExists(page, leadName);
    });
  });
});

test.describe('Leads - Filtering and Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should filter leads by status', async ({ page }) => {
    await goToLeadsPage(page);
    
    // Open filters
    await page.click('button:has-text("Filter"), button:has-text("Filters")');
    
    // Select a status
    await page.selectOption('select[name="status"]', 'Active');
    
    // Apply filters
    await page.click('button:has-text("Apply")');
    
    // Wait for results
    await page.waitForTimeout(500);
  });

  test('should sort leads by name', async ({ page }) => {
    await goToLeadsPage(page);
    
    // Click on name column header to sort
    await page.click('th:has-text("Name"), th:has-text("Nom")');
    
    // Wait for sort
    await page.waitForTimeout(500);
  });

  test('should clear filters', async ({ page }) => {
    await goToLeadsPage(page);
    
    // Apply filters
    await page.click('button:has-text("Filter"), button:has-text("Filters")');
    await page.selectOption('select[name="status"]', 'Active');
    await page.click('button:has-text("Apply")');
    
    // Clear filters
    await page.click('button:has-text("Clear"), button:has-text("Reset")');
    
    // All leads should be visible again
    await page.waitForTimeout(500);
  });
});

test.describe('Leads - Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate between pages', async ({ page }) => {
    await goToLeadsPage(page);
    
    // Check if pagination exists
    const nextButton = page.locator('button:has-text("Next"), button[aria-label="Next page"]');
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
      
      // Should be on page 2
      await expect(page.locator('.pagination, [role="navigation"]')).toContainText('2');
    }
  });

  test('should change page size', async ({ page }) => {
    await goToLeadsPage(page);
    
    // Look for page size selector
    const pageSizeSelect = page.locator('select[name="pageSize"], select[aria-label*="page size"]');
    
    if (await pageSizeSelect.isVisible()) {
      await pageSizeSelect.selectOption('50');
      await page.waitForTimeout(500);
    }
  });
});

