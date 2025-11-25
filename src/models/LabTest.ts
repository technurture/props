import mongoose, { Document, Schema } from 'mongoose';

export interface ILabTest extends Document {
  testNumber: string;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  visit: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  
  testName: string;
  testCategory: string;
  description?: string;
  serviceCharge?: mongoose.Types.ObjectId;
  
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  
  result?: {
    findings: string;
    normalRange?: string;
    remarks?: string;
    attachments?: string[];
    performedBy: mongoose.Types.ObjectId;
    completedAt: Date;
  };
  
  priority: 'routine' | 'urgent' | 'stat';
  requestedBy: mongoose.Types.ObjectId;
  requestedAt: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const LabTestSchema = new Schema<ILabTest>({
  testNumber: { type: String, required: true, unique: true },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  visit: { type: Schema.Types.ObjectId, ref: 'PatientVisit', required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  
  testName: { type: String, required: true },
  testCategory: { type: String, required: true },
  description: { type: String },
  serviceCharge: { type: Schema.Types.ObjectId, ref: 'ServiceCharge' },
  
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  result: {
    findings: { type: String },
    normalRange: { type: String },
    remarks: { type: String },
    attachments: [{ type: String }],
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date }
  },
  
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'stat'],
    default: 'routine'
  },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  requestedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.LabTest || mongoose.model<ILabTest>('LabTest', LabTestSchema);
