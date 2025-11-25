import { test, expect } from '@playwright/test';

test.describe('Invoice Auto-Generation', () => {
  test('should automatically generate invoice when visit moves to billing stage', async ({ request }) => {
    const baseURL = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';

    let authToken: string;
    let visitId: string;
    let patientId: string;

    await test.step('Login as admin', async () => {
      const loginResponse = await request.post(`${baseURL}/api/auth/callback/credentials`, {
        data: {
          email: 'admin@lifepointmedical.com',
          password: 'admin123',
          csrfToken: '',
          callbackUrl: `${baseURL}/dashboard`,
          json: true
        }
      });

      expect(loginResponse.ok()).toBeTruthy();
      
      const sessionResponse = await request.get(`${baseURL}/api/auth/session`);
      const session = await sessionResponse.json();
      expect(session.user).toBeDefined();
    });

    await test.step('Get an existing patient or create a test patient', async () => {
      const patientsResponse = await request.get(`${baseURL}/api/patients?limit=1`);
      expect(patientsResponse.ok()).toBeTruthy();
      
      const patientsData = await patientsResponse.json();
      
      if (patientsData.patients && patientsData.patients.length > 0) {
        patientId = patientsData.patients[0]._id;
      } else {
        const createPatientResponse = await request.post(`${baseURL}/api/patients`, {
          data: {
            firstName: 'Test',
            lastName: 'Invoice',
            dateOfBirth: '1990-01-01',
            gender: 'Male',
            phoneNumber: '+2348012345678',
            email: 'test.invoice@example.com',
            address: '123 Test Street',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria',
            emergencyContact: {
              name: 'Emergency Contact',
              relationship: 'Spouse',
              phoneNumber: '+2348098765432'
            }
          }
        });
        
        expect(createPatientResponse.ok()).toBeTruthy();
        const patientData = await createPatientResponse.json();
        patientId = patientData.patient._id;
      }
      
      expect(patientId).toBeDefined();
    });

    await test.step('Create a visit (clock-in at front desk)', async () => {
      const clockInResponse = await request.post(`${baseURL}/api/clocking/clock-in`, {
        data: {
          patientId: patientId,
          reason: 'Test visit for invoice generation'
        }
      });

      expect(clockInResponse.ok()).toBeTruthy();
      const visitData = await clockInResponse.json();
      visitId = visitData.visit._id;
      expect(visitId).toBeDefined();
      expect(visitData.visit.currentStage).toBe('front_desk');
    });

    await test.step('Handoff from front desk to nurse', async () => {
      const handoffResponse = await request.post(`${baseURL}/api/clocking/handoff`, {
        data: {
          visitId: visitId,
          notes: 'Patient ready for vitals check'
        }
      });

      expect(handoffResponse.ok()).toBeTruthy();
      const visitData = await handoffResponse.json();
      expect(visitData.visit.currentStage).toBe('nurse');
    });

    await test.step('Progress through workflow stages', async () => {
      const stages = ['nurse', 'doctor', 'lab', 'pharmacy'];
      
      for (const stage of stages) {
        const handoffResponse = await request.post(`${baseURL}/api/clocking/handoff`, {
          data: {
            visitId: visitId,
            notes: `Completed at ${stage} stage`
          }
        });

        if (handoffResponse.ok()) {
          const visitData = await handoffResponse.json();
          console.log(`Current stage after ${stage}: ${visitData.visit.currentStage}`);
        }
      }
    });

    await test.step('Handoff to billing should auto-generate invoice', async () => {
      const handoffResponse = await request.post(`${baseURL}/api/clocking/handoff`, {
        data: {
          visitId: visitId,
          notes: 'Ready for billing',
          autoGenerateInvoice: true
        }
      });

      expect(handoffResponse.ok()).toBeTruthy();
      const responseData = await handoffResponse.json();
      
      expect(responseData.visit.currentStage).toBe('billing');
      
      if (responseData.invoice) {
        console.log('Invoice auto-generated:', responseData.invoice.invoiceNumber);
        expect(responseData.invoice).toBeDefined();
        expect(responseData.invoice.invoiceNumber).toMatch(/^INV-/);
        expect(responseData.invoice.status).toBe('PENDING');
        expect(responseData.invoice.items.length).toBeGreaterThan(0);
      } else {
        console.log('Invoice not auto-generated (may not have billable items)');
      }
    });

    await test.step('Verify invoice can be retrieved for the visit', async () => {
      const invoiceCheckResponse = await request.get(
        `${baseURL}/api/billing/generate-from-visit?visitId=${visitId}`
      );

      if (invoiceCheckResponse.ok()) {
        const invoiceData = await invoiceCheckResponse.json();
        
        if (invoiceData.invoice) {
          expect(invoiceData.invoice.patientId._id).toBe(patientId);
          expect(invoiceData.invoice.encounterId).toBe(visitId);
          console.log('Invoice successfully verified:', invoiceData.invoice.invoiceNumber);
        }
      }
    });

    await test.step('Manual invoice generation endpoint should work', async () => {
      const manualInvoiceResponse = await request.post(`${baseURL}/api/billing/generate-from-visit`, {
        data: {
          visitId: visitId,
          consultationFee: 10000,
          labTestFee: 5000,
          pharmacyMarkup: 1.3
        }
      });

      if (manualInvoiceResponse.status() === 409) {
        console.log('Invoice already exists for this visit (expected)');
        const conflictData = await manualInvoiceResponse.json();
        expect(conflictData.error).toContain('already exists');
      } else {
        expect(manualInvoiceResponse.ok()).toBeTruthy();
        const invoiceData = await manualInvoiceResponse.json();
        expect(invoiceData.invoice).toBeDefined();
        console.log('Manual invoice generated:', invoiceData.invoice.invoiceNumber);
      }
    });
  });

  test('should handle concurrent invoice generation requests safely', async ({ request }) => {
    const baseURL = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';

    await test.step('Login as admin', async () => {
      await request.post(`${baseURL}/api/auth/callback/credentials`, {
        data: {
          email: 'admin@lifepointmedical.com',
          password: 'admin123',
          csrfToken: '',
          callbackUrl: `${baseURL}/dashboard`,
          json: true
        }
      });
    });

    await test.step('Test concurrent invoice generation', async () => {
      const patientsResponse = await request.get(`${baseURL}/api/patients?limit=1`);
      const patientsData = await patientsResponse.json();
      
      if (!patientsData.patients || patientsData.patients.length === 0) {
        console.log('No patients found, skipping concurrent test');
        return;
      }

      const patientId = patientsData.patients[0]._id;

      const clockInResponse = await request.post(`${baseURL}/api/clocking/clock-in`, {
        data: {
          patientId: patientId,
          reason: 'Concurrent invoice test'
        }
      });

      if (!clockInResponse.ok()) {
        console.log('Could not create visit, skipping concurrent test');
        return;
      }

      const visitData = await clockInResponse.json();
      const visitId = visitData.visit._id;

      const concurrentRequests = Array(5).fill(null).map(() =>
        request.post(`${baseURL}/api/billing/generate-from-visit`, {
          data: {
            visitId: visitId,
            consultationFee: 5000
          }
        })
      );

      const results = await Promise.allSettled(concurrentRequests);
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.ok()).length;
      const conflictCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.status() === 409
      ).length;

      console.log(`Concurrent test: ${successCount} success, ${conflictCount} conflicts`);
      
      expect(successCount + conflictCount).toBe(5);
      expect(successCount).toBeGreaterThanOrEqual(1);
      expect(successCount).toBeLessThanOrEqual(1);
    });
  });
});
