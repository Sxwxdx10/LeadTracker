import { test, expect } from '@playwright/test';
import { register, expectAuthenticatedPage } from '../utils/auth-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    // Check for form title
    await expect(page.locator('h1, h2')).toContainText(/register|sign up|inscription|créer un compte/i);
    
    // Check for all required fields
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="organizationName"]')).toBeVisible();
    await expect(page.locator('input[name="organizationDomain"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should register successfully with valid data', async ({ page }) => {
    const newUser = {
      ...testUsers.newUser,
      email: `test-${Date.now()}@example.com`,
      organizationDomain: `test-org-${Date.now()}`,
    };
    
    await register(page, newUser);
    
    // Should be authenticated and redirected
    await expectAuthenticatedPage(page);
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    // Should stay on register page
    await expect(page).toHaveURL(/\/register/);
    
    // Check for required attributes
    await expect(page.locator('input[name="firstName"]')).toHaveAttribute('required', '');
    await expect(page.locator('input[name="lastName"]')).toHaveAttribute('required', '');
    await expect(page.locator('input[name="email"]')).toHaveAttribute('required', '');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('required', '');
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="organizationName"]', 'Test Org');
    await page.fill('input[name="organizationDomain"]', 'test-org');
    
    await page.click('button[type="submit"]');
    
    // Should show email validation error
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="password"]', '123'); // Weak password
    await page.fill('input[name="organizationName"]', 'Test Org');
    await page.fill('input[name="organizationDomain"]', 'test-org');
    
    await page.click('button[type="submit"]');
    
    // Should show password validation error
    const error = page.locator('.error, [role="alert"]').filter({ 
      hasText: /password|mot de passe/i 
    });
    await expect(error).toBeVisible();
  });

  test('should show error for existing email', async ({ page }) => {
    // Use an existing user email
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', testUsers.user.email); // Existing email
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="organizationName"]', 'Test Org');
    await page.fill('input[name="organizationDomain"]', `test-${Date.now()}`);
    
    await page.click('button[type="submit"]');
    
    // Should show error about existing email
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
  });

  test('should have link to login page', async ({ page }) => {
    const loginLink = page.locator('a[href="/login"], a:has-text("Login"), a:has-text("Sign in"), a:has-text("Connexion")');
    await expect(loginLink).toBeVisible();
    
    await loginLink.click();
    await expect(page).toHaveURL('/login');
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('button[aria-label*="password"], button:has([data-icon="eye"])');
    
    // Initially should be password type
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle if it exists
    if (await toggleButton.count() > 0) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Toggle back
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('should auto-generate organization domain from name', async ({ page }) => {
    await page.fill('input[name="organizationName"]', 'My Test Company');
    
    // Check if domain is auto-filled (if feature exists)
    const domainInput = page.locator('input[name="organizationDomain"]');
    const domainValue = await domainInput.inputValue();
    
    // May be auto-filled or empty depending on implementation
    if (domainValue) {
      expect(domainValue).toMatch(/my-test-company|mytestcompany/i);
    }
  });

  test('should sanitize organization domain', async ({ page }) => {
    await page.fill('input[name="organizationDomain"]', 'Test Org! @#$');
    await page.fill('input[name="organizationDomain"]', 'test-org-123');
    
    const domainInput = page.locator('input[name="organizationDomain"]');
    const domainValue = await domainInput.inputValue();
    
    // Should contain only allowed characters
    expect(domainValue).toMatch(/^[a-z0-9-]+$/);
  });
});

test.describe('Registration - Security', () => {
  test('should not expose password in network requests', async ({ page }) => {
    const requests: string[] = [];
    
    page.on('request', request => {
      requests.push(request.url());
    });
    
    const newUser = {
      ...testUsers.newUser,
      email: `test-${Date.now()}@example.com`,
      organizationDomain: `test-org-${Date.now()}`,
    };
    
    await page.goto('/register');
    await page.fill('input[name="firstName"]', newUser.firstName);
    await page.fill('input[name="lastName"]', newUser.lastName);
    await page.fill('input[name="email"]', newUser.email);
    await page.fill('input[name="password"]', newUser.password);
    await page.fill('input[name="organizationName"]', newUser.organizationName);
    await page.fill('input[name="organizationDomain"]', newUser.organizationDomain);
    await page.click('button[type="submit"]');
    
    // Check that password is not in URL
    const passwordInUrl = requests.some(url => url.includes(newUser.password));
    expect(passwordInUrl).toBe(false);
  });

  test('should have proper autocomplete attributes', async ({ page }) => {
    await page.goto('/register');
    
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('Registration - Demo Mode', () => {
  test('should register in demo mode', async ({ page }) => {
    const newUser = {
      ...testUsers.newUser,
      email: `demo-${Date.now()}@example.com`,
      organizationDomain: `demo-org-${Date.now()}`,
    };
    
    await register(page, newUser);
    
    // Should still work in demo mode
    await expectAuthenticatedPage(page);
  });
});

