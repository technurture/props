# RBAC Verification Matrix - Life Point Medical Centre EMR

## Overview
This document provides a comprehensive mapping of Role-Based Access Control (RBAC) implementation across all system components for all 8 user roles.

---

## 1. ADMIN (Full System Access)

### Sidebar Menu Access
✅ Dashboard  
✅ Patients (full CRUD)  
✅ Doctors (full CRUD)  
✅ Appointments (full CRUD)  
✅ Visits (full access)  
✅ Laboratory (Lab Results, Medical Results)  
✅ Pharmacy (full access)  
✅ Staff Management (full CRUD)  
✅ Accounting (full access)  
✅ Billing Department (full access)  
✅ Invoices (full CRUD)  
✅ Branch Management (full CRUD)  
✅ Notifications  
✅ Settings  

### Dashboard Features
- Complete system overview
- All statistics and metrics
- Full patient and staff data
- Financial reports
- System health monitoring

### API Permissions
- **Patients**: CREATE, READ, UPDATE, DELETE
- **Appointments**: CREATE, READ, UPDATE, DELETE, ASSIGN
- **Vitals**: CREATE, READ, UPDATE
- **Diagnosis**: CREATE, READ, UPDATE
- **Prescriptions**: CREATE, READ, UPDATE, DELETE
- **Lab Tests**: CREATE, READ, UPDATE, DELETE, APPROVE
- **Pharmacy**: CREATE, READ, UPDATE, DISPENSE
- **Billing**: CREATE, READ, UPDATE, DELETE, PROCESS
- **Accounting**: CREATE, READ, UPDATE, REPORTS
- **Users/Staff**: CREATE, READ, UPDATE, DELETE
- **Branches**: CREATE, READ, UPDATE, DELETE
- **Settings**: READ, UPDATE
- **Reports**: READ, GENERATE

---

## 2. DOCTOR (Clinical Focus)

### Sidebar Menu Access
✅ Dashboard (doctor-specific)  
✅ Patients (view all, update medical info)  
❌ Doctors (no access)  
✅ Appointments (view, update assigned)  
✅ Visits (conduct visits, document)  
✅ Laboratory (view results only)  
✅ Pharmacy (view dispensing status)  
❌ Staff Management (no access)  
❌ Accounting (no access)  
❌ Billing Department (no access - can view basic info only)  
❌ Invoices (no access)  
❌ Branch Management (no access)  
✅ Notifications  
✅ Settings (personal only)  

### Dashboard Features
- Personal appointments queue
- Assigned patients
- Today's schedule
- Clinical metrics
- Pending lab results

### API Permissions
- **Patients**: READ, UPDATE (medical info only)
- **Appointments**: READ, UPDATE
- **Vitals**: READ, CREATE, UPDATE
- **Diagnosis**: CREATE, READ, UPDATE
- **Prescriptions**: CREATE, READ, UPDATE, DELETE
- **Lab Tests**: READ (view only)
- **Pharmacy**: READ
- **Reports**: READ

---

## 3. NURSE (Patient Care Support)

### Sidebar Menu Access
✅ Dashboard (nurse-specific)  
✅ Patients (view only)  
❌ Doctors (no access)  
✅ Appointments (view, update status)  
✅ Visits (update status, handoff to doctor)  
✅ Laboratory (view results)  
✅ Pharmacy (view dispensing info)  
❌ Staff Management (no access)  
❌ Accounting (no access)  
❌ Billing Department (no access)  
❌ Invoices (no access)  
❌ Branch Management (no access)  
✅ Notifications  
✅ Settings (personal only)  

### Dashboard Features
- Patient queue
- Assigned tasks
- Vitals recording interface
- Handoff tracking
- Appointment schedule

### API Permissions
- **Patients**: READ
- **Appointments**: READ, UPDATE
- **Vitals**: CREATE, READ, UPDATE (primary responsibility)
- **Prescriptions**: READ (view only)
- **Lab Tests**: READ
- **Pharmacy**: READ

---

## 4. FRONT DESK / RECEPTION (Patient Entry & Exit)

### Sidebar Menu Access
✅ Dashboard (front desk-specific)  
✅ Patients (create, view, update demographics)  
❌ Doctors (no access)  
✅ Appointments (full control - create, schedule, cancel, assign)  
✅ Visits (start new visit, mark completed)  
❌ Laboratory (no access)  
❌ Pharmacy (no access)  
❌ Staff Management (no access)  
❌ Accounting (no access)  
✅ Billing Department (view invoices, initiate payment)  
✅ Invoices (view, basic operations)  
❌ Branch Management (no access)  
✅ Notifications  
✅ Settings (personal only)  

### Dashboard Features
- Daily appointments
- Patient flow tracking
- Check-in/check-out
- Visit initiation
- Basic billing overview

