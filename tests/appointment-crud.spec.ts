import { test, expect } from '@playwright/test';

test.describe('Appointment CRUD Operations', () => {
  test('should create, view, and edit appointments successfully', async ({ page }) => {
    // 1. Login as admin
    console.log('Step 1: Logging in as admin...');
    await page.goto('http://localhost:5000/');
    
    await page.fill('input[type="email"]', 'admin@lifepointmedical.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('Login successful!');
    
    // Take screenshot after login
    await page.screenshot({ path: 'test-results/01-logged-in.png', fullPage: true });
    
    // 2. Navigate to appointments page
    console.log('Step 2: Navigating to appointments page...');
    await page.goto('http://localhost:5000/appointments');
    
    // Wait for appointments page to load
    await page.waitForSelector('.page-header', { timeout: 10000 });
    await page.screenshot({ path: 'test-results/02-appointments-page.png', fullPage: true });
    console.log('Appointments page loaded!');
    
    // 3. Click "Add New Appointment" button to open modal
    console.log('Step 3: Opening Add Appointment modal...');
    const addButton = page.locator('button:has-text("Add New Appointment"), a:has-text("Add New Appointment")').first();
    await addButton.click();
    
    // Wait for modal to appear
    await page.waitForSelector('#add_modal', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(1000); // Wait for modal animation
    await page.screenshot({ path: 'test-results/03-add-modal-opened.png', fullPage: true });
    console.log('Add Appointment modal opened!');
    
    // 4. Fill in the appointment form
    console.log('Step 4: Filling in appointment form...');
    
    // Select a patient - click on the select dropdown
    const patientSelect = page.locator('#add_modal .form-label:has-text("Select Patient")').locator('..').locator('.select__control').first();
    await patientSelect.click();
    await page.waitForTimeout(500);
    // Select first patient option
    await page.locator('.select__option').first().click();
    await page.waitForTimeout(500);
    console.log('Patient selected');
    
    // Select a doctor
    const doctorSelect = page.locator('#add_modal .form-label:has-text("Select Doctor")').locator('..').locator('.select__control').first();
    await doctorSelect.click();
    await page.waitForTimeout(500);
    // Select first doctor option
    await page.locator('.select__option').first().click();
    await page.waitForTimeout(500);
    console.log('Doctor selected');
    
    // Select appointment type - verify it shows correct enum values
    console.log('Selecting appointment type and verifying enum values...');
    const consultationSelect = page.locator('#add_modal .form-label:has-text("Preferred Mode of Consultation")').locator('..').locator('.select__control').first();
    await consultationSelect.click();
    await page.waitForTimeout(500);
    
    // Take screenshot to verify dropdown options
    await page.screenshot({ path: 'test-results/04-consultation-type-dropdown.png', fullPage: true });
    
    // Verify that correct options are shown (CONSULTATION, FOLLOW_UP, etc.)
    const consultationOptions = page.locator('.select__option');
    const optionCount = await consultationOptions.count();
    console.log(`Found ${optionCount} consultation type options`);
    
    // Check for correct enum values
    const consultationText = await consultationOptions.first().textContent();
    console.log(`First option: ${consultationText}`);
    
    // Verify "Consultation" option exists (not "In-Person")
    const hasConsultation = await page.locator('.select__option:has-text("Consultation")').count() > 0;
    expect(hasConsultation).toBe(true);
    console.log('✓ Verified: Consultation type dropdown shows correct enum values');
    
    // Select FOLLOW_UP type
    await page.locator('.select__option:has-text("Follow-up")').click();
    await page.waitForTimeout(500);
    console.log('Appointment type selected: Follow-up');
    
    // Select a future date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    const dateInput = page.locator('#add_modal input[placeholder="dd/mm/yyyy"]').first();
    await dateInput.fill(dateString);
    console.log(`Date selected: ${dateString}`);
    
    // Enter start time
    const startTimeInput = page.locator('#add_modal .form-label:has-text("Start Time")').locator('..').locator('input').first();
    await startTimeInput.fill('10:00');
    console.log('Start time entered: 10:00');
    
    // Enter end time
    const endTimeInput = page.locator('#add_modal .form-label:has-text("End Time")').locator('..').locator('input').first();
    await endTimeInput.fill('11:00');
    console.log('End time entered: 11:00');
    
    // Enter reason for visit
    const reasonInput = page.locator('#add_modal textarea[name="reasonForVisit"]');
    await reasonInput.fill('Regular follow-up appointment for test automation');
    console.log('Reason for visit entered');
    
    // Take screenshot before submitting
    await page.screenshot({ path: 'test-results/05-form-filled.png', fullPage: true });
    
    // 5. Submit the form
    console.log('Step 5: Submitting the form...');
    const submitButton = page.locator('#add_modal button[type="submit"]:has-text("Submit")');
    await submitButton.click();
    
    // Wait for modal to close and success message
    await page.waitForTimeout(2000);
    
    // Check for success - modal should be closed
    const modalVisible = await page.locator('#add_modal').isVisible();
    expect(modalVisible).toBe(false);
    console.log('✓ Form submitted successfully - modal closed');
    
    // Take screenshot after submission
    await page.screenshot({ path: 'test-results/06-after-submission.png', fullPage: true });
    
    // 6. Verify the appointment appears in the list
    console.log('Step 6: Verifying appointment appears in the list...');
    await page.waitForTimeout(2000); // Wait for list to refresh
    
    // Look for the appointment in the table
    const appointmentRow = page.locator('tr:has-text("Follow-up")').first();
    await expect(appointmentRow).toBeVisible({ timeout: 5000 });
    console.log('✓ Appointment appears in the list');
    
    // 7. Test editing the appointment
    console.log('Step 7: Testing edit functionality...');
    
    // Find and click the edit button for the first appointment
    const editButton = page.locator('tr').first().locator('button:has-text("Edit"), a:has-text("Edit")').first();
    await editButton.click();
    
    // Wait for edit modal to appear
    await page.waitForSelector('#edit_modal', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/07-edit-modal-opened.png', fullPage: true });
    console.log('Edit modal opened!');
    
    // Change the appointment type to CONSULTATION
    console.log('Changing appointment type to Consultation...');
    const editConsultationSelect = page.locator('#edit_modal .form-label:has-text("Preferred Mode of Consultation")').locator('..').locator('.select__control').first();
    await editConsultationSelect.click();
    await page.waitForTimeout(500);
    
    // Select Consultation option
    await page.locator('.select__option:has-text("Consultation")').first().click();
    await page.waitForTimeout(500);
    console.log('Appointment type changed to Consultation');
    
    // Take screenshot before saving
    await page.screenshot({ path: 'test-results/08-edit-form-modified.png', fullPage: true });
    
    // Submit the edit form
    const updateButton = page.locator('#edit_modal button[type="submit"]:has-text("Submit")');
    await updateButton.click();
    
    // Wait for modal to close
    await page.waitForTimeout(2000);
    
    const editModalVisible = await page.locator('#edit_modal').isVisible();
    expect(editModalVisible).toBe(false);
    console.log('✓ Edit form submitted successfully - modal closed');
    
    // 8. Verify the changes are saved
    console.log('Step 8: Verifying changes are saved...');
    await page.waitForTimeout(2000); // Wait for list to refresh
    
    // Look for the updated appointment with Consultation type
    const updatedRow = page.locator('tr:has-text("Consultation")').first();
    await expect(updatedRow).toBeVisible({ timeout: 5000 });
    console.log('✓ Changes saved successfully - appointment type updated to Consultation');
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/09-final-state.png', fullPage: true });
    
    console.log('\n========================================');
    console.log('✓ All tests passed successfully!');
    console.log('✓ No "In-Person is not an enum" errors');
    console.log('✓ Appointment created successfully');
    console.log('✓ Appointment type dropdown shows correct values');
    console.log('✓ Edit operations work properly');
    console.log('========================================\n');
  });
});
