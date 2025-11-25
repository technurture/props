import mongoose, { Document, Schema } from 'mongoose';

export interface IPatientCounter extends Document {
  date: string;
  counter: number;
  branchId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PatientCounterSchema = new Schema<IPatientCounter>({
  date: { 
    type: String, 
    required: true,
    trim: true
  },
  counter: { 
    type: Number, 
    required: true,
    default: 0,
    min: 0
  },
  branchId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Branch', 
    required: true
  }
}, { timestamps: true });

PatientCounterSchema.index({ date: 1, branchId: 1 }, { unique: true });

export default mongoose.models.PatientCounter || mongoose.model<IPatientCounter>('PatientCounter', PatientCounterSchema);
