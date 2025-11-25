import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  patientId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: Date;
  age?: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  phoneNumber: string;
  email?: string;
  address: string;
  address2?: string;
  city?: string;
  state?: string;
  lga?: string;
  ward?: string;
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
  };
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  notes?: string;
  chiefComplaint?: string;
  insurance?: {
    insuranceId?: mongoose.Types.ObjectId;
    policyNumber?: string;
    groupNumber?: string;
    subscriberName?: string;
    subscriberRelationship?: string;
    validFrom?: Date;
    validUntil?: Date;
  };
  registeredBy: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  profileImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  getFullName(): string;
  getAge(): number;
}

const PatientSchema = new Schema<IPatient>({
  patientId: { 
    type: String, 
    required: [true, 'Patient ID is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  firstName: { 
    type: String, 
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: { 
    type: String, 
    required: [true, 'Last name is required'],
    trim: true
  },
  middleName: { 
    type: String,
    trim: true
  },
  dateOfBirth: { 
    type: Date
  },
  age: {
    type: Number,
    min: 0,
    max: 150
  },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  bloodGroup: { 
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  phoneNumber: { 
    type: String, 
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: { 
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true;
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  address: { 
    type: String, 
    required: [true, 'Address is required'],
    trim: true
  },
  address2: { 
    type: String,
    trim: true
  },
  city: { 
    type: String,
    trim: true
  },
  state: { 
    type: String,
    trim: true
  },
  lga: { 
    type: String,
    trim: true
  },
  ward: { 
    type: String,
    trim: true
  },
  country: { 
    type: String, 
    required: [true, 'Country is required'],
    default: 'Nigeria',
    trim: true
  },
  zipCode: { 
    type: String,
    trim: true
  },
  maritalStatus: { 
    type: String,
    trim: true
  },
  patientType: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  referredBy: {
    type: String,
    trim: true
  },
  referredOn: {
    type: Date
  },
  department: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: { 
      type: String, 
      required: [true, 'Emergency contact name is required'],
      trim: true
    },
    relationship: { 
      type: String, 
      required: [true, 'Emergency contact relationship is required'],
      trim: true
    },
    phoneNumber: { 
      type: String, 
      required: [true, 'Emergency contact phone is required'],
      trim: true
    }
  },
  allergies: {
    type: [String],
    default: []
  },
  chronicConditions: {
    type: [String],
    default: []
  },
  medications: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    trim: true
  },
  chiefComplaint: {
    type: String,
    trim: true
  },
  insurance: {
    insuranceId: { type: Schema.Types.ObjectId, ref: 'Insurance' },
    policyNumber: { type: String, trim: true },
    groupNumber: { type: String, trim: true },
    subscriberName: { type: String, trim: true },
    subscriberRelationship: { 
      type: String, 
      enum: ['Self', 'Spouse', 'Child', 'Parent', 'Other'],
      trim: true 
    },
    validFrom: { type: Date },
    validUntil: { type: Date }
  },
  registeredBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Registered by is required']
  },
  branchId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Branch', 
    required: [true, 'Branch is required']
  },
  profileImage: { 
    type: String,
    trim: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

PatientSchema.methods.getFullName = function(): string {
  return this.middleName 
    ? `${this.firstName} ${this.middleName} ${this.lastName}`
    : `${this.firstName} ${this.lastName}`;
};

PatientSchema.methods.getAge = function(): number {
  if (!this.dateOfBirth) {
    return 0;
  }
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

PatientSchema.index({ branchId: 1 });
PatientSchema.index({ firstName: 1, lastName: 1 });
PatientSchema.index({ phoneNumber: 1 });
PatientSchema.index({ email: 1 });
PatientSchema.index({ isActive: 1 });

export default mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);
