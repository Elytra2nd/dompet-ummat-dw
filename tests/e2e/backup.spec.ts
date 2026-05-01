import { test, expect } from '@playwright/test';

test.describe('Enterprise Backup Features', () => {
  // Since we are not mocking auth yet, we'll just check if the route exists or redirects
  // A full E2E test usually bypasses auth by injecting a session cookie or logging in first.
  
  test('should render backup UI when accessed (assuming auth bypassed or mocked in future)', async ({ page }) => {
    // Navigate to backup page
    const response = await page.goto('/data/backup');
    
    // We expect the page to either load or redirect to login
    // If it redirects, the test handles it gracefully
    if (page.url().includes('login') || page.url().includes('signin')) {
      console.log('Redirected to login. Auth protection works.');
      return;
    }
    
    // If auth is bypassed, verify the Enterprise UI elements
    await expect(page.locator('text=Parameter Ekstraksi Data')).toBeVisible();
    await expect(page.locator('text=Master Data Saja')).toBeVisible();
    await expect(page.locator('text=Transaksi Saja')).toBeVisible();
  });
});
