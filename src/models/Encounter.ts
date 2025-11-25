import mongoose, { Document, Schema } from 'mongoose';
import { ClockStatus } from '@/types/emr';

export interface IHandoff {
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  timestamp: Date;
  notes?: string;
}

export interface IVitals {
  temperature?: number;
  bloodPressure?: string;
  pulse?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface IEncounter extends Document {
  encounterId: string;
  patientId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  clockStatus: ClockStatus;
  currentStaff?: mongoose.Types.ObjectId;
  currentStage?: string;
  vitals: IVitals;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  labTests: string[];
  prescriptions: string[];
  handoffHistory: IHandoff[];
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  createdAt: Date;
  updatedAt: Date;
}

const HandoffSchema = new Schema<IHandoff>({
  from: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  to: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  notes: { 
    type: String,
    trim: true
  }
}, { _id: false });

const VitalsSchema = new Schema<IVitals>({
  temperature: { type: Number },
  bloodPressure: { type: String },
  pulse: { type: Number },
  weight: { type: Number },
  height: { type: Number },
  bmi: { type: Number }
}, { _id: false });

const EncounterSchema = new Schema<IEncounter>({
  encounterId: { 
    type: String, 
    required: [true, 'Encounter ID is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  patientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: [true, 'Patient is required']
  },
  appointmentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Appointment'
  },
  branchId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Branch', 
    required: [true, 'Branch is required']
  },
  clockStatus: {
    type: String,
    enum: Object.values(ClockStatus),
    default: ClockStatus.CLOCKED_IN
  },
  currentStaff: { 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  currentStage: { 
    type: String,
    trim: true
  },
  vitals: {
    type: VitalsSchema,
    default: {}
  },
  chiefComplaint: { 
    type: String,
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
  labTests: {
    type: [String],
    default: []
  },
  prescriptions: {
    type: [String],
    default: []
  },
  handoffHistory: {
    type: [HandoffSchema],
    default: []
  },
  startTime: { 
    type: Date, 
    default: Date.now 
  },
  endTime: { 
    type: Date 
  },
  totalDuration: { 
    type: Number
  }
}, { timestamps: true });

EncounterSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.totalDuration = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 60000);
  }
  next();
});

EncounterSchema.index({ patientId: 1 });
EncounterSchema.index({ branchId: 1 });
EncounterSchema.index({ clockStatus: 1 });
EncounterSchema.index({ currentStaff: 1 });
EncounterSchema.index({ startTime: 1 });

export default mongoose.models.Encounter || mongoose.model<IEncounter>('Encounter', EncounterSchema);
