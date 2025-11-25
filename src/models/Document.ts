import mongoose, { Document, Schema } from 'mongoose';

export interface IDocument extends Document {
  patient: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  
  documentName: string;
  documentType: 'lab_report' | 'imaging' | 'prescription' | 'consent_form' | 'medical_record' | 'insurance' | 'other';
  
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  
  visit?: mongoose.Types.ObjectId;
  labTest?: mongoose.Types.ObjectId;
  prescription?: mongoose.Types.ObjectId;
  
  notes?: string;
  tags?: string[];
  
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  
  documentName: { type: String, required: true },
  documentType: {
    type: String,
    enum: ['lab_report', 'imaging', 'prescription', 'consent_form', 'medical_record', 'insurance', 'other'],
    required: true
  },
  
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String },
  
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  
  visit: { type: Schema.Types.ObjectId, ref: 'PatientVisit' },
  labTest: { type: Schema.Types.ObjectId, ref: 'LabTest' },
  prescription: { type: Schema.Types.ObjectId, ref: 'Prescription' },
  
  notes: { type: String },
  tags: [{ type: String }],
  
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

DocumentSchema.index({ patient: 1, branchId: 1 });
DocumentSchema.index({ documentType: 1 });
DocumentSchema.index({ uploadedAt: -1 });

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
