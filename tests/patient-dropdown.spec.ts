import { test, expect } from '@playwright/test';

test.describe('Patient Dropdown Menu', () => {
  test('should login and test patient dropdown menu', async ({ page }) => {
    // Navigate to the login page
    await page.goto('http://localhost:5000/');
    
    // Login
    await page.fill('input[type="email"]', 'admin@lifepointmedical.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to patients page
    await page.goto('http://localhost:5000/patients');
    
    // Wait for patients to load
    await page.waitForSelector('.card', { timeout: 10000 });
    
    // Find the first dropdown button (three dots)
    const dropdownButton = page.locator('.dropdown button[data-bs-toggle="dropdown"]').first();
    
    // Check if button exists
    await expect(dropdownButton).toBeVisible();
    
    // Click the dropdown button
    await dropdownButton.click();
    
    // Wait for dropdown menu to appear
    await page.waitForTimeout(500);
    
    // Check if dropdown menu is visible
    const dropdownMenu = page.locator('.dropdown-menu').first();
    await expect(dropdownMenu).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/patient-dropdown.png', fullPage: true });
    
    console.log('Dropdown test completed successfully');
  });
});
