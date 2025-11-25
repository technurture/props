import mongoose, { Document, Schema } from 'mongoose';

export interface IBilling extends Document {
  invoiceNumber: string;
  patient: mongoose.Types.ObjectId;
  visit?: mongoose.Types.ObjectId;
  branch: mongoose.Types.ObjectId;
  
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    category: 'consultation' | 'procedure' | 'medication' | 'lab_test' | 'other';
  }[];
  
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  
  status: 'pending' | 'partially_paid' | 'paid' | 'cancelled';
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  
  insurance?: {
    provider: string;
    policyNumber: string;
    claimAmount: number;
    claimStatus: 'pending' | 'approved' | 'rejected';
    approvalNumber?: string;
  };
  
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  dueDate: Date;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const BillingSchema = new Schema<IBilling>({
  invoiceNumber: { type: String, required: true, unique: true },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  visit: { type: Schema.Types.ObjectId, ref: 'PatientVisit' },
  branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
    category: {
      type: String,
      enum: ['consultation', 'procedure', 'medication', 'lab_test', 'other'],
      required: true
    }
  }],
  
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, required: true },
  
  status: {
    type: String,
    enum: ['pending', 'partially_paid', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partially_paid', 'paid'],
    default: 'unpaid'
  },
  
  insurance: {
    provider: { type: String },
    policyNumber: { type: String },
    claimAmount: { type: Number },
    claimStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    approvalNumber: { type: String }
  },
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  dueDate: { type: Date, required: true },
  notes: { type: String },
}, { timestamps: true });

export default mongoose.models.Billing || mongoose.model<IBilling>('Billing', BillingSchema);
