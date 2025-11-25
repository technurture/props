export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  FRONT_DESK = 'FRONT_DESK',
  NURSE = 'NURSE',
  DOCTOR = 'DOCTOR',
  LAB = 'LAB',
  PHARMACY = 'PHARMACY',
  BILLING = 'BILLING',
  ACCOUNTING = 'ACCOUNTING'
}

export enum ClockStatus {
  CLOCKED_IN = 'CLOCKED_IN',
  WITH_NURSE = 'WITH_NURSE',
  WITH_DOCTOR = 'WITH_DOCTOR',
  WITH_LAB = 'WITH_LAB',
  WITH_PHARMACY = 'WITH_PHARMACY',
  WITH_BILLING = 'WITH_BILLING',
  COMPLETED = 'COMPLETED',
  CHECKED_OUT = 'CHECKED_OUT'
}

export interface User {
  _id?: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  branchId: string | Branch;
  assignedBranch?: string | Branch;
  profileImage?: string;
  hospitalName?: string;
  addressLine1?: string;
  addressLine2?: string;
  pincode?: string;
  country?: string;
  state?: string;
  city?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Branch {
  _id?: string;
  name: string;
  code?: string;
  address: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  country: string;
  manager?: any;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Patient {
  _id?: string;
  patientId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  age?: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  phoneNumber: string;
  phone?: string;
  email?: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  maritalStatus?: string;
  patientType?: string;
  companyName?: string;
  referredBy?: string;
  referredOn?: Date;
  department?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
    phone?: string;
  };
  allergies?: string[];
  chronicConditions?: string[];
  medications?: string[];
  notes?: string;
  chiefComplaint?: string;
  insurance?: {
    provider: string;
    policyNumber: string;
    validUntil?: Date;
  };
  registeredBy?: string;
  branch: string | Branch;
  branchId?: string | Branch;
  profileImage?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Appointment {
  _id?: string;
  appointmentId: string;
  patient: string | Patient;
  doctor?: string;
  branch: string | Branch;
  appointmentDate: Date;
  appointmentTime: string;
  reason: string;
  status: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show';
  clockStatus?: ClockStatus;
  notes?: string;
  vitals?: {
    temperature?: number;
    bloodPressure?: string;
    pulse?: number;
    weight?: number;
    height?: number;
    bmi?: number;
  };
  diagnosis?: string;
  prescription?: string;
  labTests?: string[];
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StaffProfile {
  _id?: string;
  userId: string;
  specialization?: string;
  licenseNumber?: string;
  department?: string;
  bio?: string;
  profileImage?: string;
  workSchedule?: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Doctor {
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  branchId: string | Branch;
  isActive: boolean;
  profile?: StaffProfile;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Staff {
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  branchId: string | Branch;
  isActive: boolean;
  profile?: StaffProfile;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PatientVisit {
  _id?: string;
  visitNumber: string;
  patient: string | Patient;
  appointment?: string | Appointment;
  assignedDoctor?: string | Doctor | any;
  assignedNurse?: string | Staff | any;
  assignedLab?: string | Staff | any;
  assignedPharmacy?: string | Staff | any;
  assignedBilling?: string | Staff | any;
  supervisingDoctor?: string | Doctor | any;
  branchId: string | Branch;
  visitDate: Date;
  visitType?: 'outpatient' | 'inpatient' | 'emergency' | 'lab_only';
  labOnly?: boolean;
  admissionId?: string;
  currentStage: 'front_desk' | 'nurse' | 'doctor' | 'lab' | 'pharmacy' | 'billing' | 'returned_to_front_desk' | 'completed';
  status: 'in_progress' | 'completed' | 'cancelled';
  stages: {
    frontDesk?: {
      clockedInBy?: string | any;
      clockedInAt?: Date;
      clockedOutBy?: string | any;
      clockedOutAt?: Date;
      notes?: string;
      nextAction?: string;
    };
    nurse?: {
      clockedInBy?: string | any;
      clockedInAt?: Date;
      clockedOutBy?: string | any;
      clockedOutAt?: Date;
      vitalSigns?: {
        bloodPressure?: string;
        temperature?: number;
        pulse?: number;
        weight?: number;
        height?: number;
        bmi?: number;
      };
      notes?: string;
      nextAction?: string;
    };
    doctor?: {
      clockedInBy?: string | any;
      clockedInAt?: Date;
      clockedOutBy?: string | any;
      clockedOutAt?: Date;
      chiefComplaint?: string;
      historyOfPresentIllness?: string;
      physicalExamination?: string;
      diagnosis?: string;
      treatmentPlan?: string;
      prescriptions?: Array<{
        medicineName: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
      }>;
      labOrders?: Array<string | {
        testName: string;
        serviceChargeId?: string;
        category?: string;
        _id?: string;
      }>;
      followUpInstructions?: string;
      prescription?: string;
      labTests?: string[];
      notes?: string;
      nextAction?: string;
    };
    lab?: {
      clockedInBy?: string | any;
      clockedInAt?: Date;
      clockedOutBy?: string | any;
      clockedOutAt?: Date;
      notes?: string;
      nextAction?: string;
    };
    pharmacy?: {
      clockedInBy?: string | any;
      clockedInAt?: Date;
      clockedOutBy?: string | any;
      clockedOutAt?: Date;
      notes?: string;
      nextAction?: string;
    };
    billing?: {
      clockedInBy?: string | any;
      clockedInAt?: Date;
      clockedOutBy?: string | any;
      clockedOutAt?: Date;
      notes?: string;
      nextAction?: string;
    };
    returnedToFrontDesk?: {
      clockedInBy?: string | any;
      clockedInAt?: Date;
      clockedOutBy?: string | any;
      clockedOutAt?: Date;
      notes?: string;
      nextAction?: string;
    };
  };
  finalClockOut?: {
    clockedOutBy?: string | any;
    clockedOutAt?: Date;
    notes?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Pharmacy {
  _id?: string;
  productId: string;
  productName: string;
  genericName?: string;
  category?: string;
  manufacturer?: string;
  description?: string;
  price: number;
  offerPrice?: number;
  purchaseDate: Date | string;
  expiryDate: Date | string;
  stock: number;
  unit: string;
  minStockLevel?: number;
  batchNumber?: string;
  branchId: string | Branch;
  isActive: boolean;
  createdBy?: string | any;
  isExpired?: boolean;
  isLowStock?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceCharge {
  _id?: string;
  serviceName: string;
  category: 'consultation' | 'laboratory' | 'pharmacy' | 'procedure' | 'imaging' | 'emergency' | 'admission' | 'other';
  price: number;
  billingType?: 'flat_rate' | 'per_day' | 'per_hour';
  description?: string;
  isActive: boolean;
  branch?: string | Branch;
  createdBy?: string | any;
  updatedBy?: string | any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
