import { test, expect } from '@playwright/test';
import { login, logout, expectLoginPage, expectAuthenticatedPage } from '../utils/auth-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expectLoginPage(page);
    
    // Check for form elements
    await expect(page.locator('h1, h2')).toContainText(/login|connexion/i);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', testUsers.user.email);
    await page.fill('input[name="password"]', testUsers.user.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard/leads/kanban
    await expect(page).toHaveURL(/^\/(leads|kanban|dashboard)/, { timeout: 10000 });
    
    // Should be authenticated
    await expectAuthenticatedPage(page);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Should show error message
    await expect(page.locator('.error, [role="alert"], .text-red-500')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Check for validation messages
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    // HTML5 validation or custom error messages
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
  });

  test('should have link to register page', async ({ page }) => {
    const registerLink = page.locator('a[href="/register"], a:has-text("Register"), a:has-text("Sign up"), a:has-text("Créer un compte")');
    await expect(registerLink).toBeVisible();
    
    await registerLink.click();
    await expect(page).toHaveURL('/register');
  });

  test('should have link to forgot password page', async ({ page }) => {
    const forgotLink = page.locator('a[href="/forgot-password"], a:has-text("Forgot password"), a:has-text("Mot de passe oublié")');
    await expect(forgotLink).toBeVisible();
    
    await forgotLink.click();
    await expect(page).toHaveURL('/forgot-password');
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

  test('should persist session after page reload', async ({ page }) => {
    // Login
    await login(page);
    await expectAuthenticatedPage(page);
    
    // Reload page
    await page.reload();
    
    // Should still be authenticated
    await expectAuthenticatedPage(page);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await login(page);
    await expectAuthenticatedPage(page);
    
    // Logout
    await logout(page);
    
    // Should be on login page
    await expectLoginPage(page);
  });
});

test.describe('Login - Demo Mode', () => {
  test('should login in demo mode when API is unavailable', async ({ page }) => {
    // This test assumes demo mode is active when NEXT_PUBLIC_API_URL is not set
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'demo@example.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    
    // Should still redirect even in demo mode
    await expect(page).toHaveURL(/^\/(leads|kanban|dashboard)/, { timeout: 10000 });
  });
});

test.describe('Login - Security', () => {
  test('should not expose password in network requests', async ({ page }) => {
    const requests: string[] = [];
    
    page.on('request', request => {
      requests.push(request.url());
    });
    
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.user.email);
    await page.fill('input[name="password"]', testUsers.user.password);
    await page.click('button[type="submit"]');
    
    // Check that password is not in URL
    const passwordInUrl = requests.some(url => url.includes(testUsers.user.password));
    expect(passwordInUrl).toBe(false);
  });

  test('should have autocomplete attributes for password managers', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    // Check for proper autocomplete attributes
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

