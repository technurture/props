import mongoose, { Document, Schema } from 'mongoose';

export interface IPatientVisit extends Document {
  visitNumber: string;
  patient: mongoose.Types.ObjectId;
  appointment?: mongoose.Types.ObjectId;
  assignedDoctor?: mongoose.Types.ObjectId;
  assignedNurse?: mongoose.Types.ObjectId;
  assignedLab?: mongoose.Types.ObjectId;
  assignedPharmacy?: mongoose.Types.ObjectId;
  assignedBilling?: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  visitDate: Date;
  visitType?: 'outpatient' | 'inpatient' | 'emergency' | 'lab_only';
  admissionId?: mongoose.Types.ObjectId;
  currentStage: 'front_desk' | 'nurse' | 'doctor' | 'lab' | 'pharmacy' | 'billing' | 'returned_to_front_desk' | 'completed';
  status: 'in_progress' | 'completed' | 'cancelled';
  labOnly?: boolean;
  supervisingDoctor?: mongoose.Types.ObjectId;
  
  stages: {
    frontDesk?: {
      clockedInBy: mongoose.Types.ObjectId;
      clockedInAt: Date;
      clockedOutBy?: mongoose.Types.ObjectId;
      clockedOutAt?: Date;
      notes?: string;
      nextAction?: string;
    };
    nurse?: {
      clockedInBy: mongoose.Types.ObjectId;
      clockedInAt: Date;
      clockedOutBy?: mongoose.Types.ObjectId;
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
      clockedInBy: mongoose.Types.ObjectId;
      clockedInAt: Date;
      clockedOutBy?: mongoose.Types.ObjectId;
      clockedOutAt?: Date;
      chiefComplaint?: string;
      historyOfPresentIllness?: string;
      physicalExamination?: string;
      diagnosis?: string;
      treatmentPlan?: string;
      prescriptions?: any[];
      labOrders?: Array<{
        testName: string;
        serviceChargeId?: string;
        category?: string;
      }>;
      followUpInstructions?: string;
      prescription?: mongoose.Types.ObjectId;
      labTests?: mongoose.Types.ObjectId[];
      notes?: string;
      nextAction?: string;
    };
    lab?: {
      clockedInBy?: mongoose.Types.ObjectId;
      clockedInAt?: Date;
      clockedOutBy?: mongoose.Types.ObjectId;
      clockedOutAt?: Date;
      notes?: string;
      nextAction?: string;
    };
    pharmacy?: {
      clockedInBy?: mongoose.Types.ObjectId;
      clockedInAt?: Date;
      clockedOutBy?: mongoose.Types.ObjectId;
      clockedOutAt?: Date;
      notes?: string;
      nextAction?: string;
    };
    billing?: {
      clockedInBy?: mongoose.Types.ObjectId;
      clockedInAt?: Date;
      clockedOutBy?: mongoose.Types.ObjectId;
      clockedOutAt?: Date;
      notes?: string;
      nextAction?: string;
    };
    returnedToFrontDesk?: {
      clockedInBy?: mongoose.Types.ObjectId;
      clockedInAt?: Date;
      clockedOutBy?: mongoose.Types.ObjectId;
      clockedOutAt?: Date;
      notes?: string;
      nextAction?: string;
    };
  };
  
  finalClockOut?: {
    clockedOutBy: mongoose.Types.ObjectId;
    clockedOutAt: Date;
    notes?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const PatientVisitSchema = new Schema<IPatientVisit>({
  visitNumber: { type: String, required: true, unique: true },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
  assignedDoctor: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedNurse: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedLab: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedPharmacy: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedBilling: { type: Schema.Types.ObjectId, ref: 'User' },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  visitDate: { type: Date, required: true, default: Date.now },
  visitType: {
    type: String,
    enum: ['outpatient', 'inpatient', 'emergency', 'lab_only'],
    default: 'outpatient'
  },
  admissionId: { type: Schema.Types.ObjectId, ref: 'Admission' },
  labOnly: { type: Boolean, default: false },
  supervisingDoctor: { type: Schema.Types.ObjectId, ref: 'User' },
  currentStage: {
    type: String,
    enum: ['front_desk', 'nurse', 'doctor', 'lab', 'pharmacy', 'billing', 'returned_to_front_desk', 'completed'],
    default: 'front_desk'
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'cancelled'],
    default: 'in_progress'
  },
  stages: {
    frontDesk: {
      clockedInBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clockedInAt: { type: Date },
      clockedOutBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clockedOutAt: { type: Date },
      notes: { type: String },
      nextAction: { type: String }
    },
    nurse: {
      clockedInBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clockedInAt: { type: Date },
      clockedOutBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clockedOutAt: { type: Date },
      vitalSigns: {
        bloodPressure: { type: String },
        temperature: { type: Number },
        pulse: { type: Number },
        weight: { type: Number },
        height: { type: Number },
        bmi: { type: Number }
      },
      notes: { type: String },
      nextAction: { type: String }
    },
    doctor: {
      clockedInBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clockedInAt: { type: Date },
      clockedOutBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clockedOutAt: { type: Date },
      chiefComplaint: { type: String },
      historyOfPresentIllness: { type: String },
      physicalExamination: { type: String },
      diagnosis: { type: String },
      treatmentPlan: { type: String },
      prescriptions: [{ type: Schema.Types.Mixed }],
      labOrders: [{
        testName: { type: String },
        serviceChargeId: { type: String },
        category: { type: String }
      }],
      followUpInstructions: { type: String },
      prescription: { type: Schema.Types.ObjectId, ref: 'Prescription' },
      labTests: [{ type: Schema.Types.ObjectId, ref: 'LabTest' }],
      notes: { type: String },
      nextAction: { type: String }
    },
    lab: {
      clockedInBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clockedInAt: { type: Date },
      clockedOutBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clockedOutAt: { type: Date },
      notes: { type: String },
      nextAction: { type: String }
    },
    pharmacy: {
      clockedInBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clockedInAt: { type: Date },
      clockedOutBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clockedOutAt: { type: Date },
      notes: { type: String },
      nextAction: { type: String }
    },
    billing: {
      clockedInBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clockedInAt: { type: Date },
      clockedOutBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clockedOutAt: { type: Date },
      notes: { type: String },
      nextAction: { type: String }
    },
    returnedToFrontDesk: {
      clockedInBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clockedInAt: { type: Date },
      clockedOutBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clockedOutAt: { type: Date },
      notes: { type: String },
      nextAction: { type: String }
    }
  },
  finalClockOut: {
    clockedOutBy: { type: Schema.Types.ObjectId, ref: 'User' },
    clockedOutAt: { type: Date },
    notes: { type: String }
  }
}, { timestamps: true });

PatientVisitSchema.index({ branchId: 1, assignedLab: 1 });
PatientVisitSchema.index({ branchId: 1, assignedPharmacy: 1 });
PatientVisitSchema.index({ branchId: 1, assignedBilling: 1 });

export default mongoose.models.PatientVisit || mongoose.model<IPatientVisit>('PatientVisit', PatientVisitSchema);
