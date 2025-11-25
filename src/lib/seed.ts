import bcrypt from 'bcryptjs';
import dbConnect from './dbConnect';
import {
  User,
  Branch,
  Patient,
  PatientVisit,
  LabTest,
  Prescription,
  Appointment,
  Attendance,
  StaffProfile,
  Encounter,
  Billing,
  Invoice,
  Payment,
  Notification,
  Message,
  ServiceCharge,
} from '@/models';

/**
 * Seed the database with initial data
 * 
 * @param force - If true, clears ALL existing data before seeding
 * 
 * IMPORTANT: This function should ONLY be called programmatically in controlled environments.
 * The force parameter should NEVER be exposed through public API endpoints to prevent
 * accidental data loss.
 * 
 * DATA INTEGRITY GUARANTEE:
 * When force=true, this function clears ALL collections to prevent orphaned data and
 * referential integrity issues. All collections are cleared to ensure a clean state:
 * - Branch, User, Patient, StaffProfile
 * - Appointment, Attendance, PatientVisit
 * - LabTest, Prescription, Encounter
 * - Billing, Invoice, Payment, ServiceCharge
 * - Notification, Message
 * 
 * This comprehensive clearing prevents:
 * 1. Orphaned records referencing deleted entities
 * 2. Data inconsistencies across related collections
 * 3. Foreign key constraint violations
 * 4. Stale data from previous seeding operations
 */
