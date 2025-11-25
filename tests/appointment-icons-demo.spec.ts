import { test, expect } from '@playwright/test';

test.describe('Appointment Action Icons Demo', () => {
  test('should demonstrate appointment action icons (view, edit, delete)', async ({ page }) => {
    // 1. Login as admin
    console.log('Step 1: Logging in as admin...');
    await page.goto('http://localhost:5000/');
    
    await page.fill('input[type="email"]', 'admin@lifepointmedical.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('✓ Login successful!');
    
    // 2. Navigate to appointments page
    console.log('Step 2: Navigating to /appointments page...');
    await page.goto('http://localhost:5000/appointments');
    
    // Wait for appointments page to load
    await page.waitForSelector('h4:has-text("Appointments")', { timeout: 10000 });
    console.log('✓ Appointments page loaded!');
    
    // 3. Click "New Appointment" button
    console.log('Step 3: Clicking "New Appointment" button...');
    const newAppointmentButton = page.locator('a:has-text("New Appointment")').first();
    await newAppointmentButton.click();
    
    // Wait for modal to appear
    await page.waitForSelector('#add_modal', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(1000);
    console.log('✓ New Appointment modal opened!');
    
    // 4. Fill in the appointment form
    console.log('Step 4: Filling in appointment form...');
    
    // Select first patient from dropdown
    console.log('  - Selecting first patient...');
    const patientSelect = page.locator('#add_modal .form-label:has-text("Select Patient")').locator('..').locator('.select__control').first();
    await patientSelect.click();
    await page.waitForTimeout(500);
    await page.locator('.select__option').first().click();
    await page.waitForTimeout(500);
    console.log('  ✓ First patient selected');
    
    // Select first doctor from dropdown
    console.log('  - Selecting first doctor...');
    const doctorSelect = page.locator('#add_modal .form-label:has-text("Select Doctor")').locator('..').locator('.select__control').first();
    await doctorSelect.click();
    await page.waitForTimeout(500);
    await page.locator('.select__option').first().click();
    await page.waitForTimeout(500);
    console.log('  ✓ First doctor selected');
    
    // Select "Consultation" as appointment type
    console.log('  - Selecting "Consultation" as appointment type...');
    const consultationSelect = page.locator('#add_modal .form-label:has-text("Preferred Mode of Consultation")').locator('..').locator('.select__control').first();
    await consultationSelect.click();
    await page.waitForTimeout(500);
    await page.locator('.select__option:has-text("Consultation")').first().click();
    await page.waitForTimeout(500);
    console.log('  ✓ "Consultation" selected');
    
    // Select tomorrow's date
    console.log('  - Selecting tomorrow\'s date...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    const dateInput = page.locator('#add_modal input[placeholder="dd/mm/yyyy"]').first();
    await dateInput.fill(dateString);
    console.log(`  ✓ Date selected: ${dateString}`);
    
    // Enter "10:00" as start time
    console.log('  - Entering start time...');
    const startTimeInput = page.locator('#add_modal .form-label:has-text("Start Time")').locator('..').locator('input').first();
    await startTimeInput.fill('10:00');
    console.log('  ✓ Start time entered: 10:00');
    
    // Enter reason for visit
    console.log('  - Entering reason for visit...');
    const reasonInput = page.locator('#add_modal textarea[name="reasonForVisit"]');
    await reasonInput.fill('Test appointment for icons demo');
    console.log('  ✓ Reason entered: "Test appointment for icons demo"');
    
    // 5. Submit the form
    console.log('Step 5: Submitting the form...');
    const submitButton = page.locator('#add_modal button[type="submit"]:has-text("Submit")');
    await submitButton.click();
    
    // Wait for modal to close and success message
    await page.waitForTimeout(2000);
    console.log('✓ Form submitted successfully!');
    
    // 6. Wait for the appointment to appear in the table
    console.log('Step 6: Waiting for appointment to appear in the table...');
    await page.waitForTimeout(2000);
    
    // Look for the appointment with our reason text
    const appointmentRow = page.locator('tr:has-text("Test appointment for icons demo")').first();
    await expect(appointmentRow).toBeVisible({ timeout: 5000 });
    console.log('✓ Appointment appeared in the table!');
    
    // 7. Find the three-dot menu button (ti ti-dots-vertical icon) in the appointment row
    console.log('Step 7: Finding the three-dot menu button...');
    const threeDotMenuButton = appointmentRow.locator('a[data-bs-toggle="dropdown"]').first();
    await expect(threeDotMenuButton).toBeVisible();
    console.log('✓ Three-dot menu button found!');
    
    // 8. Take a screenshot showing the appointment in the table with the action menu button visible
    console.log('Step 8: Taking screenshot of appointment row with menu button...');
    await page.screenshot({ 
      path: 'test-results/appointment-icons-demo/01-appointment-row-with-menu-button.png', 
      fullPage: true 
    });
    console.log('✓ Screenshot saved: 01-appointment-row-with-menu-button.png');
    
    // 9. Click the three-dot menu to open the dropdown
    console.log('Step 9: Clicking the three-dot menu to open dropdown...');
    await threeDotMenuButton.click();
    await page.waitForTimeout(500);
    console.log('✓ Dropdown menu opened!');
    
    // 10. Take a screenshot showing the dropdown menu with the three action items
    console.log('Step 10: Taking screenshot of dropdown menu with action items...');
    
    // Verify all three action items are visible
    const viewDetailsButton = page.locator('.dropdown-menu a:has-text("View Details")').first();
    const editButton = page.locator('.dropdown-menu a:has-text("Edit")').first();
    const cancelButton = page.locator('.dropdown-menu a:has-text("Cancel")').first();
    
    await expect(viewDetailsButton).toBeVisible();
    await expect(editButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
    
    // Verify icons are present
    const eyeIcon = page.locator('.dropdown-menu i.ti-eye').first();
    const editIcon = page.locator('.dropdown-menu i.ti-edit').first();
    const trashIcon = page.locator('.dropdown-menu i.ti-trash').first();
    
    await expect(eyeIcon).toBeVisible();
    await expect(editIcon).toBeVisible();
    await expect(trashIcon).toBeVisible();
    
    console.log('✓ All three action items verified:');
    console.log('  - Eye icon (ti ti-eye) - View Details');
    console.log('  - Edit icon (ti ti-edit) - Edit');
    console.log('  - Trash icon (ti ti-trash) - Cancel');
    
    await page.screenshot({ 
      path: 'test-results/appointment-icons-demo/02-dropdown-menu-with-actions.png', 
      fullPage: true 
    });
    console.log('✓ Screenshot saved: 02-dropdown-menu-with-actions.png');
    
    console.log('\n========================================');
    console.log('✓ Test completed successfully!');
    console.log('✓ Screenshots saved to: test-results/appointment-icons-demo/');
    console.log('  1. 01-appointment-row-with-menu-button.png - Shows appointment with menu button');
    console.log('  2. 02-dropdown-menu-with-actions.png - Shows dropdown with all action icons');
    console.log('========================================\n');
  });
});
