import mongoose, { Document, Schema } from 'mongoose';

export interface IPrescription extends Document {
  prescriptionNumber: string;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  visit: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity: number;
  }[];
  
  diagnosis: string;
  notes?: string;
  status: 'active' | 'dispensed' | 'cancelled';
  dispensedBy?: mongoose.Types.ObjectId;
  dispensedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema = new Schema<IPrescription>({
  prescriptionNumber: { type: String, required: true, unique: true },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  visit: { type: Schema.Types.ObjectId, ref: 'PatientVisit', required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String },
    quantity: { type: Number, required: true }
  }],
  
  diagnosis: { type: String, required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ['active', 'dispensed', 'cancelled'],
    default: 'active'
  },
  dispensedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  dispensedAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
