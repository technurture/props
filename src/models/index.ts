// Central model registry to ensure all Mongoose models are registered
// Import base models first, then dependent models

import Tenant from './Tenant';
import Branch from './Branch';
import User from './User';
import Patient from './Patient';
import PatientCounter from './PatientCounter';
import StaffProfile from './StaffProfile';
import Appointment from './Appointment';
import Attendance from './Attendance';
import PatientVisit from './PatientVisit';
import LabTest from './LabTest';
import Prescription from './Prescription';
import Message from './Message';
import Notification from './Notification';
import Encounter from './Encounter';
import Billing from './Billing';
import Invoice from './Invoice';
import Payment from './Payment';
import ServiceCharge from './ServiceCharge';

// Export all models
export {
  Tenant,
  Branch,
  User,
  Patient,
  PatientCounter,
  StaffProfile,
  Appointment,
  Attendance,
  PatientVisit,
  LabTest,
  Prescription,
  Message,
  Notification,
  Encounter,
  Billing,
  Invoice,
  Payment,
  ServiceCharge,
};