### API Permissions
- **Patients**: CREATE, READ, UPDATE
- **Appointments**: CREATE, READ, UPDATE, ASSIGN
- **Billing**: READ, CREATE (initiate)
- **Reports**: READ (basic)

---

## 5. LAB TECHNICIAN (Laboratory Management)

### Sidebar Menu Access
✅ Dashboard (lab-specific)  
✅ Patients (view basic info)  
❌ Doctors (no access)  
✅ Appointments (view only - to know expected patients)  
❌ Visits (no access)  
✅ Laboratory (full access - view orders, update results, approve)  
❌ Pharmacy (no access)  
❌ Staff Management (no access)  
❌ Accounting (no access)  
❌ Billing Department (no access)  
❌ Invoices (no access)  
❌ Branch Management (no access)  
✅ Notifications  
✅ Settings (personal only)  

### Dashboard Features
- Pending lab tests queue
- Test results management
- Sample tracking
- Lab-specific reports
- Equipment status

### API Permissions
- **Patients**: READ (basic info)
- **Appointments**: READ
- **Lab Tests**: CREATE, READ, UPDATE, APPROVE (sign-off)
- **Reports**: READ (lab-specific)

---

## 6. PHARMACIST (Medication Dispensing)

### Sidebar Menu Access
✅ Dashboard (pharmacy-specific)  
✅ Patients (view basic info and allergies)  
❌ Doctors (no access)  
✅ Appointments (view only)  
❌ Visits (no access)  
❌ Laboratory (no access)  
✅ Pharmacy (full access - dispense medication, update inventory)  
❌ Staff Management (no access)  
❌ Accounting (no access)  
❌ Billing Department (no access)  
❌ Invoices (no access)  
❌ Branch Management (no access)  
✅ Notifications  
✅ Settings (personal only)  

### Dashboard Features
- Pending prescriptions queue
- Medication inventory
- Dispensing tracking
- Low stock alerts
- Pharmacy reports

### API Permissions
- **Patients**: READ (basic info + allergies)
- **Appointments**: READ
- **Prescriptions**: READ (all), DISPENSE (mark as dispensed)
- **Pharmacy**: CREATE, READ, UPDATE, DISPENSE
- **Reports**: READ (pharmacy-specific)

---

## 7. ACCOUNTANT (Financial Management)

### Sidebar Menu Access
✅ Dashboard (accounting-specific)  
✅ Patients (view basic info for billing context)  
❌ Doctors (no access)  
✅ Appointments (view only)  
❌ Visits (no access)  
❌ Laboratory (no access)  
❌ Pharmacy (no access)  
❌ Staff Management (no access)  
✅ Accounting (full access)  
✅ Billing Department (view all invoices and payments)  
✅ Invoices (full access)  
❌ Branch Management (no access)  
✅ Notifications  
✅ Settings (personal only)  

### Dashboard Features
- Financial metrics
- Revenue reports
- Payment tracking
- Reconciliation tools
- Financial analytics

### API Permissions
- **Patients**: READ (basic info)
- **Billing**: READ (all invoices and payments)
- **Accounting**: CREATE, READ, UPDATE, REPORTS (full financial records)
- **Reports**: READ, GENERATE (financial reports)

---

## 8. BILLING STAFF (Payment Processing)

### Sidebar Menu Access
✅ Dashboard (billing-specific)  
✅ Patients (view basic info)  
❌ Doctors (no access)  
✅ Appointments (view only)  
❌ Visits (no access)  
❌ Laboratory (no access)  
❌ Pharmacy (no access)  
❌ Staff Management (no access)  
❌ Accounting (no access - limited to billing only)  
✅ Billing Department (full access)  
✅ Invoices (create, process payments, issue receipts)  
❌ Branch Management (no access)  
✅ Notifications  
✅ Settings (personal only)  

### Dashboard Features
- Pending payments
- Today's revenue
- Invoice management
- Payment processing
- Receipt generation

### API Permissions
- **Patients**: READ (basic info)
- **Appointments**: READ
- **Billing**: CREATE, READ, UPDATE, PROCESS (payments)
- **Reports**: READ (billing reports)

---

## API Route Protection Summary

### Protected POST/PUT/DELETE Endpoints
✅ `/api/appointments` - FRONT_DESK, ADMIN  
✅ `/api/prescriptions` - DOCTOR, ADMIN  
✅ `/api/pharmacy` - PHARMACY, ADMIN  
✅ `/api/lab-tests` - LAB, ADMIN (Doctors can only view)  
✅ `/api/billing/invoices` - BILLING, ADMIN, FRONT_DESK  
✅ `/api/staff` - ADMIN only  
✅ `/api/visits` - ADMIN, FRONT_DESK, NURSE, DOCTOR  

### Protected GET Endpoints (Enhanced Security)
✅ `/api/staff` - ADMIN only  
✅ `/api/billing/invoices` - BILLING, ACCOUNTING, ADMIN, FRONT_DESK  
✅ `/api/prescriptions` - DOCTOR, PHARMACY, NURSE, ADMIN  

