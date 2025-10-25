import { Page, expect } from '@playwright/test';
import { testUsers } from '../fixtures/test-data';

/**
 * Helper functions for authentication in E2E tests
 */

/**
 * Login with credentials
 */
export async function login(
  page: Page,
  email: string = testUsers.user.email,
  password: string = testUsers.user.password
) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForURL(/^\/(leads|kanban|dashboard)/, { timeout: 10000 });
}

/**
 * Login as admin
 */
export async function loginAsAdmin(page: Page) {
  await login(page, testUsers.admin.email, testUsers.admin.password);
}

/**
 * Register a new user
 */
export async function register(page: Page, userData = testUsers.newUser) {
  await page.goto('/register');
  
  await page.fill('input[name="firstName"]', userData.firstName);
  await page.fill('input[name="lastName"]', userData.lastName);
  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="password"]', userData.password);
  await page.fill('input[name="organizationName"]', userData.organizationName);
  await page.fill('input[name="organizationDomain"]', userData.organizationDomain);
  
  await page.click('button[type="submit"]');
  
  // Wait for successful registration
  await page.waitForURL(/^\/(leads|kanban|dashboard)/, { timeout: 10000 });
}

/**
 * Logout
 */
export async function logout(page: Page) {
  // Click on user menu
  await page.click('[data-testid="user-menu"], [aria-label*="menu"], button:has-text("Profile")');
  
  // Click logout button
  await page.click('button:has-text("Logout"), button:has-text("Déconnexion")');
  
  // Verify redirected to login
  await page.waitForURL('/login', { timeout: 5000 });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for authenticated elements (user menu, etc.)
    const userMenu = await page.locator('[data-testid="user-menu"]').count();
    return userMenu > 0;
  } catch {
    return false;
  }
}

/**
 * Setup authenticated session with storage state
 */
export async function setupAuthenticatedSession(page: Page) {
  await login(page);
  
  // Wait a bit for session to be established
  await page.waitForTimeout(1000);
  
  // Return storage state for reuse
  return await page.context().storageState();
}

/**
 * Verify user is on login page
 */
export async function expectLoginPage(page: Page) {
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
}

/**
 * Verify user is authenticated and on a protected page
 */
export async function expectAuthenticatedPage(page: Page) {
  // Should not be on login/register pages
  await expect(page).not.toHaveURL(/\/(login|register)/);
  
  // Should have user menu or authenticated indicators
  const isAuth = await isAuthenticated(page);
  expect(isAuth).toBe(true);
}

