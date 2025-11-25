import { test, expect } from '@playwright/test';

test.describe('Show Appointment Action Icons', () => {
  test('create appointment and show action icons', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5000/');
    await page.fill('input[type="email"]', 'admin@lifepointmedical.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to appointments
    await page.goto('http://localhost:5000/appointments');
    await page.waitForSelector('.card', { timeout: 10000 });
    
    // Click New Appointment button
    await page.click('text=New Appointment');
    await page.waitForSelector('#add_modal', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Fill the form
    // Select first patient
    await page.click('#add_modal .common-select:has-text("Select patient") .react-select__control');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Select first doctor  
    await page.click('#add_modal .common-select:has-text("Select doctor") .react-select__control');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Fill date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.fill('#add_modal input[placeholder="dd/mm/yyyy"]', dateStr);
    
    // Fill time
    await page.fill('#add_modal input[type="text"]:near(:text("Start Time"))', '10:00');
    
    // Fill reason
    await page.fill('#add_modal input[name="reasonForVisit"]', 'Demo appointment to show action icons');
    
    // Submit
    await page.click('#add_modal button[type="submit"]');
    
    // Wait for appointment to appear
    await page.waitForTimeout(3000);
    
    // Screenshot 1: Appointment in table with action button visible
    await page.screenshot({ 
      path: 'test-results/appointment-with-action-button.png', 
      fullPage: true 
    });
    
    // Find and click the three-dot menu
    const actionButton = page.locator('.dropdown button[data-bs-toggle="dropdown"]').first();
    await actionButton.click();
    await page.waitForTimeout(1000);
    
    // Screenshot 2: Dropdown menu showing the three icons
    await page.screenshot({ 
      path: 'test-results/appointment-action-icons-menu.png', 
      fullPage: true 
    });
    
    console.log('✅ Screenshots saved:');
    console.log('  1. test-results/appointment-with-action-button.png');
    console.log('  2. test-results/appointment-action-icons-menu.png');
  });
});