### General Read Access (Authenticated + Data Filtering)
- `/api/patients` - All roles (filtered by branch and role scope)
- `/api/appointments` - All roles (filtered by branch and assignment)
- `/api/visits` - Clinical roles (filtered by branch and involvement)
- `/api/lab-tests` - Clinical + Lab roles (filtered appropriately)
- `/api/pharmacy` - Clinical + Pharmacy roles (filtered appropriately)

---

## Frontend Component Protection

### Sidebar Menu Filtering
Implemented via `filterMenuByRole()` function in `sidebar.tsx`
- Automatically filters menu items based on `allowedRoles` array
- Nested submenus also filtered
- Dynamic rendering based on user session role

### Dashboard Routing
Implemented via `RoleDashboardRouter.tsx`
- Role-specific dashboard components:
  - AdminDashboard.tsx
  - DoctorDashboard.tsx
  - NurseDashboard.tsx
  - LabDashboard.tsx
  - PharmacyDashboard.tsx
  - BillingDashboard.tsx
  - AccountingDashboard.tsx
  - FrontDeskDashboard.tsx

### Permission Gate Component
`PermissionGate.tsx` component available for fine-grained UI control
- Uses `usePermissions` hook
- Supports `requireAll` or `canAny` logic
- Fallback rendering for unauthorized access

---

## Security Implementation Details

### Middleware Stack
1. **requireAuth**: Basic authentication check
2. **checkRole**: Role-based access control
3. **requirePermission**: Fine-grained permission check
4. **withBranchScope**: Branch-level data isolation
5. **canModifyResource**: Resource ownership verification

### Permission System
- **ROLE_PERMISSIONS** mapping in `rbac.ts`
- **ResourceAction** types for all operations
- **Role hierarchy** for permission inheritance
- **Branch filtering** for multi-location support

### Data-Level Security
- Branch-scoped queries via `buildRoleScopedFilters()`
- Role-based data filtering in GET endpoints
- Owner-based access control for user data
- Automatic population of user context

---

## Testing Checklist

### For Each Role:
- [ ] Login with role credentials
- [ ] Verify sidebar shows only authorized menu items
- [ ] Check dashboard displays role-appropriate data
- [ ] Test unauthorized menu access (should redirect/error)
- [ ] Verify API calls succeed for allowed operations
- [ ] Confirm API calls fail for forbidden operations
- [ ] Check data filtering (only see relevant records)
- [ ] Verify branch scoping works correctly

### Cross-Role Testing:
- [ ] Admin can access all features
- [ ] Doctor cannot access billing/accounting
- [ ] Nurse cannot create prescriptions
- [ ] Front desk cannot approve lab tests
- [ ] Lab cannot access pharmacy
- [ ] Pharmacist cannot access lab
- [ ] Accountant cannot access medical records
- [ ] Billing cannot access full accounting

---

## Test User Credentials

For testing RBAC functionality, use these seeded accounts:

| Role | Email | Password | Name |
|------|-------|----------|------|
| ADMIN | admin@lifepointmedical.com | admin123 | Super Administrator |
| DOCTOR | dr.sarah@lifepointmedical.com | doctor123 | Dr. Sarah Johnson |
| DOCTOR | dr.michael@lifepointmedical.com | doctor123 | Dr. Michael Chen |
| NURSE | nurse@lifepointmedical.com | nurse123 | Mary Williams |
| FRONT_DESK | frontdesk@lifepointmedical.com | desk123 | Jane Smith |
| LAB | lab@lifepointmedical.com | lab123 | James Anderson |
| PHARMACY | pharmacy@lifepointmedical.com | pharmacy123 | Patricia Brown |
| BILLING | billing@lifepointmedical.com | billing123 | Robert Davis |
| ACCOUNTING | accounting@lifepointmedical.com | accounting123 | Elizabeth Thompson |

---

## Notes

1. All API routes use NextAuth session for authentication
2. Role information stored in JWT session token
3. Branch filtering ensures multi-location data isolation
4. Permission checks happen both frontend (UX) and backend (security)
5. Audit logging recommended for sensitive operations (future enhancement)

## Security Enhancements Applied (October 6, 2025)

Enhanced API endpoint protection for sensitive data:

1. **Staff GET** (`/api/staff`) - Restricted to ADMIN only
2. **Billing/Invoices GET** (`/api/billing/invoices`) - Restricted to BILLING, ACCOUNTING, ADMIN, FRONT_DESK
3. **Prescriptions GET** (`/api/prescriptions`) - Restricted to DOCTOR, PHARMACY, NURSE, ADMIN
4. **Documents GET** (`/api/documents`) - Restricted to ADMIN, DOCTOR, NURSE, FRONT_DESK

All enhancements reviewed and approved by system architect.

Last Updated: October 11, 2025
