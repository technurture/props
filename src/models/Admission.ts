import mongoose, { Document, Schema } from 'mongoose';

export enum AdmissionStatus {
  ADMITTED = 'ADMITTED',
  DISCHARGED = 'DISCHARGED',
  TRANSFERRED = 'TRANSFERRED',
  CANCELLED = 'CANCELLED'
}

export enum AdmissionType {
  EMERGENCY = 'EMERGENCY',
  SCHEDULED = 'SCHEDULED',
  OBSERVATION = 'OBSERVATION',
  DAY_CARE = 'DAY_CARE'
}

export interface IDailyNote {
  date: Date;
  doctorId: mongoose.Types.ObjectId;
  nurseId?: mongoose.Types.ObjectId;
  notes: string;
  vitalSigns?: {
    bloodPressure?: string;
    temperature?: number;
    pulse?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  medications?: string[];
  procedures?: string[];
  createdAt: Date;
}

export interface IAdmission extends Document {
  admissionNumber: string;
  patientId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  visitId?: mongoose.Types.ObjectId;
  
  admissionDate: Date;
  dischargeDate?: Date;
  expectedDischargeDate?: Date;
  
  status: AdmissionStatus;
  type: AdmissionType;
  
  admittingDoctorId: mongoose.Types.ObjectId;
  primaryDoctorId: mongoose.Types.ObjectId;
  
  ward?: string;
  room?: string;
  bed?: string;
  
  admissionReason: string;
  diagnosis?: string;
  treatmentPlan?: string;
  dischargeSummary?: string;
  
  dailyNotes: IDailyNote[];
  
  dailyRate?: number;
  totalBillingAmount?: number;
  
  dischargedBy?: mongoose.Types.ObjectId;
  dischargeNotes?: string;
  
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  calculateTotalBilling(): number;
}

const DailyNoteSchema = new Schema<IDailyNote>({
  date: { type: Date, required: true, default: Date.now },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  nurseId: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, required: true },
  vitalSigns: {
    bloodPressure: { type: String },
    temperature: { type: Number },
    pulse: { type: Number },
    respiratoryRate: { type: Number },
    oxygenSaturation: { type: Number }
  },
  medications: [{ type: String }],
  procedures: [{ type: String }]
}, { timestamps: true });

const AdmissionSchema = new Schema<IAdmission>({
  admissionNumber: {
    type: String,
    required: [true, 'Admission number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient is required'],
    index: true
  },
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch is required'],
    index: true
  },
  visitId: {
    type: Schema.Types.ObjectId,
    ref: 'PatientVisit'
  },
  admissionDate: {
    type: Date,
    required: [true, 'Admission date is required'],
    default: Date.now,
    index: true
  },
  dischargeDate: {
    type: Date,
    index: true
  },
  expectedDischargeDate: {
    type: Date
  },
  status: {
    type: String,
    enum: Object.values(AdmissionStatus),
    default: AdmissionStatus.ADMITTED,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(AdmissionType),
    required: [true, 'Admission type is required']
  },
  admittingDoctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Admitting doctor is required']
  },
  primaryDoctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Primary doctor is required']
  },
  ward: {
    type: String,
    trim: true
  },
  room: {
    type: String,
    trim: true
  },
  bed: {
    type: String,
    trim: true
  },
  admissionReason: {
    type: String,
    required: [true, 'Admission reason is required'],
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  treatmentPlan: {
    type: String,
    trim: true
  },
  dischargeSummary: {
    type: String,
    trim: true
  },
  dailyNotes: [DailyNoteSchema],
  dailyRate: {
    type: Number,
    min: 0
  },
  totalBillingAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  dischargedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  dischargeNotes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  }
}, { timestamps: true });

AdmissionSchema.index({ patientId: 1, admissionDate: -1 });
AdmissionSchema.index({ status: 1, branchId: 1 });

AdmissionSchema.methods.calculateTotalBilling = function(): number {
  if (!this.dailyRate || !this.admissionDate) return 0;
  
  const endDate = this.dischargeDate || new Date();
  const daysDiff = Math.ceil((endDate.getTime() - this.admissionDate.getTime()) / (1000 * 60 * 60 * 24));
  const days = Math.max(1, daysDiff);
  
  return this.dailyRate * days;
};

AdmissionSchema.pre('save', function(next) {
  if (this.dailyRate) {
    this.totalBillingAmount = this.calculateTotalBilling();
  }
  next();
});

AdmissionSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate() as any;
  
  if (update && update.$set && (update.$set.dischargeDate || update.$set.dailyRate)) {
    const docToUpdate = await this.model.findOne(this.getQuery());
    
    if (docToUpdate && docToUpdate.dailyRate) {
      const dischargeDate = update.$set.dischargeDate || docToUpdate.dischargeDate || new Date();
      const admissionDate = docToUpdate.admissionDate;
      const dailyRate = update.$set.dailyRate || docToUpdate.dailyRate;
      
      const daysDiff = Math.ceil((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));
      const days = Math.max(1, daysDiff);
      
      update.$set.totalBillingAmount = dailyRate * days;
    }
  }
  
  next();
});

export default mongoose.models.Admission || mongoose.model<IAdmission>('Admission', AdmissionSchema);