export async function seedDatabase(force: boolean = false) {
  try {
    await dbConnect();

    // Check if data already exists
    const existingBranch = await Branch.findOne();
    if (existingBranch && !force) {
      console.log('Database already seeded');
      return { success: true, message: 'Database already seeded' };
    }

    if (force && existingBranch) {
      // CRITICAL: Clear ALL collections to maintain data integrity
      // Do not remove any collection from this list without understanding the consequences
      await Promise.all([
        // Core entities
        Branch.deleteMany({}),
        User.deleteMany({}),
        Patient.deleteMany({}),
        StaffProfile.deleteMany({}),
        
        // Appointments and visits
        Appointment.deleteMany({}),
        Attendance.deleteMany({}),
        PatientVisit.deleteMany({}),
        
        // Medical records
        LabTest.deleteMany({}),
        Prescription.deleteMany({}),
        Encounter.deleteMany({}),
        
        // Financial records
        Billing.deleteMany({}),
        Invoice.deleteMany({}),
        Payment.deleteMany({}),
        ServiceCharge.deleteMany({}),
        
        // Communication
        Notification.deleteMany({}),
        Message.deleteMany({}),
      ]);
      console.log('Existing data cleared for re-seeding');
    }

    // Create main branch
    const mainBranch = await Branch.create({
      name: 'Life Point Medical Centre - Main Branch',
      code: 'LPMC-MAIN',
      address: '123 Medical Avenue',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      phone: '+234-800-LIFEPOINT',
      email: 'info@lifepointmedical.com',
      isActive: true,
    });

    // Create super admin - password will be hashed by pre-save hook
    const superAdmin = await User.create({
      firstName: 'Super',
      lastName: 'Administrator',
      email: 'admin@lifepointmedical.com',
      password: 'admin123',
      phoneNumber: '+234-800-ADMIN',
      role: 'ADMIN',
      branchId: mainBranch._id,
      isActive: true,
    });

    // Create sample doctors - passwords will be hashed by pre-save hook
    const doctor1 = await User.create({
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'dr.sarah@lifepointmedical.com',
      password: 'doctor123',
      phoneNumber: '+234-801-2345678',
      role: 'DOCTOR',
      branchId: mainBranch._id,
      isActive: true,
    });

    const doctor2 = await User.create({
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'dr.michael@lifepointmedical.com',
      password: 'doctor123',
      phoneNumber: '+234-802-3456789',
      role: 'DOCTOR',
      branchId: mainBranch._id,
      isActive: true,
    });

    // Create front desk staff
    const frontDesk = await User.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'frontdesk@lifepointmedical.com',
      password: 'desk123',
      phoneNumber: '+234-803-4567890',
      role: 'FRONT_DESK',
      branchId: mainBranch._id,
      isActive: true,
    });

    // Create nurse
    const nurse = await User.create({
      firstName: 'Mary',
      lastName: 'Williams',
      email: 'nurse@lifepointmedical.com',
      password: 'nurse123',
      phoneNumber: '+234-804-5678901',
      role: 'NURSE',
      branchId: mainBranch._id,
      isActive: true,
    });

    // Create lab technician
    const labTech = await User.create({
      firstName: 'James',
      lastName: 'Anderson',
      email: 'lab@lifepointmedical.com',
      password: 'lab123',
      phoneNumber: '+234-805-6789012',
      role: 'LAB',
      branchId: mainBranch._id,
      isActive: true,
    });

    // Create pharmacy staff
    const pharmacist = await User.create({
      firstName: 'Patricia',
      lastName: 'Brown',
      email: 'pharmacy@lifepointmedical.com',
      password: 'pharmacy123',
      phoneNumber: '+234-806-7890123',
      role: 'PHARMACY',
      branchId: mainBranch._id,
      isActive: true,
    });

    // Create billing staff
    const billingStaff = await User.create({
      firstName: 'Robert',
      lastName: 'Davis',
      email: 'billing@lifepointmedical.com',
      password: 'billing123',
      phoneNumber: '+234-807-8901234',
      role: 'BILLING',
      branchId: mainBranch._id,
      isActive: true,
    });

    // Create accounting staff
    const accountingStaff = await User.create({
      firstName: 'Elizabeth',
      lastName: 'Thompson',
      email: 'accounting@lifepointmedical.com',
      password: 'accounting123',
      phoneNumber: '+234-808-9012345',
      role: 'ACCOUNTING',
      branchId: mainBranch._id,
      isActive: true,
    });

    // Create service charges for the branch
    await ServiceCharge.create([
      {
        serviceName: 'General Consultation',
        category: 'consultation',
        price: 5000,
        description: 'Standard medical consultation fee',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
      {
        serviceName: 'Specialist Consultation',
        category: 'consultation',
        price: 10000,
        description: 'Specialist doctor consultation fee',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
      {
        serviceName: 'Follow-up Consultation',
        category: 'consultation',
        price: 3000,
        description: 'Follow-up visit consultation fee',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
      {
        serviceName: 'Complete Blood Count (CBC)',
        category: 'laboratory',
        price: 3000,
        description: 'Full blood count test',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
      {
        serviceName: 'Blood Glucose Test',
        category: 'laboratory',
        price: 1500,
        description: 'Fasting blood sugar test',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
      {
        serviceName: 'Lipid Profile',
        category: 'laboratory',
        price: 5000,
        description: 'Cholesterol and triglycerides test',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
      {
        serviceName: 'Urine Analysis',
        category: 'laboratory',
        price: 2000,
        description: 'Complete urine examination',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
      {
        serviceName: 'X-Ray (Standard)',
        category: 'imaging',
        price: 8000,
        description: 'Standard X-ray imaging',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
      {
        serviceName: 'Ultrasound Scan',
        category: 'imaging',
        price: 12000,
        description: 'Ultrasound imaging scan',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
      {
        serviceName: 'ECG Test',
        category: 'procedure',
        price: 4000,
        description: 'Electrocardiogram test',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
      {
        serviceName: 'Blood Pressure Check',
        category: 'procedure',
        price: 500,
        description: 'Blood pressure monitoring',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
      {
        serviceName: 'Pharmacy Markup',
        category: 'pharmacy',
        price: 1.2,
        description: 'Markup multiplier for medication prices',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
      {
        serviceName: 'Emergency Consultation',
        category: 'emergency',
        price: 15000,
        description: 'Emergency room consultation fee',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
      {
        serviceName: 'General Ward Admission (per day)',
        category: 'admission',
        price: 20000,
        description: 'Daily charge for general ward admission',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
      {
        serviceName: 'Private Ward Admission (per day)',
        category: 'admission',
        price: 35000,
        description: 'Daily charge for private ward admission',
        isActive: true,
        branch: mainBranch._id,
        createdBy: superAdmin._id
      },
    ]);

    console.log('✅ Service charges created successfully');

    // Create sample patients
    const patient1 = await Patient.create({
      patientId: 'LP-2024-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phoneNumber: '+234-805-1234567',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'Male',
      bloodGroup: 'O+',
      address: '45 Victoria Street',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      emergencyContact: {
        name: 'Jane Doe',
        phoneNumber: '+234-806-1234567',
        relationship: 'Wife',
      },
      branchId: mainBranch._id,
      registeredBy: superAdmin._id,
      isActive: true,
    });

    const patient2 = await Patient.create({
      patientId: 'LP-2024-002',
      firstName: 'Mary',
      lastName: 'Johnson',
      email: 'mary.j@email.com',
      phoneNumber: '+234-807-2345678',
      dateOfBirth: new Date('1990-08-20'),
      gender: 'Female',
      bloodGroup: 'A+',
      address: '78 Allen Avenue',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      emergencyContact: {
        name: 'Robert Johnson',
        phoneNumber: '+234-808-2345678',
        relationship: 'Husband',
      },
      insurance: {
        provider: 'NHIS',
        policyNumber: 'NHIS-2024-5678',
        validUntil: new Date('2025-12-31'),
      },
      allergies: ['Penicillin', 'Peanuts'],
      branchId: mainBranch._id,
      registeredBy: superAdmin._id,
      isActive: true,
    });

    const patient3 = await Patient.create({
      patientId: 'LP-2024-003',
      firstName: 'David',
      lastName: 'Williams',
      email: 'david.w@email.com',
      phoneNumber: '+234-809-3456789',
      dateOfBirth: new Date('1978-03-10'),
      gender: 'Male',
      bloodGroup: 'B+',
      address: '12 Ikoyi Crescent',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      emergencyContact: {
        name: 'Sarah Williams',
        phoneNumber: '+234-810-3456789',
        relationship: 'Sister',
      },
      branchId: mainBranch._id,
      registeredBy: frontDesk._id,
      isActive: true,
    });

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const visit1 = await PatientVisit.create({
      visitNumber: 'VIS-2024-001',
      patient: patient1._id,
      branchId: mainBranch._id,
      visitDate: twoDaysAgo,
      currentStage: 'completed',
      status: 'completed',
      stages: {
        frontDesk: {
          clockedInBy: frontDesk._id,
          clockedInAt: new Date(twoDaysAgo.getTime() + 9 * 60 * 60 * 1000),
          clockedOutBy: frontDesk._id,
          clockedOutAt: new Date(twoDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 15 * 60 * 1000),
          notes: 'Patient checked in for regular consultation',
          nextAction: 'nurse'
        },
        nurse: {
          clockedInBy: nurse._id,
          clockedInAt: new Date(twoDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 20 * 60 * 1000),
          clockedOutBy: nurse._id,
          clockedOutAt: new Date(twoDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 35 * 60 * 1000),
          vitalSigns: {
            bloodPressure: '120/80',
            temperature: 36.8,
            pulse: 72,
            weight: 75.5,
            height: 175,
            bmi: 24.7
          },
          notes: 'Vital signs normal',
          nextAction: 'doctor'
        },
        doctor: {
          clockedInBy: doctor1._id,
          clockedInAt: new Date(twoDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 40 * 60 * 1000),
          clockedOutBy: doctor1._id,
          clockedOutAt: new Date(twoDaysAgo.getTime() + 10 * 60 * 60 * 1000 + 10 * 60 * 1000),
          diagnosis: 'Upper Respiratory Tract Infection',
          notes: 'Prescribed antibiotics and analgesics',
          nextAction: 'pharmacy'
        },
        pharmacy: {
          clockedInBy: frontDesk._id,
          clockedInAt: new Date(twoDaysAgo.getTime() + 10 * 60 * 60 * 1000 + 15 * 60 * 1000),
          clockedOutBy: frontDesk._id,
          clockedOutAt: new Date(twoDaysAgo.getTime() + 10 * 60 * 60 * 1000 + 25 * 60 * 1000),
          notes: 'Medications dispensed',
          nextAction: 'completed'
        }
      },
      finalClockOut: {
        clockedOutBy: frontDesk._id,
        clockedOutAt: new Date(twoDaysAgo.getTime() + 10 * 60 * 60 * 1000 + 30 * 60 * 1000),
        notes: 'Visit completed successfully'
      }
    });

    const visit2 = await PatientVisit.create({
      visitNumber: 'VIS-2024-002',
      patient: patient2._id,
      branchId: mainBranch._id,
      visitDate: yesterday,
      currentStage: 'doctor',
      status: 'in_progress',
      stages: {
        frontDesk: {
          clockedInBy: frontDesk._id,
          clockedInAt: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000),
          clockedOutBy: frontDesk._id,
          clockedOutAt: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000 + 10 * 60 * 1000),
          notes: 'Follow-up visit for previous allergy concerns',
          nextAction: 'nurse'
        },
        nurse: {
          clockedInBy: nurse._id,
          clockedInAt: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000 + 15 * 60 * 1000),
          clockedOutBy: nurse._id,
          clockedOutAt: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000 + 30 * 60 * 1000),
          vitalSigns: {
            bloodPressure: '118/75',
            temperature: 37.1,
            pulse: 68,
            weight: 62.0,
            height: 165,
            bmi: 22.8
          },
          notes: 'Patient appears stable',
          nextAction: 'doctor'
        },
        doctor: {
          clockedInBy: doctor2._id,
          clockedInAt: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000 + 35 * 60 * 1000),
          notes: 'Currently consulting with patient'
        }
      }
    });

    const visit3 = await PatientVisit.create({
      visitNumber: 'VIS-2024-003',
      patient: patient3._id,
      branchId: mainBranch._id,
      visitDate: now,
      currentStage: 'nurse',
      status: 'in_progress',
      stages: {
        frontDesk: {
          clockedInBy: frontDesk._id,
          clockedInAt: new Date(now.getTime() - 30 * 60 * 1000),
          clockedOutBy: frontDesk._id,
          clockedOutAt: new Date(now.getTime() - 20 * 60 * 1000),
          notes: 'Patient complaining of chest pain',
          nextAction: 'nurse'
        },
        nurse: {
          clockedInBy: nurse._id,
          clockedInAt: new Date(now.getTime() - 15 * 60 * 1000),
          vitalSigns: {
            bloodPressure: '135/85',
            temperature: 36.9,
            pulse: 88,
            weight: 82.3,
            height: 178,
            bmi: 26.0
          },
          notes: 'Elevated BP, monitoring patient'
        }
      }
    });

    const visit4 = await PatientVisit.create({
      visitNumber: 'VIS-2024-004',
      patient: patient1._id,
      branchId: mainBranch._id,
      visitDate: yesterday,
      currentStage: 'completed',
      status: 'completed',
      stages: {
        frontDesk: {
          clockedInBy: frontDesk._id,
          clockedInAt: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000),
          clockedOutBy: frontDesk._id,
          clockedOutAt: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000 + 8 * 60 * 1000),
          notes: 'Routine checkup',
          nextAction: 'nurse'
        },
        nurse: {
          clockedInBy: nurse._id,
          clockedInAt: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000 + 12 * 60 * 1000),
          clockedOutBy: nurse._id,
          clockedOutAt: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000 + 25 * 60 * 1000),
          vitalSigns: {
            bloodPressure: '122/78',
            temperature: 36.7,
            pulse: 70,
            weight: 76.0,
            height: 175,
            bmi: 24.8
          },
          notes: 'All vitals within normal range',
          nextAction: 'doctor'
        },
        doctor: {
          clockedInBy: doctor1._id,
          clockedInAt: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000 + 30 * 60 * 1000),
          clockedOutBy: doctor1._id,
          clockedOutAt: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000 + 50 * 60 * 1000),
          diagnosis: 'Routine checkup - Patient in good health',
          notes: 'No medication required, advised lifestyle maintenance',
          nextAction: 'completed'
        }
      },
      finalClockOut: {
        clockedOutBy: frontDesk._id,
        clockedOutAt: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000 + 55 * 60 * 1000),
        notes: 'Checkup completed, patient discharged'
      }
    });

    const prescription1 = await Prescription.create({
      prescriptionNumber: 'RX-2024-001',
      patient: patient1._id,
      doctor: doctor1._id,
      visit: visit1._id,
      branchId: mainBranch._id,
      diagnosis: 'Upper Respiratory Tract Infection',
      medications: [
        {
          name: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'Three times daily',
          duration: '7 days',
          instructions: 'Take after meals',
          quantity: 21
        },
        {
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: 'As needed',
          duration: '5 days',
          instructions: 'For fever or pain, maximum 4 times daily',
          quantity: 20
        }
      ],
      status: 'dispensed',
      dispensedBy: frontDesk._id,
      dispensedAt: new Date(twoDaysAgo.getTime() + 10 * 60 * 60 * 1000 + 25 * 60 * 1000),
    });

    const prescription2 = await Prescription.create({
      prescriptionNumber: 'RX-2024-002',
      patient: patient2._id,
      doctor: doctor2._id,
      visit: visit2._id,
      branchId: mainBranch._id,
      diagnosis: 'Allergic Rhinitis',
      medications: [
        {
          name: 'Cetirizine',
          dosage: '10mg',
          frequency: 'Once daily',
          duration: '14 days',
          instructions: 'Take before bedtime',
          quantity: 14
        }
      ],
      status: 'active',
    });

    const prescription3 = await Prescription.create({
      prescriptionNumber: 'RX-2024-003',
      patient: patient3._id,
      doctor: doctor1._id,
      visit: visit3._id,
      branchId: mainBranch._id,
      diagnosis: 'Hypertension - Monitoring',
      medications: [
        {
          name: 'Amlodipine',
          dosage: '5mg',
          frequency: 'Once daily',
          duration: '30 days',
          instructions: 'Take in the morning',
          quantity: 30
        }
      ],
      status: 'active',
    });

    await LabTest.create({
      testNumber: 'LAB-2024-001',
      patient: patient1._id,
      doctor: doctor1._id,
      visit: visit1._id,
      branchId: mainBranch._id,
      testName: 'Complete Blood Count (CBC)',
      testCategory: 'Hematology',
      description: 'Full blood count to check for infection',
      status: 'completed',
      priority: 'routine',
      requestedBy: doctor1._id,
      requestedAt: new Date(twoDaysAgo.getTime() + 10 * 60 * 60 * 1000),
      result: {
        findings: 'WBC: 8.5 x10^9/L, RBC: 4.8 x10^12/L, Hemoglobin: 14.2 g/dL, Platelets: 250 x10^9/L',
        normalRange: 'WBC: 4-11 x10^9/L, RBC: 4.5-5.5 x10^12/L, Hb: 13-17 g/dL, Platelets: 150-400 x10^9/L',
        remarks: 'All values within normal limits',
        performedBy: doctor1._id,
        completedAt: new Date(twoDaysAgo.getTime() + 12 * 60 * 60 * 1000)
      }
    });

    await LabTest.create({
      testNumber: 'LAB-2024-002',
      patient: patient2._id,
      doctor: doctor2._id,
      visit: visit2._id,
      branchId: mainBranch._id,
      testName: 'Allergy Panel',
      testCategory: 'Immunology',
      description: 'Testing for common allergens',
      status: 'in_progress',
      priority: 'urgent',
      requestedBy: doctor2._id,
      requestedAt: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000 + 40 * 60 * 1000),
    });

    await LabTest.create({
      testNumber: 'LAB-2024-003',
      patient: patient3._id,
      doctor: doctor1._id,
      visit: visit3._id,
      branchId: mainBranch._id,
      testName: 'Lipid Profile',
      testCategory: 'Clinical Chemistry',
      description: 'Cholesterol and triglycerides check',
      status: 'pending',
      priority: 'routine',
      requestedBy: doctor1._id,
      requestedAt: new Date(now.getTime() - 10 * 60 * 1000),
    });

    await LabTest.create({
      testNumber: 'LAB-2024-004',
      patient: patient3._id,
      doctor: doctor1._id,
      visit: visit3._id,
      branchId: mainBranch._id,
      testName: 'ECG (Electrocardiogram)',
      testCategory: 'Cardiology',
      description: 'Heart rhythm and electrical activity assessment',
      status: 'pending',
      priority: 'urgent',
      requestedBy: doctor1._id,
      requestedAt: new Date(now.getTime() - 5 * 60 * 1000),
    });

    await LabTest.create({
      testNumber: 'LAB-2024-005',
      patient: patient1._id,
      doctor: doctor1._id,
      visit: visit4._id,
      branchId: mainBranch._id,
      testName: 'Blood Glucose (Fasting)',
      testCategory: 'Clinical Chemistry',
      description: 'Fasting blood sugar test',
      status: 'completed',
      priority: 'routine',
      requestedBy: doctor1._id,
      requestedAt: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000 + 35 * 60 * 1000),
      result: {
        findings: 'Fasting Blood Glucose: 92 mg/dL',
        normalRange: '70-100 mg/dL (fasting)',
        remarks: 'Normal glucose level',
        performedBy: nurse._id,
        completedAt: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000 + 45 * 60 * 1000)
      }
    });

    await PatientVisit.findByIdAndUpdate(visit1._id, {
      'stages.doctor.prescription': prescription1._id
    });

    await PatientVisit.findByIdAndUpdate(visit2._id, {
      'stages.doctor.prescription': prescription2._id
    });

    await PatientVisit.findByIdAndUpdate(visit3._id, {
      'stages.doctor.prescription': prescription3._id
    });

    // Create appointments for doctors and front desk
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await Appointment.create({
      appointmentId: 'APP-2024-001',
      patientId: patient1._id,
      doctorId: doctor1._id,
      branchId: mainBranch._id,
      appointmentDate: now,
      appointmentTime: '10:00 AM',
      reasonForVisit: 'Follow-up consultation',
      type: 'Follow-up',
      status: 'CONFIRMED',
      createdBy: frontDesk._id,
    });

    await Appointment.create({
      appointmentId: 'APP-2024-002',
      patientId: patient2._id,
      doctorId: doctor2._id,
      branchId: mainBranch._id,
      appointmentDate: now,
      appointmentTime: '11:30 AM',
      reasonForVisit: 'Allergy consultation',
      type: 'Consultation',
      status: 'CONFIRMED',
      createdBy: frontDesk._id,
    });

    await Appointment.create({
      appointmentId: 'APP-2024-003',
      patientId: patient3._id,
      doctorId: doctor1._id,
      branchId: mainBranch._id,
      appointmentDate: tomorrow,
      appointmentTime: '09:00 AM',
      reasonForVisit: 'Hypertension follow-up',
      type: 'Follow-up',
      status: 'SCHEDULED',
      createdBy: frontDesk._id,
    });

    await Appointment.create({
      appointmentId: 'APP-2024-004',
      patientId: patient1._id,
      doctorId: doctor2._id,
      branchId: mainBranch._id,
      appointmentDate: tomorrow,
      appointmentTime: '02:00 PM',
      reasonForVisit: 'General checkup',
      type: 'Checkup',
      status: 'SCHEDULED',
      createdBy: frontDesk._id,
    });

    // Create billing records
    const billing1 = await Billing.create({
      billingNumber: 'BILL-2024-001',
      patient: patient1._id,
      branchId: mainBranch._id,
      visit: visit1._id,
      services: [
        { description: 'Consultation Fee', quantity: 1, unitPrice: 5000, total: 5000 },
        { description: 'Complete Blood Count', quantity: 1, unitPrice: 3000, total: 3000 },
        { description: 'Medications', quantity: 1, unitPrice: 4500, total: 4500 }
      ],
      subtotal: 12500,
      tax: 0,
      discount: 0,
      total: 12500,
      amountPaid: 12500,
      balance: 0,
      status: 'paid',
      createdBy: billingStaff._id,
    });

    const billing2 = await Billing.create({
      billingNumber: 'BILL-2024-002',
      patient: patient2._id,
      branchId: mainBranch._id,
      visit: visit2._id,
      services: [
        { description: 'Consultation Fee', quantity: 1, unitPrice: 5000, total: 5000 },
        { description: 'Allergy Panel Test', quantity: 1, unitPrice: 8000, total: 8000 },
        { description: 'Medications', quantity: 1, unitPrice: 2000, total: 2000 }
      ],
      subtotal: 15000,
      tax: 0,
      discount: 1500,
      total: 13500,
      amountPaid: 7000,
      balance: 6500,
      status: 'partial',
      createdBy: billingStaff._id,
    });

    const billing3 = await Billing.create({
      billingNumber: 'BILL-2024-003',
      patient: patient3._id,
      branchId: mainBranch._id,
      visit: visit3._id,
      services: [
        { description: 'Consultation Fee', quantity: 1, unitPrice: 5000, total: 5000 },
        { description: 'ECG Test', quantity: 1, unitPrice: 4000, total: 4000 },
        { description: 'Lipid Profile', quantity: 1, unitPrice: 5000, total: 5000 }
      ],
      subtotal: 14000,
      tax: 0,
      discount: 0,
      total: 14000,
      amountPaid: 0,
      balance: 14000,
      status: 'pending',
      createdBy: billingStaff._id,
    });

    // Create payment records
    await Payment.create({
      paymentNumber: 'PAY-2024-001',
      patient: patient1._id,
      branchId: mainBranch._id,
      billing: billing1._id,
      amount: 12500,
      paymentMethod: 'Cash',
      status: 'completed',
      processedBy: billingStaff._id,
      notes: 'Full payment received',
      createdAt: new Date(twoDaysAgo.getTime() + 10 * 60 * 60 * 1000 + 35 * 60 * 1000),
    });

    await Payment.create({
      paymentNumber: 'PAY-2024-002',
      patient: patient2._id,
      branchId: mainBranch._id,
      billing: billing2._id,
      amount: 7000,
      paymentMethod: 'Card',
      status: 'completed',
      processedBy: billingStaff._id,
      notes: 'Partial payment - balance to be paid later',
      createdAt: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000 + 45 * 60 * 1000),
    });

    await Payment.create({
      paymentNumber: 'PAY-2024-003',
      patient: patient1._id,
      branchId: mainBranch._id,
      billing: billing1._id,
      amount: 5000,
      paymentMethod: 'Cash',
      status: 'completed',
      processedBy: billingStaff._id,
      notes: 'Additional consultation payment',
      createdAt: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000 + 60 * 60 * 1000),
    });

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Sample Data Created:');
    console.log('- 3 Patients');
    console.log('- 4 Patient Visits (2 completed, 2 in progress)');
    console.log('- 5 Lab Tests (2 completed, 1 in progress, 2 pending)');
    console.log('- 3 Prescriptions (1 dispensed, 2 active)');
    console.log('- 4 Appointments (2 today, 2 tomorrow)');
    console.log('- 3 Billing Records (1 paid, 1 partial, 1 pending)');
    console.log('- 3 Payment Records');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@lifepointmedical.com / admin123');
    console.log('Doctor (Dr. Sarah): dr.sarah@lifepointmedical.com / doctor123');
    console.log('Doctor (Dr. Michael): dr.michael@lifepointmedical.com / doctor123');
    console.log('Front Desk: frontdesk@lifepointmedical.com / desk123');
    console.log('Nurse: nurse@lifepointmedical.com / nurse123');
    console.log('Lab: lab@lifepointmedical.com / lab123');
    console.log('Pharmacy: pharmacy@lifepointmedical.com / pharmacy123');
    console.log('Billing: billing@lifepointmedical.com / billing123');
    console.log('Accounting: accounting@lifepointmedical.com / accounting123');

    return {
      success: true,
      message: 'Database seeded successfully',
      credentials: {
        admin: { email: 'admin@lifepointmedical.com', password: 'admin123' },
        doctor: { email: 'dr.sarah@lifepointmedical.com', password: 'doctor123' },
      }
    };
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return { success: false, message: error.message };
  }
}
