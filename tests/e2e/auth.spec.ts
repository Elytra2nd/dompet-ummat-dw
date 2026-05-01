import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Attempt to access a protected route
    await page.goto('/dashboard');
    
    // Expect to be redirected to login page
    // Using regular expression to match either `/login` or `/api/auth/signin`
    await expect(page).toHaveURL(/.*login|.*signin/);
  });

  test('should render the login page correctly', async ({ page }) => {
    // Need to test the actual login page rendering
    // Since NextAuth is used, it might redirect to `/login` if custom page exists
    await page.goto('/login');
    
    // Check if some login elements exist
    // If it's standard NextAuth, there might be a specific title
    const pageContent = await page.content();
    expect(pageContent).toContain('Login');
  });
});
